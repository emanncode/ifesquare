package audit_log

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/db"
)

type AuditEntry struct {
	ID         int64     `json:"id"`
	ScopeID    int64     `json:"scope_id"`
	UserID     int64     `json:"user_id"`
	Action     string    `json:"action"`
	EntityType string    `json:"entity_type"`
	EntityID   string    `json:"entity_id"`
	Before     *string   `json:"before,omitempty"`
	After      *string   `json:"after,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

func ListHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(auth.UserKey).(auth.User)
	scopeID := auth.ResolveScopeID(user)

	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 200 {
			limit = v
		}
	}

	q := "SELECT id, scope_id, user_id, action, entity_type, entity_id, before, after, created_at FROM audit_log WHERE scope_id = ?"
	args := []interface{}{scopeID}

	if entityType := r.URL.Query().Get("entityType"); entityType != "" {
		q += " AND entity_type = ?"
		args = append(args, entityType)
	}
	if userIDStr := r.URL.Query().Get("userId"); userIDStr != "" {
		if uid, err := strconv.ParseInt(userIDStr, 10, 64); err == nil {
			q += " AND user_id = ?"
			args = append(args, uid)
		}
	}

	q += " ORDER BY created_at DESC LIMIT ?"
	args = append(args, limit)

	rows, err := db.DB.Query(q, args...)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entries []AuditEntry
	for rows.Next() {
		var e AuditEntry
		if err := rows.Scan(&e.ID, &e.ScopeID, &e.UserID, &e.Action, &e.EntityType, &e.EntityID, &e.Before, &e.After, &e.CreatedAt); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []AuditEntry{}
	}

	writeJSON(w, http.StatusOK, entries)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
