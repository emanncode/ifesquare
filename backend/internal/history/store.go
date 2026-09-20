package history

import (
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
)

type DaySummary struct {
	Date         string    `json:"date"`
	ClosedAt     time.Time `json:"closed_at"`
	TotalRevenue int       `json:"total_revenue"`
	TotalUnits   int       `json:"total_units"`
}

func ListClosedDays(limit int, userID int64) ([]DaySummary, error) {
	if limit <= 0 {
		limit = 30
	}
	rows, err := db.DB.Query(`
		SELECT d.date, d.closed_at,
		       COALESCE(SUM(
		         CASE
		           WHEN e.closing IS NOT NULL AND e.closing >= 0
		           THEN (e.opening + e.receipts - e.closing) * e.price
		           ELSE 0
		         END
		       ), 0) AS total_revenue,
		       COALESCE(SUM(
		         CASE
		           WHEN e.closing IS NOT NULL AND e.closing >= 0
		           THEN (e.opening + e.receipts - e.closing)
		           ELSE 0
		         END
		       ), 0) AS total_units
		FROM days d
		LEFT JOIN entries e ON e.day_date = d.date AND e.user_id = d.user_id
		WHERE d.closed_at IS NOT NULL AND d.user_id = ?
		GROUP BY d.date, d.closed_at, d.user_id
		ORDER BY d.date DESC
		LIMIT ?
	`, userID, limit)
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

func GetByDate(date string, userID int64) ([]ledger.EntryWithProduct, error) {
	return ledger.GetEntriesForDate(date, userID)
}
