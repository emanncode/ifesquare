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
`

	final, entries := runImport(t, csv)

	if created, _ := final["created"].(float64); int(created) != 6 {
		t.Fatalf("expected 6 created, got %v (errors: %v)", final["created"], final["errors"])
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
