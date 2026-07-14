package auth

import (
	"encoding/json"
	"net/http"
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
	errInvalidBody    = "invalid body"
	errWrongEmail     = "wrong_email"
	errWrongPassword  = "wrong_password"
	errTokenIssue     = "could not generate token"
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
	if req.Email == "" {
		writeAuthError(w, http.StatusUnauthorized, errWrongEmail)
		return
	}
	if req.Password == "" {
		writeAuthError(w, http.StatusUnauthorized, errWrongPassword)
		return
	}

	var userID int64
	var email, hash string
	err := db.DB.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ?", req.Email).Scan(&userID, &email, &hash)
	if err != nil {
		// Email not found in users table.
		writeAuthError(w, http.StatusUnauthorized, errWrongEmail)
		return
	}

	if !CheckPassword(hash, req.Password) {
		writeAuthError(w, http.StatusUnauthorized, errWrongPassword)
		return
	}

	token, err := IssueToken(jwtSecret, userID, email, DefaultTokenTTL)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, errTokenIssue)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		MaxAge:   int(DefaultTokenTTL.Seconds()),
	})

	writeJSON(w, http.StatusOK, userResp{ID: userID, Email: email})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		MaxAge:   -1,
	})
	writeJSON(w, http.StatusOK, map[string]string{"message": "logged out"})
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
