package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/history"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
	"github.com/emanncode/ifesquare/backend/internal/products"
)

func main() {
	logoutAll := flag.Bool("logout-all", false, "invalidate every active session and exit")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	auth.SetJWTSecret(jwtSecret)

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./ifesquare.db"
	}

	if err := db.Init(dbPath); err != nil {
		log.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

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
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
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
			r.Get("/{date}", history.GetByDateHandler)
		})
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
