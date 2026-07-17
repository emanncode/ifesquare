package db

import (
	"database/sql"
	"embed"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

//go:embed migrations/*.sql
var migrations embed.FS

var DB *sql.DB

func Init(dbPath string) error {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("create data dir: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}

	DB.SetMaxOpenConns(1)
	DB.SetMaxIdleConns(1)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("ping db: %w", err)
	}

	if _, err := DB.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		return fmt.Errorf("pragma foreign_keys: %w", err)
	}

	if err := migrate(); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	return nil
}

func InitTurso(dbURL, authToken string) error {
	if authToken != "" {
		u, err := url.Parse(dbURL)
		if err != nil {
			return fmt.Errorf("parse turso url: %w", err)
		}
		q := u.Query()
		q.Set("authToken", authToken)
		u.RawQuery = q.Encode()
		dbURL = u.String()
	}

	var err error
	DB, err = sql.Open("libsql", dbURL)
	if err != nil {
		return fmt.Errorf("open turso db: %w", err)
	}

	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(10)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("ping turso db: %w", err)
	}

	if _, err := DB.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		return fmt.Errorf("pragma foreign_keys: %w", err)
	}

	if err := migrate(); err != nil {
		return fmt.Errorf("migrate turso: %w", err)
	}

	return nil
}

func migrate() error {
	files := []string{
		"migrations/001_init.sql",
		"migrations/002_session_revoke.sql",
		"migrations/003_low_stock.sql",
	}
	for _, name := range files {
		sqlBytes, err := migrations.ReadFile(name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		if _, err := DB.Exec(string(sqlBytes)); err != nil {
			// 003_low_stock.sql is ALTER TABLE ADD COLUMN, not idempotent.
			// If the column already exists, skip the error.
			if name == "migrations/003_low_stock.sql" && strings.Contains(err.Error(), "duplicate column") {
				log.Printf("migration %s: column already exists, skipping", name)
				continue
			}
			return fmt.Errorf("exec migration %s: %w", name, err)
		}
	}

	log.Println("database migrated")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
