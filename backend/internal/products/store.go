package products

import (
	"database/sql"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type Product struct {
	ID         int64      `json:"id"`
	Name       string     `json:"name"`
	Unit       string     `json:"unit"`
	Price      int        `json:"price"`
	Stock      int        `json:"stock"`
	ArchivedAt *time.Time `json:"archived_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

func List() ([]Product, error) {
	rows, err := db.DB.Query("SELECT id, name, unit, price, stock, archived_at, created_at FROM products ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Unit, &p.Price, &p.Stock, &p.ArchivedAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func Create(name, unit string, price, stock int) (*Product, error) {
	res, err := db.DB.Exec(
		"INSERT INTO products (name, unit, price, stock) VALUES (?, ?, ?, ?)",
		name, unit, price, stock,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return Get(id)
}

func Get(id int64) (*Product, error) {
	var p Product
	err := db.DB.QueryRow(
		"SELECT id, name, unit, price, stock, archived_at, created_at FROM products WHERE id = ?", id,
	).Scan(&p.ID, &p.Name, &p.Unit, &p.Price, &p.Stock, &p.ArchivedAt, &p.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func Update(id int64, fields map[string]interface{}) (*Product, error) {
	if len(fields) == 0 {
		return Get(id)
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
	q += " WHERE id = ?"
	args = append(args, id)

	if _, err := db.DB.Exec(q, args...); err != nil {
		return nil, err
	}
	return Get(id)
}

func Archive(id int64) error {
	_, err := db.DB.Exec("UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	return err
}
