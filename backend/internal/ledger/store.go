package ledger

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type Entry struct {
	ID        int64  `json:"id"`
	DayDate   string `json:"day_date"`
	ProductID int64  `json:"product_id"`
	Opening   int    `json:"opening"`
	Receipts  int    `json:"receipts"`
	Closing   *int   `json:"closing"`
	Price     int    `json:"price"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type EntryWithProduct struct {
	Entry
	ProductName string `json:"product_name"`
	ProductUnit string `json:"product_unit"`
}

func GetTodayEntries() ([]EntryWithProduct, error) {
	today := time.Now().Format("2006-01-02")

	if _, err := db.DB.Exec("INSERT OR IGNORE INTO days (date) VALUES (?)", today); err != nil {
		return nil, err
	}

	// Check if today's entries already existed so we know if this is a new day
	var existing int
	db.DB.QueryRow("SELECT COUNT(*) FROM entries WHERE day_date = ?", today).Scan(&existing)

	ensureEntries(today)

	// Auto-sync from the last closed day when this day is first opened
	// Closing values from the most recent closed day become today's opening values
	if existing == 0 {
		autoSyncFromLastClosed(today)
	}

	rows, err := db.DB.Query(`
		SELECT e.id, e.day_date, e.product_id, e.opening, e.receipts, e.closing, e.price, e.created_at, e.updated_at,
		       p.name, p.unit
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ?
		ORDER BY p.name
	`, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []EntryWithProduct
	for rows.Next() {
		var e EntryWithProduct
		if err := rows.Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt, &e.ProductName, &e.ProductUnit); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func ensureEntries(dayDate string) {
	rows, err := db.DB.Query("SELECT id, price, stock FROM products WHERE archived_at IS NULL")
	if err != nil {
		return
	}

	type prod struct{ id, price, stock int64 }
	var products []prod
	for rows.Next() {
		var p prod
		if err := rows.Scan(&p.id, &p.price, &p.stock); err != nil {
			rows.Close()
			return
		}
		products = append(products, p)
	}
	rows.Close()

	for _, p := range products {
		db.DB.Exec(
			"INSERT OR IGNORE INTO entries (day_date, product_id, opening, price) VALUES (?, ?, ?, ?)",
			dayDate, p.id, p.stock, p.price,
		)
	}
}

func UpdateEntry(dayDate string, productID int64, opening, receipts, closing, price *int) (*Entry, error) {
	if opening != nil {
		if _, err := db.DB.Exec(
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			*opening, dayDate, productID,
		); err != nil {
			return nil, err
		}
	}
	if receipts != nil {
		_, err := db.DB.Exec(
			"UPDATE entries SET receipts = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			*receipts, dayDate, productID,
		)
		if err != nil {
			return nil, err
		}
	}
	if closing != nil {
		_, err := db.DB.Exec(
			"UPDATE entries SET closing = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			*closing, dayDate, productID,
		)
		if err != nil {
			return nil, err
		}
	}
	if price != nil {
		if _, err := db.DB.Exec(
			"UPDATE entries SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			*price, dayDate, productID,
		); err != nil {
			return nil, err
		}
	}
	return getEntry(dayDate, productID)
}

func getEntry(dayDate string, productID int64) (*Entry, error) {
	var e Entry
	err := db.DB.QueryRow(
		"SELECT id, day_date, product_id, opening, receipts, closing, price, created_at, updated_at FROM entries WHERE day_date = ? AND product_id = ?",
		dayDate, productID,
	).Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &e, nil
}

// autoSyncFromLastClosed silently copies the most recent closed day's closing
// values into today's entry openings (and product stock). It is called
// automatically when a new day's entries are first created, replacing the
// need for a manual "Sync last closed" button. No error is returned when
// there is no previous closed day — that is a normal state for new shops.
func autoSyncFromLastClosed(today string) {
	var prevDate string
	err := db.DB.QueryRow(`
		SELECT date FROM days
		WHERE closed_at IS NOT NULL AND date < ?
		ORDER BY date DESC
		LIMIT 1
	`, today).Scan(&prevDate)
	if err != nil {
		return
	}

	rows, err := db.DB.Query(`
		SELECT e.product_id, e.closing
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.closing IS NOT NULL
	`, prevDate)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var productID, closing int64
		if err := rows.Scan(&productID, &closing); err != nil {
			return
		}
		db.DB.Exec(
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			closing, today, productID,
		)
		db.DB.Exec(
			"UPDATE products SET stock = ? WHERE id = ?", closing, productID,
		)
	}
}

// SyncFromLastClosedDay copies closing values from the most recent
// previous closed day into today's entry openings (and product stock).
// Returns the date we synced from, or an error if no previous closed day exists.
func SyncFromLastClosedDay(today string) (string, error) {
	var prevDate string
	err := db.DB.QueryRow(`
		SELECT date FROM days
		WHERE closed_at IS NOT NULL AND date < ?
		ORDER BY date DESC
		LIMIT 1
	`, today).Scan(&prevDate)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("no previous closed day found")
	}
	if err != nil {
		return "", err
	}

	// Ensure today has entries for all active products
	_, err = db.DB.Exec("INSERT OR IGNORE INTO days (date) VALUES (?)", today)
	if err != nil {
		return "", err
	}
	ensureEntries(today)

	rows, err := db.DB.Query(`
		SELECT e.product_id, e.closing, p.stock
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.closing IS NOT NULL
	`, prevDate)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	for rows.Next() {
		var productID, closing, stock int64
		if err := rows.Scan(&productID, &closing, &stock); err != nil {
			return "", err
		}
		// Update today's opening to match previous closing
		if _, err := db.DB.Exec(
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ?",
			closing, today, productID,
		); err != nil {
			return "", err
		}
		// Update product stock to match
		if _, err := db.DB.Exec(
			"UPDATE products SET stock = ? WHERE id = ?", closing, productID,
		); err != nil {
			return "", err
		}
	}

	return prevDate, nil
}

func CloseDay(dayDate string) error {
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE entries SET closing = opening + receipts
		WHERE day_date = ? AND closing IS NULL
	`, dayDate)
	if err != nil {
		return err
	}

	rows, err := tx.Query(`
		SELECT e.id, e.product_id, e.closing
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ?
	`, dayDate)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var entryID, productID, closing int64
		if err := rows.Scan(&entryID, &productID, &closing); err != nil {
			return err
		}
		if _, err := tx.Exec("UPDATE products SET stock = ? WHERE id = ?", closing, productID); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("UPDATE days SET closed_at = CURRENT_TIMESTAMP WHERE date = ?", dayDate); err != nil {
		return err
	}

	return tx.Commit()
}
