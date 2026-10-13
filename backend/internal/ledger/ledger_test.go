package ledger

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/db"
)

func setupTestDB(t *testing.T) int64 {
	t.Helper()
	tmp := t.TempDir()
	if err := db.Init(filepath.Join(tmp, "ledger_test.db")); err != nil {
		t.Fatalf("db init failed: %v", err)
	}
	t.Cleanup(db.Close)

	res, err := db.DB.Exec("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'owner')", "owner@test.com", "hash")
	if err != nil {
		t.Fatalf("create test owner: %v", err)
	}
	userID, _ := res.LastInsertId()
	return userID
}

func TestGetTodayEntries_Initialization(t *testing.T) {
	userID := setupTestDB(t)

	// Add 2 products
	_, err := db.DB.Exec("INSERT INTO products (user_id, name, price, stock) VALUES (?, 'Rice 50kg', 35000, 20), (?, 'Beans 50kg', 40000, 15)", userID, userID)
	if err != nil {
		t.Fatalf("insert products: %v", err)
	}

	entries, err := GetTodayEntries(userID)
	if err != nil {
		t.Fatalf("GetTodayEntries failed: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	for _, e := range entries {
		if e.ProductName == "Rice 50kg" {
			if e.Opening != 20 || e.Price != 35000 {
				t.Errorf("Rice entry mismatch: opening=%d, price=%d", e.Opening, e.Price)
			}
		}
		if e.Closing != nil {
			t.Errorf("expected nil closing on fresh day, got %v", *e.Closing)
		}
	}
}

func TestCloseDay_AutoFillsAndUpdatesMasterStock(t *testing.T) {
	userID := setupTestDB(t)

	res, err := db.DB.Exec("INSERT INTO products (user_id, name, price, stock) VALUES (?, 'Oil 25L', 25000, 10)", userID)
	if err != nil {
		t.Fatalf("insert product: %v", err)
	}
	productID, _ := res.LastInsertId()

	today := db.GetToday()
	entries, err := GetTodayEntries(userID)
	if err != nil || len(entries) == 0 {
		t.Fatalf("GetTodayEntries: %v", err)
	}

	// Record 5 receipts (total available = 15). Leave closing count empty/nil.
	r := 5
	_, err = UpdateEntry(today, productID, userID, nil, &r, nil, nil, false)
	if err != nil {
		t.Fatalf("UpdateEntry: %v", err)
	}

	// Close Day
	if err := CloseDay(today, userID); err != nil {
		t.Fatalf("CloseDay failed: %v", err)
	}

	// 1. Verify closing count auto-filled to opening + receipts (10 + 5 = 15)
	var closing sqlNullInt
	err = db.DB.QueryRow("SELECT closing FROM entries WHERE day_date = ? AND product_id = ? AND user_id = ?", today, productID, userID).Scan(&closing.val)
	if err != nil {
		t.Fatalf("query closing: %v", err)
	}
	if closing.val != 15 {
		t.Errorf("expected closing auto-filled to 15, got %d", closing.val)
	}

	// 2. Verify product master stock updated to 15
	var masterStock int
	err = db.DB.QueryRow("SELECT stock FROM products WHERE id = ?", productID).Scan(&masterStock)
	if err != nil {
		t.Fatalf("query master stock: %v", err)
	}
	if masterStock != 15 {
		t.Errorf("expected master stock updated to 15, got %d", masterStock)
	}

	// 3. Verify day is marked closed
	var closedAt sqlNullString
	err = db.DB.QueryRow("SELECT closed_at FROM days WHERE date = ? AND user_id = ?", today, userID).Scan(&closedAt.val)
	if err != nil || closedAt.val == "" {
		t.Errorf("expected day closed_at to be non-empty, got %v", closedAt.val)
	}
}

func TestRollOver_AutoSyncFromPreviousClosedDay(t *testing.T) {
	userID := setupTestDB(t)

	res, err := db.DB.Exec("INSERT INTO products (user_id, name, price, stock) VALUES (?, 'Sugar 50kg', 18000, 30)", userID)
	if err != nil {
		t.Fatalf("insert product: %v", err)
	}
	productID, _ := res.LastInsertId()

	pastDate := "2026-09-01"
	_, _ = db.DB.Exec("INSERT INTO days (user_id, date, closed_at) VALUES (?, ?, CURRENT_TIMESTAMP)", userID, pastDate)
	// Past closing was 12
	_, _ = db.DB.Exec("INSERT INTO entries (user_id, day_date, product_id, opening, receipts, closing, price) VALUES (?, ?, ?, 30, 0, 12, 18000)", userID, pastDate, productID)

	// Triggering today's entries should auto-sync from last closed day
	entries, err := GetTodayEntries(userID)
	if err != nil {
		t.Fatalf("GetTodayEntries: %v", err)
	}

	if len(entries) == 0 {
		t.Fatalf("expected entries")
	}

	if entries[0].Opening != 12 {
		t.Errorf("expected rolled-over opening stock to be 12, got %d", entries[0].Opening)
	}
}

func TestStaffRedaction_PricesHidden(t *testing.T) {
	userID := setupTestDB(t)

	_, err := db.DB.Exec("INSERT INTO products (user_id, name, price, stock) VALUES (?, 'Bread', 1500, 50)", userID)
	if err != nil {
		t.Fatalf("insert product: %v", err)
	}

	req := httptest.NewRequest("GET", "/api/ledger/today", nil)
	// Staff context
	staffUser := auth.User{ID: 99, Email: "staff@test.com", Role: "staff", OwnerID: &userID}
	ctx := context.WithValue(req.Context(), auth.UserKey, staffUser)
	ctx = context.WithValue(ctx, auth.ScopeIDKey, userID)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()
	TodayHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w.Code)
	}

	var resp struct {
		Entries []map[string]interface{} `json:"entries"`
	}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(resp.Entries) == 0 {
		t.Fatalf("expected entries in staff response")
	}

	// Verify price is omitted or 0 for staff
	entry := resp.Entries[0]
	if p, ok := entry["price"]; ok && p.(float64) > 0 {
		t.Errorf("price should be redacted for staff, got %v", p)
	}
}

type sqlNullInt struct {
	val int
}

type sqlNullString struct {
	val string
}
