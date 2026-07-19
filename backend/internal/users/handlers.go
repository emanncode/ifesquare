package users

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/emanncode/ifesquare/backend/internal/audit_log"
	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/db"
)

type staffUserResp struct {
	ID     int64  `json:"id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Active bool   `json:"active"`
}

func ListHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(auth.UserKey).(auth.User)
	scopeID := auth.ResolveScopeID(user)

	rows, err := db.DB.Query(
		"SELECT id, email, role, active FROM users WHERE owner_id = ? OR id = ? ORDER BY email",
		scopeID, scopeID,
	)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []staffUserResp
	for rows.Next() {
		var u staffUserResp
		var active int
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &active); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		u.Active = active == 1
		users = append(users, u)
	}
	if users == nil {
		users = []staffUserResp{}
	}
	writeJSON(w, http.StatusOK, users)
}

func CreateHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(auth.UserKey).(auth.User)
	scopeID := auth.ResolveScopeID(user)

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	req.Email = emailLower(req.Email)
	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error":"email and password are required"}`, http.StatusBadRequest)
		return
	}
	if len(req.Password) < 6 {
		http.Error(w, `{"error":"password too short (min 6 characters)"}`, http.StatusBadRequest)
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		http.Error(w, `{"error":"could not hash password"}`, http.StatusInternalServerError)
		return
	}

	res, err := db.DB.Exec(
		"INSERT INTO users (email, password_hash, role, owner_id) VALUES (?, ?, 'staff', ?)",
		req.Email, hash, scopeID,
	)
	if err != nil {
		if isDuplicate(err) {
			http.Error(w, `{"error":"email already in use"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	newID, _ := res.LastInsertId()

	if err := audit_log.Write(scopeID, user.ID, "create", "user", strconv.FormatInt(newID, 10), nil,
		map[string]interface{}{"email": req.Email, "role": "staff"},
	); err != nil {
		// non-fatal
	}

	writeJSON(w, http.StatusCreated, staffUserResp{
		ID:     newID,
		Email:  req.Email,
		Role:   "staff",
		Active: true,
	})
}

func UpdateHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(auth.UserKey).(auth.User)
	scopeID := auth.ResolveScopeID(user)

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Active *bool `json:"active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}
	if req.Active == nil {
		http.Error(w, `{"error":"active field is required"}`, http.StatusBadRequest)
		return
	}

	activeInt := 0
	if *req.Active {
		activeInt = 1
	}

	res, err := db.DB.Exec(
		"UPDATE users SET active = ? WHERE id = ? AND owner_id = ? AND role = 'staff'",
		activeInt, id, scopeID,
	)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	action := "deactivate"
	if *req.Active {
		action = "activate"
	}
	if err := audit_log.Write(scopeID, user.ID, action, "user", idStr,
		map[string]interface{}{"active": !*req.Active},
		map[string]interface{}{"active": *req.Active},
	); err != nil {
		// non-fatal
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "user updated"})
}

func isDuplicate(err error) bool {
	return err != nil && (strings.Contains(err.Error(), "UNIQUE") || strings.Contains(err.Error(), "unique"))
}

func emailLower(email string) string {
	return strings.ToLower(email)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
