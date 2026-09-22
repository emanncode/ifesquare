package products

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/db"
)

type importedEntry struct {
	name     string
	opening  int
	receipts int
	closing  int
	price    int
}

func runImport(t *testing.T, csvBody string) (map[string]interface{}, []importedEntry) {
	t.Helper()

	tmp := t.TempDir()
	if err := db.Init(filepath.Join(tmp, "test.db")); err != nil {
		t.Fatalf("db init: %v", err)
	}
	t.Cleanup(db.Close)

	res, err := db.DB.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", "import@test.com", "x")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	userID, _ := res.LastInsertId()

	req := httptest.NewRequest("POST", "/api/products/import", strings.NewReader(csvBody))
	req = req.WithContext(context.WithValue(req.Context(), auth.ScopeIDKey, userID))
	w := httptest.NewRecorder()

	ImportHandler(w, req)

	body, _ := io.ReadAll(w.Result().Body)
	var final map[string]interface{}
	for _, line := range strings.Split(string(body), "\n") {
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		var evt map[string]interface{}
		if err := json.Unmarshal([]byte(line[6:]), &evt); err != nil {
			continue
		}
		if evt["type"] == "done" {
			final = evt
		}
	}

	today := db.GetToday()
	rows, err := db.DB.Query(`
		SELECT p.name, e.opening, e.receipts, e.closing, e.price
		FROM entries e JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
		ORDER BY p.id
	`, today, userID)
	if err != nil {
		t.Fatalf("query entries: %v", err)
	}
	defer rows.Close()

	var entries []importedEntry
	for rows.Next() {
		var e importedEntry
		if err := rows.Scan(&e.name, &e.opening, &e.receipts, &e.closing, &e.price); err != nil {
			t.Fatalf("scan entry: %v", err)
		}
		entries = append(entries, e)
	}

	return final, entries
}

func TestImportStoresReceiptsAndClosing(t *testing.T) {
	csv := `Product,Opening,Receipts,Closing,Price,Alert at
RICE,100,20,80,"5,000.00",10
BEANS,50,10,40,"3,000.00",5
SALT,,4,4,"2,500.00",12
MILK,5,,4,"2,000.00",12
MILK,6,1,5,"2,100.00",12
BUTTER,3,2,4,"1,500.00",12
BUTTER,2,0,2,"1,500.00",12
BUTTER,3,1,4,"1,500.00",12
`

	final, entries := runImport(t, csv)

	// BUTTER (3, 2, 4, 1500) and BUTTER (2, 0, 2, 1500) differ in opening/closing, so both are imported.
	// BUTTER (3, 1, 4, 1500) has the same price (1500), opening (3), and closing (4) as the first BUTTER, so it is skipped.
	if created, _ := final["created"].(float64); int(created) != 7 {
		t.Fatalf("expected 7 created, got %v (errors: %v)", final["created"], final["errors"])
	}
	if errs, _ := final["errors"].([]interface{}); len(errs) != 1 {
		t.Fatalf("expected 1 skipped (BUTTER duplicate), got errors: %v", final["errors"])
	}
	if !strings.Contains(fmt.Sprintf("%v", final["errors"]), "BUTTER") {
		t.Fatalf("expected skip message to mention BUTTER, got %v", final["errors"])
	}

	expected := []importedEntry{
		{name: "RICE", opening: 100, receipts: 20, closing: 80, price: 5000},
		{name: "BEANS", opening: 50, receipts: 10, closing: 40, price: 3000},
		{name: "SALT", opening: 0, receipts: 4, closing: 4, price: 2500},
		{name: "MILK", opening: 5, receipts: 0, closing: 4, price: 2000},
		{name: "MILK", opening: 6, receipts: 1, closing: 5, price: 2100},
		{name: "BUTTER", opening: 3, receipts: 2, closing: 4, price: 1500},
		{name: "BUTTER", opening: 2, receipts: 0, closing: 2, price: 1500},
	}

	if len(entries) != len(expected) {
		t.Fatalf("expected %d entries, got %d: %+v", len(expected), len(entries), entries)
	}
	for i, want := range expected {
		if entries[i] != want {
			t.Errorf("entry %d = %+v, want %+v", i, entries[i], want)
		}
	}
}

func TestImportDuplicateRules(t *testing.T) {
	// Rule 1: Same name, same price, DIFFERENT opening -> import both
	// Rule 2: Same name, same price, DIFFERENT closing -> import both
	// Rule 3: Same name, DIFFERENT price, SAME opening & closing -> import both
	// Rule 4: Same name, same price, same opening & closing -> import only one (skip duplicate)
	csv := `Product,Opening,Receipts,Closing,Price,Alert at
ITEM_A,10,0,5,"1,000.00",10
ITEM_A,20,0,5,"1,000.00",10
ITEM_B,10,0,5,"1,000.00",10
ITEM_B,10,0,8,"1,000.00",10
ITEM_C,10,0,5,"1,000.00",10
ITEM_C,10,0,5,"2,000.00",10
ITEM_D,10,0,5,"1,000.00",10
ITEM_D,10,0,5,"1,000.00",10
`

	final, entries := runImport(t, csv)

	// ITEM_A (both), ITEM_B (both), ITEM_C (both), ITEM_D (first only) -> 7 created, 1 duplicate skipped
	if created, _ := final["created"].(float64); int(created) != 7 {
		t.Fatalf("expected 7 created, got %v (errors: %v)", final["created"], final["errors"])
	}
	if errs, _ := final["errors"].([]interface{}); len(errs) != 1 {
		t.Fatalf("expected 1 skipped (ITEM_D duplicate), got errors: %v", final["errors"])
	}
	if !strings.Contains(fmt.Sprintf("%v", final["errors"]), "ITEM_D") {
		t.Fatalf("expected skip message to mention ITEM_D, got %v", final["errors"])
	}
	if len(entries) != 7 {
		t.Fatalf("expected 7 entries in database, got %d", len(entries))
	}
}

func TestImportDuplicateAgainstExistingInDatabase(t *testing.T) {
	tmp := t.TempDir()
	if err := db.Init(filepath.Join(tmp, "test.db")); err != nil {
		t.Fatalf("db init: %v", err)
	}
	t.Cleanup(db.Close)

	res, err := db.DB.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", "import2@test.com", "x")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	userID, _ := res.LastInsertId()

	importCSV := func(csvBody string) (map[string]interface{}, []importedEntry) {
		req := httptest.NewRequest("POST", "/api/products/import", strings.NewReader(csvBody))
		req = req.WithContext(context.WithValue(req.Context(), auth.ScopeIDKey, userID))
		w := httptest.NewRecorder()
		ImportHandler(w, req)
		body, _ := io.ReadAll(w.Result().Body)
		var final map[string]interface{}
		for _, line := range strings.Split(string(body), "\n") {
			if strings.HasPrefix(line, "data: ") {
				var evt map[string]interface{}
				if err := json.Unmarshal([]byte(line[6:]), &evt); err == nil && evt["type"] == "done" {
					final = evt
				}
			}
		}
		today := db.GetToday()
		rows, err := db.DB.Query(`
			SELECT p.name, e.opening, e.receipts, e.closing, e.price
			FROM entries e JOIN products p ON p.id = e.product_id
			WHERE e.day_date = ? AND e.user_id = ?
			ORDER BY p.id
		`, today, userID)
		if err != nil {
			t.Fatalf("query entries: %v", err)
		}
		defer rows.Close()
		var entries []importedEntry
		for rows.Next() {
			var e importedEntry
			if err := rows.Scan(&e.name, &e.opening, &e.receipts, &e.closing, &e.price); err != nil {
				t.Fatalf("scan entry: %v", err)
			}
			entries = append(entries, e)
		}
		return final, entries
	}

	initialCSV := `Product,Opening,Receipts,Closing,Price,Alert at
ORIGINAL,10,0,5,"1,000.00",10
`
	final1, entries1 := importCSV(initialCSV)
	if created, _ := final1["created"].(float64); int(created) != 1 {
		t.Fatalf("expected 1 created initially, got %v", final1["created"])
	}
	if len(entries1) != 1 {
		t.Fatalf("expected 1 entry initially, got %d", len(entries1))
	}

	// Now second import:
	// Row 1: same name, same price, same opening, same closing -> skipped (already in product list)
	// Row 2: same name, same price, different opening -> imported
	// Row 3: same name, same price, different closing -> imported
	// Row 4: same name, different price, same opening and closing -> imported
	secondCSV := `Product,Opening,Receipts,Closing,Price,Alert at
ORIGINAL,10,0,5,"1,000.00",10
ORIGINAL,25,0,5,"1,000.00",10
ORIGINAL,10,0,9,"1,000.00",10
ORIGINAL,10,0,5,"3,500.00",10
`
	final2, entries2 := importCSV(secondCSV)
	if created, _ := final2["created"].(float64); int(created) != 3 {
		t.Fatalf("expected 3 created in second import, got %v (errors: %v)", final2["created"], final2["errors"])
	}
	if errs, _ := final2["errors"].([]interface{}); len(errs) != 1 {
		t.Fatalf("expected 1 skipped (already in product list), got: %v", final2["errors"])
	}
	if !strings.Contains(fmt.Sprintf("%v", final2["errors"]), "already in your product list") {
		t.Fatalf("expected skip message to mention 'already in your product list', got %v", final2["errors"])
	}
	// Total entries in DB now: 1 initial + 3 new = 4 entries
	if len(entries2) != 4 {
		t.Fatalf("expected 4 total entries in database, got %d", len(entries2))
	}
}
