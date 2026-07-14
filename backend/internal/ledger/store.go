package ledger

import (
	"database/sql"
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

	_, err := db.DB.Exec("INSERT OR IGNORE INTO days (date) VALUES (?)", today)
	if err != nil {
		return nil, err
	}

	ensureEntries(today)

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

func UpdateEntry(dayDate string, productID int64, receipts *int, closing *int) (*Entry, error) {
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
