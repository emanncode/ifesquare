package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/getsentry/sentry-go"

	"github.com/emanncode/ifesquare/backend/internal/analytics"
	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/history"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
	"github.com/emanncode/ifesquare/backend/internal/products"
)

func main() {
	email := flag.String("create-user", "", "email for the new user (password prompted on stdin)")
	resetEmail := flag.String("reset-password", "", "email whose password to reset (new password prompted on stdin)")
	logoutAll := flag.Bool("logout-all", false, "invalidate every active session and exit")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	if dsn := os.Getenv("SENTRY_DSN"); dsn != "" {
		if err := sentry.Init(sentry.ClientOptions{
			Dsn:         dsn,
			Environment: os.Getenv("APP_ENV"),
		}); err != nil {
			log.Printf("sentry init: %v", err)
		}
		defer sentry.Flush(2 * time.Second)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	auth.SetJWTSecret(jwtSecret)

	tursoURL := os.Getenv("TURSO_DATABASE_URL")
	if tursoURL != "" {
		authToken := os.Getenv("TURSO_AUTH_TOKEN")
		if err := db.InitTurso(tursoURL, authToken); err != nil {
			log.Fatalf("failed to init turso db: %v", err)
		}
	} else {
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "./ifesquare.db"
		}
		if err := db.Init(dbPath); err != nil {
			log.Fatalf("failed to init db: %v", err)
		}
	}
	defer db.Close()

	lowStockDefault := 10
	if v := os.Getenv("LOW_STOCK_DEFAULT_THRESHOLD"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			lowStockDefault = n
		}
	}
	ledger.SetDefaultThreshold(lowStockDefault)

	// Pre-load cache so first requests are served from memory
	go func() {
		if p, err := products.List(); err == nil {
			if p == nil {
				p = []products.Product{}
			}
			cache.Set("/api/products", p)
		}
		if e, err := ledger.GetTodayEntries(); err == nil {
			if e == nil {
				e = []ledger.EntryWithProduct{}
			}
			cache.Set("/api/ledger/today", e)
		}
	}()

	// Keep Turso connection warm — ping every 30s to prevent cold starts
	go func() {
		for {
			time.Sleep(30 * time.Second)
			db.DB.Exec("SELECT 1")
		}
	}()

	if *email != "" {
		fmt.Print("Password: ")
		password, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil {
			log.Fatalf("read password: %v", err)
		}
		password = strings.TrimSpace(password)
		if password == "" {
			log.Fatal("password cannot be empty")
		}
		hash, err := auth.HashPassword(password)
		if err != nil {
			log.Fatalf("hash password: %v", err)
		}
		if _, err := db.DB.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", *email, hash); err != nil {
			log.Fatalf("create user: %v", err)
		}
		log.Printf("user %s created", *email)
		return
	}

	if *resetEmail != "" {
		var exists int
		if err := db.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", *resetEmail).Scan(&exists); err != nil || exists == 0 {
			log.Fatalf("user %s not found", *resetEmail)
		}
		fmt.Print("New password: ")
		password, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil {
			log.Fatalf("read password: %v", err)
		}
		password = strings.TrimSpace(password)
		if password == "" {
			log.Fatal("password cannot be empty")
		}
		hash, err := auth.HashPassword(password)
		if err != nil {
			log.Fatalf("hash password: %v", err)
		}
		if _, err := db.DB.Exec("UPDATE users SET password_hash = ? WHERE email = ?", hash, *resetEmail); err != nil {
			log.Fatalf("reset password: %v", err)
		}
		log.Printf("password reset for %s", *resetEmail)
		return
	}

	if *logoutAll {
		if err := auth.RevokeAllSessions(); err != nil {
			log.Fatalf("failed to logout all sessions: %v", err)
		}
		log.Println("all sessions revoked — users must sign in again")
		return
	}

	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	origins := []string{"http://localhost:5173", "http://localhost:3000"}
	if allowedOrigin != "" {
		origins = append(origins, allowedOrigin)
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/login", auth.Login)
		r.Post("/logout", auth.Logout)
		r.With(auth.Middleware).Get("/me", auth.Me)
		r.With(auth.Middleware).Post("/change-password", auth.ChangePassword)
	})

	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware)

		r.Route("/api/products", func(r chi.Router) {
			r.Get("/", products.ListHandler)
			r.Post("/", products.CreateHandler)
			r.Patch("/{id}", products.UpdateHandler)
			r.Delete("/{id}", products.DeleteHandler)
		})

		r.Route("/api/ledger", func(r chi.Router) {
			r.Get("/today", ledger.TodayHandler)
			r.Patch("/today/{productId}", ledger.UpdateTodayEntryHandler)
			r.Post("/close", ledger.CloseHandler)
			r.Post("/sync-from-last-closed", ledger.SyncFromLastClosedHandler)
			r.Patch("/{date}/{productId}", ledger.UpdateEntryHandler)
		})

		r.Route("/api/history", func(r chi.Router) {
			r.Get("/", history.ListHandler)
			r.Get("/{date}/export", history.ExportCSVHandler)
			r.Get("/{date}", history.GetByDateHandler)
		})

		r.Get("/api/analytics/monthly-comparison", analytics.MonthlyComparisonHandler)
	})

	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "../frontend/dist"
	}

	absStatic, err := filepath.Abs(staticDir)
	if err == nil {
		if info, err := os.Stat(absStatic); err == nil && info.IsDir() {
			fs := http.FileServer(http.Dir(absStatic))
			r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
				path := r.URL.Path
				fullPath := filepath.Join(absStatic, path)

				if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
					fs.ServeHTTP(w, r)
					return
				}

				indexPath := filepath.Join(absStatic, "index.html")
				if _, err := os.Stat(indexPath); err == nil {
					http.ServeFile(w, r, indexPath)
				} else {
					fs.ServeHTTP(w, r)
				}
			})
		} else {
			log.Printf("static directory %s not found, API-only mode", absStatic)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
