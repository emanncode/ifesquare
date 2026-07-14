package history

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/emanncode/ifesquare/backend/internal/ledger"
	"github.com/go-chi/chi/v5"
)

func ListHandler(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 30
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
			limit = v
		}
	}

	entries, err := List(limit)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []ledger.EntryWithProduct{}
	}
	writeJSON(w, http.StatusOK, entries)
}

func GetByDateHandler(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")
	if date == "" {
		http.Error(w, `{"error":"date required"}`, http.StatusBadRequest)
		return
	}

	entries, err := GetByDate(date)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []ledger.EntryWithProduct{}
	}
	writeJSON(w, http.StatusOK, entries)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
