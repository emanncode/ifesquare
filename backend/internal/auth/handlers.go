package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResp struct {
	ID            int64   `json:"id"`
	Email         string  `json:"email"`
	Role          string  `json:"role"`
	OwnerID       *int64  `json:"owner_id"`
	StoreName     *string `json:"store_name,omitempty"`
	PhoneNumber   *string `json:"phone_number"`
	NotifyOnClose bool    `json:"notify_on_close"`
	Email2Name    *string `json:"email_2_name"`
	Email2Address *string `json:"email_2_address"`
	Email3Name    *string `json:"email_3_name"`
	Email3Address *string `json:"email_3_address"`
}

// Login error codes returned in {"error":"..."}.
const (
	errInvalidBody        = "The request format is invalid. Please check your information and try again."
	errInvalidCredentials = "Email or password is incorrect."
	errTooManyAttempts    = "Too many sign-in attempts. Please wait a few moments before trying again."
	errTokenIssue         = "Unable to create authentication session. Please try again."
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
	var email, hash, role string
	var ownerID sql.NullInt64
	var active int
	err := db.DB.QueryRow("SELECT id, email, password_hash, role, owner_id, active FROM users WHERE email = ?", req.Email).Scan(&userID, &email, &hash, &role, &ownerID, &active)
	if err != nil || active == 0 {
		// Email not found or inactive — generic error to avoid user enumeration.
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

	var oid *int64
	if ownerID.Valid {
		oid = &ownerID.Int64
	}
	writeJSON(w, http.StatusOK, userResp{ID: userID, Email: email, Role: role, OwnerID: oid})
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

	if strings.TrimSpace(req.OldPassword) == "" || strings.TrimSpace(req.NewPassword) == "" {
		writeAuthError(w, http.StatusBadRequest, "Please enter both your current password and a new password.")
		return
	}
	if req.NewPassword == req.OldPassword {
		writeAuthError(w, http.StatusBadRequest, "Your new password must be different from your current password.")
		return
	}
	if len(req.NewPassword) < 6 {
		writeAuthError(w, http.StatusBadRequest, "Password must be at least 6 characters long.")
		return
	}

	var hash string
	err := db.DB.QueryRow("SELECT password_hash FROM users WHERE id = ?", userID).Scan(&hash)
	if err != nil {
		http.Error(w, `{"error":"User account could not be found."}`, http.StatusNotFound)
		return
	}

	if !CheckPassword(hash, req.OldPassword) {
		writeAuthError(w, http.StatusUnauthorized, "The current password you entered is incorrect.")
		return
	}

	newHash, err := HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, `{"error":"Unable to secure password. Please try again."}`, http.StatusInternalServerError)
		return
	}

	if _, err := db.DB.Exec("UPDATE users SET password_hash = ? WHERE id = ?", newHash, userID); err != nil {
		http.Error(w, `{"error":"Unable to update password. Please try again."}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "password changed"})
}

func getUserProfile(userID int64) (*userResp, error) {
	var id int64
	var email, role string
	var ownerID sql.NullInt64
	var storeName, phoneNumber sql.NullString
	var notifyOnClose int
	var email2Name, email2Address, email3Name, email3Address sql.NullString
	err := db.DB.QueryRow("SELECT id, email, role, owner_id, store_name, phone_number, notify_on_close, email_2_name, email_2_address, email_3_name, email_3_address FROM users WHERE id = ?", userID).Scan(&id, &email, &role, &ownerID, &storeName, &phoneNumber, &notifyOnClose, &email2Name, &email2Address, &email3Name, &email3Address)
	if err != nil {
		return nil, err
	}

	var sn *string
	if storeName.Valid {
		sn = &storeName.String
	}
	var pn *string
	if phoneNumber.Valid {
		pn = &phoneNumber.String
	}
	var oid *int64
	if ownerID.Valid {
		oid = &ownerID.Int64
	}
	var e2n, e2a, e3n, e3a *string
	if email2Name.Valid {
		e2n = &email2Name.String
	}
	if email2Address.Valid {
		e2a = &email2Address.String
	}
	if email3Name.Valid {
		e3n = &email3Name.String
	}
	if email3Address.Valid {
		e3a = &email3Address.String
	}

	return &userResp{
		ID:            id,
		Email:         email,
		Role:          role,
		OwnerID:       oid,
		StoreName:     sn,
		PhoneNumber:   pn,
		NotifyOnClose: notifyOnClose != 0,
		Email2Name:    e2n,
		Email2Address: e2a,
		Email3Name:    e3n,
		Email3Address: e3a,
	}, nil
}

type registerReq struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	StoreName   string `json:"store_name"`
	PhoneNumber string `json:"phone_number"`
}

func Register(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, errInvalidBody)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.StoreName = strings.TrimSpace(req.StoreName)
	req.PhoneNumber = strings.TrimSpace(req.PhoneNumber)

	if req.Email == "" || len(req.Password) < 6 || req.StoreName == "" {
		writeAuthError(w, http.StatusBadRequest, "Please provide a valid store name, email, and password (at least 6 characters).")
		return
	}

	var exists int
	if err := db.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", req.Email).Scan(&exists); err != nil {
		writeAuthError(w, http.StatusInternalServerError, "Database error.")
		return
	}
	if exists > 0 {
		writeAuthError(w, http.StatusBadRequest, "An account with this email address already exists.")
		return
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "Unable to hash password.")
		return
	}

	res, err := db.DB.Exec(`
		INSERT INTO users (email, password_hash, role, active, store_name, phone_number, notify_on_close)
		VALUES (?, ?, 'owner', 1, ?, ?, 1)
	`, req.Email, hash, req.StoreName, req.PhoneNumber)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "Unable to create account.")
		return
	}

	userID, _ := res.LastInsertId()

	token, err := IssueToken(jwtSecret, userID, req.Email, DefaultTokenTTL)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, errTokenIssue)
		return
	}

	secure := r.TLS != nil || os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		MaxAge:   int(DefaultTokenTTL.Seconds()),
	})

	pn := req.PhoneNumber
	sn := req.StoreName
	writeJSON(w, http.StatusCreated, userResp{
		ID:            userID,
		Email:         req.Email,
		Role:          "owner",
		StoreName:     &sn,
		PhoneNumber:   &pn,
		NotifyOnClose: true,
	})
}

func Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(UserIDKey).(int64)
	resp, err := getUserProfile(userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"User account could not be found."}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"Unable to load user profile. Please try again."}`, http.StatusInternalServerError)
		}
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

type updateMeReq struct {
	StoreName     *string `json:"store_name"`
	PhoneNumber   *string `json:"phone_number"`
	NotifyOnClose *bool   `json:"notify_on_close"`
	Email2Name    *string `json:"email_2_name"`
	Email2Address *string `json:"email_2_address"`
	Email3Name    *string `json:"email_3_name"`
	Email3Address *string `json:"email_3_address"`
}

func UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(UserIDKey).(int64)

	var req updateMeReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, errInvalidBody)
		return
	}

	var sets []string
	var args []interface{}

	if req.StoreName != nil {
		sets = append(sets, "store_name = ?")
		trimmed := strings.TrimSpace(*req.StoreName)
		if trimmed == "" {
			args = append(args, nil)
		} else {
			args = append(args, trimmed)
		}
	}
	if req.PhoneNumber != nil {
		sets = append(sets, "phone_number = ?")
		trimmed := strings.TrimSpace(*req.PhoneNumber)
		if trimmed == "" {
			args = append(args, nil)
		} else {
			args = append(args, trimmed)
		}
	}
	if req.NotifyOnClose != nil {
		sets = append(sets, "notify_on_close = ?")
		v := 0
		if *req.NotifyOnClose {
			v = 1
		}
		args = append(args, v)
	}
	if req.Email2Name != nil {
		sets = append(sets, "email_2_name = ?")
		if *req.Email2Name == "" {
			args = append(args, nil)
		} else {
			args = append(args, *req.Email2Name)
		}
	}
	if req.Email2Address != nil {
		sets = append(sets, "email_2_address = ?")
		if *req.Email2Address == "" {
			args = append(args, nil)
		} else {
			args = append(args, *req.Email2Address)
		}
	}
	if req.Email3Name != nil {
		sets = append(sets, "email_3_name = ?")
		if *req.Email3Name == "" {
			args = append(args, nil)
		} else {
			args = append(args, *req.Email3Name)
		}
	}
	if req.Email3Address != nil {
		sets = append(sets, "email_3_address = ?")
		if *req.Email3Address == "" {
			args = append(args, nil)
		} else {
			args = append(args, *req.Email3Address)
		}
	}

	if len(sets) > 0 {
		q := fmt.Sprintf("UPDATE users SET %s WHERE id = ?", strings.Join(sets, ", "))
		args = append(args, userID)
		if _, err := db.DB.Exec(q, args...); err != nil {
			http.Error(w, `{"error":"Unable to update user profile. Please try again."}`, http.StatusInternalServerError)
			return
		}
	}

	resp, err := getUserProfile(userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"User account could not be found."}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"Unable to load updated user profile. Please try again."}`, http.StatusInternalServerError)
		}
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
