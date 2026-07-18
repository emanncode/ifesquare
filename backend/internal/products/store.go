package products

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type Product struct {
	ID                 int64      `json:"id"`
	Name               string     `json:"name"`
	Price              int        `json:"price"`
	Stock              int        `json:"stock"`
	LowStockThreshold  *int       `json:"low_stock_threshold,omitempty"`
	ArchivedAt         *time.Time `json:"archived_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
}

func List(userID int64) ([]Product, error) {
	rows, err := db.DB.Query("SELECT id, name, price, stock, low_stock_threshold, archived_at, created_at FROM products WHERE archived_at IS NULL AND user_id = ? ORDER BY name ASC", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.LowStockThreshold, &p.ArchivedAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func Create(userID int64, name string, price, stock int, lowStockThreshold *int) (*Product, error) {
	res, err := db.DB.Exec(
		"INSERT INTO products (name, price, stock, low_stock_threshold, user_id) VALUES (?, ?, ?, ?, ?)",
		name, price, stock, lowStockThreshold, userID,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return Get(id, userID)
}

func Get(id, userID int64) (*Product, error) {
	var p Product
	err := db.DB.QueryRow(
		"SELECT id, name, price, stock, low_stock_threshold, archived_at, created_at FROM products WHERE id = ? AND user_id = ?", id, userID,
	).Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.LowStockThreshold, &p.ArchivedAt, &p.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func Update(id, userID int64, fields map[string]interface{}) (*Product, error) {
	if len(fields) == 0 {
		return Get(id, userID)
	}

	q := "UPDATE products SET "
	args := []interface{}{}
	i := 0
	for k, v := range fields {
		if i > 0 {
			q += ", "
		}
		q += k + " = ?"
		args = append(args, v)
		i++
	}
	q += " WHERE id = ? AND user_id = ?"
	args = append(args, id, userID)

	res, err := db.DB.Exec(q, args...)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, fmt.Errorf("not found")
	}
	return Get(id, userID)
}

func Archive(id, userID int64) error {
	res, err := db.DB.Exec("UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", id, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("not found")
	}
	return nil
}
