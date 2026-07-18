package ledger

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

var defaultThreshold = 10

func SetDefaultThreshold(n int) {
	defaultThreshold = n
}

func DefaultThreshold() int {
	return defaultThreshold
}

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
	ProductName       string `json:"product_name"`
	EffectiveThreshold int   `json:"effective_threshold"`
	CurrentStock      int    `json:"current_stock"`
	IsLowStock        bool   `json:"is_low_stock"`
}

func GetTodayEntries(userID int64) ([]EntryWithProduct, error) {
	today := time.Now().Format("2006-01-02")

	var hadEntries int
	if err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM entries WHERE day_date = ? AND user_id = ?)", today, userID).Scan(&hadEntries); err != nil {
		hadEntries = 0
	}

	tx, err := db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("INSERT OR IGNORE INTO days (user_id, date) VALUES (?, ?)", userID, today); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(`
		INSERT OR IGNORE INTO entries (user_id, day_date, product_id, opening, price)
		SELECT ?, ?, p.id, p.stock, p.price
		FROM products p
		WHERE p.archived_at IS NULL AND p.user_id = ?
	`, userID, today, userID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	if hadEntries == 0 {
		autoSyncFromLastClosed(today, userID)
	}

	rows, err := db.DB.Query(`
		SELECT e.id, e.day_date, e.product_id, e.opening, e.receipts, e.closing, e.price, e.created_at, e.updated_at,
		       p.name, p.low_stock_threshold, p.stock
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
		ORDER BY p.name
	`, today, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []EntryWithProduct
	for rows.Next() {
		var e EntryWithProduct
		var lowStockThreshold *int
		var productStock int
		if err := rows.Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt, &e.ProductName, &lowStockThreshold, &productStock); err != nil {
			return nil, err
		}
		effectiveThreshold := defaultThreshold
		if lowStockThreshold != nil {
			effectiveThreshold = *lowStockThreshold
		}
		if e.Closing != nil && *e.Closing > 0 {
			e.CurrentStock = *e.Closing
			e.IsLowStock = *e.Closing <= effectiveThreshold
		} else {
			e.CurrentStock = e.Opening + e.Receipts
			e.IsLowStock = e.CurrentStock > 0 && e.CurrentStock <= effectiveThreshold
		}
		e.EffectiveThreshold = effectiveThreshold
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return entries, nil
}

func ensureEntries(dayDate string, userID int64) {
	rows, err := db.DB.Query("SELECT id, price, stock FROM products WHERE archived_at IS NULL AND user_id = ?", userID)
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
			"INSERT OR IGNORE INTO entries (user_id, day_date, product_id, opening, price) VALUES (?, ?, ?, ?, ?)",
			userID, dayDate, p.id, p.stock, p.price,
		)
	}
}

func UpdateEntry(dayDate string, productID int64, userID int64, opening, receipts, closing, price *int) (*Entry, error) {
	if opening != nil {
		if _, err := db.DB.Exec(
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			*opening, dayDate, productID, userID,
		); err != nil {
			return nil, err
		}
	}
	if receipts != nil {
		_, err := db.DB.Exec(
			"UPDATE entries SET receipts = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			*receipts, dayDate, productID, userID,
		)
		if err != nil {
			return nil, err
		}
	}
	if closing != nil {
		_, err := db.DB.Exec(
			"UPDATE entries SET closing = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			*closing, dayDate, productID, userID,
		)
		if err != nil {
			return nil, err
		}
	}
	if price != nil {
		if _, err := db.DB.Exec(
			"UPDATE entries SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			*price, dayDate, productID, userID,
		); err != nil {
			return nil, err
		}
	}
	return getEntry(dayDate, productID, userID)
}

func getEntry(dayDate string, productID int64, userID int64) (*Entry, error) {
	var e Entry
	err := db.DB.QueryRow(
		"SELECT id, day_date, product_id, opening, receipts, closing, price, created_at, updated_at FROM entries WHERE day_date = ? AND product_id = ? AND user_id = ?",
		dayDate, productID, userID,
	).Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &e, nil
}

func autoSyncFromLastClosed(today string, userID int64) {
	var prevDate string
	err := db.DB.QueryRow(`
		SELECT date FROM days
		WHERE closed_at IS NOT NULL AND date < ? AND user_id = ?
		ORDER BY date DESC
		LIMIT 1
	`, today, userID).Scan(&prevDate)
	if err != nil {
		return
	}

	rows, err := db.DB.Query(`
		SELECT e.product_id, e.closing
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.closing IS NOT NULL AND e.user_id = ?
	`, prevDate, userID)
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
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			closing, today, productID, userID,
		)
		db.DB.Exec(
			"UPDATE products SET stock = ? WHERE id = ? AND user_id = ?", closing, productID, userID,
		)
	}
}

func SyncFromLastClosedDay(today string, userID int64) (string, error) {
	var prevDate string
	err := db.DB.QueryRow(`
		SELECT date FROM days
		WHERE closed_at IS NOT NULL AND date < ? AND user_id = ?
		ORDER BY date DESC
		LIMIT 1
	`, today, userID).Scan(&prevDate)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("no previous closed day found")
	}
	if err != nil {
		return "", err
	}

	var hasData int
	if err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM entries
		WHERE day_date = ? AND user_id = ? AND (receipts != 0 OR closing IS NOT NULL)
	`, today, userID).Scan(&hasData); err != nil {
		return "", err
	}
	if hasData > 0 {
		return "", fmt.Errorf("today already has entries with data; sync only works on a fresh day")
	}

	_, err = db.DB.Exec("INSERT OR IGNORE INTO days (user_id, date) VALUES (?, ?)", userID, today)
	if err != nil {
		return "", err
	}
	ensureEntries(today, userID)

	rows, err := db.DB.Query(`
		SELECT e.product_id, e.closing, p.stock
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.closing IS NOT NULL AND e.user_id = ?
	`, prevDate, userID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	for rows.Next() {
		var productID, closing, stock int64
		if err := rows.Scan(&productID, &closing, &stock); err != nil {
			return "", err
		}
		if _, err := db.DB.Exec(
			"UPDATE entries SET opening = ?, updated_at = CURRENT_TIMESTAMP WHERE day_date = ? AND product_id = ? AND user_id = ?",
			closing, today, productID, userID,
		); err != nil {
			return "", err
		}
		if _, err := db.DB.Exec(
			"UPDATE products SET stock = ? WHERE id = ? AND user_id = ?", closing, productID, userID,
		); err != nil {
			return "", err
		}
	}

	return prevDate, nil
}

func CloseDay(dayDate string, userID int64) error {
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE entries SET closing = opening + receipts
		WHERE day_date = ? AND user_id = ? AND closing IS NULL
	`, dayDate, userID)
	if err != nil {
		return err
	}

	rows, err := tx.Query(`
		SELECT e.id, e.product_id, e.closing
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
	`, dayDate, userID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var entryID, productID, closing int64
		if err := rows.Scan(&entryID, &productID, &closing); err != nil {
			return err
		}
		if _, err := tx.Exec("UPDATE products SET stock = ? WHERE id = ? AND user_id = ?", closing, productID, userID); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("UPDATE days SET closed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ?", userID, dayDate); err != nil {
		return err
	}

	return tx.Commit()
}
