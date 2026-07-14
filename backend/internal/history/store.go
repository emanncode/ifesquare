package history

import (
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
)

func List(limit int) ([]ledger.EntryWithProduct, error) {
	rows, err := db.DB.Query(`
		SELECT e.id, e.day_date, e.product_id, e.opening, e.receipts, e.closing, e.price, e.created_at, e.updated_at,
		       p.name, p.unit
		FROM entries e
		JOIN products p ON p.id = e.product_id
		ORDER BY e.day_date DESC, p.name
		LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []ledger.EntryWithProduct
	for rows.Next() {
		var e ledger.EntryWithProduct
		if err := rows.Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt, &e.ProductName, &e.ProductUnit); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func GetByDate(date string) ([]ledger.EntryWithProduct, error) {
	rows, err := db.DB.Query(`
		SELECT e.id, e.day_date, e.product_id, e.opening, e.receipts, e.closing, e.price, e.created_at, e.updated_at,
		       p.name, p.unit
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ?
		ORDER BY p.name
	`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []ledger.EntryWithProduct
	for rows.Next() {
		var e ledger.EntryWithProduct
		if err := rows.Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt, &e.ProductName, &e.ProductUnit); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}
