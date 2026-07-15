package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	email := flag.String("create-user", "", "email for the new user (password prompted on stdin)")
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
