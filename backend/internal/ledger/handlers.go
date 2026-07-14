package ledger

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

func TodayHandler(w http.ResponseWriter, r *http.Request) {
	entries, err := GetTodayEntries()
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []EntryWithProduct{}
	}
	writeJSON(w, http.StatusOK, entries)
}

func UpdateTodayEntryHandler(w http.ResponseWriter, r *http.Request) {
	productIDStr := chi.URLParam(r, "productId")
	productID, err := strconv.ParseInt(productIDStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	var body struct {
		Receipts *int `json:"receipts"`
		Closing  *int `json:"closing"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	today := getToday()
	entry, err := UpdateEntry(today, productID, body.Receipts, body.Closing)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

func CloseHandler(w http.ResponseWriter, r *http.Request) {
	today := getToday()
	if err := CloseDay(today); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "day closed"})
}

func getToday() string {
	return time.Now().Format("2006-01-02")
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
