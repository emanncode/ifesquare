package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResp struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
}

// Login error codes returned in {"error":"..."}.
const (
	errInvalidBody       = "invalid body"
	errInvalidCredentials = "invalid credentials"
	errTooManyAttempts   = "too many attempts"
	errTokenIssue        = "could not generate token"
)

// writeAuthError responds with a JSON error body and status.
func writeAuthError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, errInvalidBody)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Password == "" {
		writeAuthError(w, http.StatusUnauthorized, errInvalidCredentials)
		return
	}

	// Check rate limit before doing any DB work.
	allowed, retryAfter := loginLimiter.allow(req.Email)
	if !allowed {
		w.Header().Set("Retry-After", fmt.Sprintf("%.0f", retryAfter.Seconds()))
		writeAuthError(w, http.StatusTooManyRequests, errTooManyAttempts)
		return
	}

	var userID int64
	var email, hash string
	err := db.DB.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ?", req.Email).Scan(&userID, &email, &hash)
	if err != nil {
		// Email not found — generic error to avoid user enumeration.
		writeAuthError(w, http.StatusUnauthorized, errInvalidCredentials)
		return
	}

	if !CheckPassword(hash, req.Password) {
		writeAuthError(w, http.StatusUnauthorized, errInvalidCredentials)
		return
	}

	// Successful login — reset attempt counter.
	loginLimiter.reset(req.Email)

	token, err := IssueToken(jwtSecret, userID, email, DefaultTokenTTL)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, errTokenIssue)
		return
	}

	secure := r.TLS != nil
	if os.Getenv("APP_ENV") == "production" {
		secure = true
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		MaxAge:   int(DefaultTokenTTL.Seconds()),
	})

	writeJSON(w, http.StatusOK, userResp{ID: userID, Email: email})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	secure := r.TLS != nil || os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		MaxAge:   -1,
	})
	writeJSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}

type changePasswordReq struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(UserIDKey).(int64)

	var req changePasswordReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, errInvalidBody)
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		writeAuthError(w, http.StatusBadRequest, "missing fields")
		return
	}
	if req.NewPassword == req.OldPassword {
		writeAuthError(w, http.StatusBadRequest, "new password must differ from old")
		return
	}
	if len(req.NewPassword) < 6 {
		writeAuthError(w, http.StatusBadRequest, "password too short (min 6 characters)")
		return
	}

	var hash string
	err := db.DB.QueryRow("SELECT password_hash FROM users WHERE id = ?", userID).Scan(&hash)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	if !CheckPassword(hash, req.OldPassword) {
		writeAuthError(w, http.StatusUnauthorized, "wrong password")
		return
	}

	newHash, err := HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, `{"error":"could not hash password"}`, http.StatusInternalServerError)
		return
	}

	if _, err := db.DB.Exec("UPDATE users SET password_hash = ? WHERE id = ?", newHash, userID); err != nil {
		http.Error(w, `{"error":"could not update password"}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "password changed"})
}

func Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(UserIDKey).(int64)

	var id int64
	var email string
	var createdAt time.Time
	err := db.DB.QueryRow("SELECT id, email, created_at FROM users WHERE id = ?", userID).Scan(&id, &email, &createdAt)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, userResp{ID: id, Email: email})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
