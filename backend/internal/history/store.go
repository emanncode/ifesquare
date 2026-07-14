package history

import (
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
)

// DaySummary is one closed calendar day for the history list.
type DaySummary struct {
	Date         string    `json:"date"`
	ClosedAt     time.Time `json:"closed_at"`
	TotalRevenue int       `json:"total_revenue"`
	TotalUnits   int       `json:"total_units"`
}

// ListClosedDays returns recently closed days with totals.
func ListClosedDays(limit int) ([]DaySummary, error) {
	if limit <= 0 {
		limit = 30
	}
	rows, err := db.DB.Query(`
		SELECT d.date, d.closed_at,
		       COALESCE(SUM(
		         CASE
		           WHEN e.closing IS NOT NULL
		           THEN (e.opening + e.receipts - e.closing) * e.price
		           ELSE 0
		         END
		       ), 0) AS total_revenue,
		       COALESCE(SUM(
		         CASE
		           WHEN e.closing IS NOT NULL
		           THEN (e.opening + e.receipts - e.closing)
		           ELSE 0
		         END
		       ), 0) AS total_units
		FROM days d
		LEFT JOIN entries e ON e.day_date = d.date
		WHERE d.closed_at IS NOT NULL
		GROUP BY d.date, d.closed_at
		ORDER BY d.date DESC
		LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []DaySummary
	for rows.Next() {
		var s DaySummary
		if err := rows.Scan(&s.Date, &s.ClosedAt, &s.TotalRevenue, &s.TotalUnits); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, nil
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
