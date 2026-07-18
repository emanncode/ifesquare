package ledger

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/emanncode/ifesquare/backend/internal/cache"
)

const cacheKey = "/api/ledger/today"

func TodayHandler(w http.ResponseWriter, r *http.Request) {
	if cache.Serve(w, cacheKey) {
		return
	}
	entries, err := GetTodayEntries()
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []EntryWithProduct{}
	}
	cache.Set(cacheKey, entries)
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
		Opening  *int `json:"opening"`
		Receipts *int `json:"receipts"`
		Closing  *int `json:"closing"`
		Price    *int `json:"price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	if body.Opening != nil && *body.Opening < 0 {
		http.Error(w, `{"error":"opening cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Receipts != nil && *body.Receipts < 0 {
		http.Error(w, `{"error":"receipts cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Closing != nil && *body.Closing < 0 {
		http.Error(w, `{"error":"closing cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Price != nil && *body.Price < 0 {
		http.Error(w, `{"error":"price cannot be negative"}`, http.StatusBadRequest)
		return
	}

	today := getToday()

	if body.Closing != nil {
		current, err := getEntry(today, productID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		if current != nil {
			opening := current.Opening
			if body.Opening != nil {
				opening = *body.Opening
			}
			receipts := current.Receipts
			if body.Receipts != nil {
				receipts = *body.Receipts
			}
			total := opening + receipts
			if *body.Closing > total {
				http.Error(w, `{"error":"closing cannot exceed total (opening + receipts)"}`, http.StatusBadRequest)
				return
			}
		}
	}

	entry, err := UpdateEntry(today, productID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}
	cache.Invalidate(cacheKey, "/api/history/"+today, "analytics:monthly-comparison:"+today)
	writeJSON(w, http.StatusOK, entry)
}

// UpdateEntryHandler handles PATCH /api/ledger/{date}/{productId}
// to edit opening, receipts, closing, or price on any day.
func UpdateEntryHandler(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")
	productIDStr := chi.URLParam(r, "productId")
	productID, err := strconv.ParseInt(productIDStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}

	var body struct {
		Opening  *int `json:"opening"`
		Receipts *int `json:"receipts"`
		Closing  *int `json:"closing"`
		Price    *int `json:"price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	if body.Opening != nil && *body.Opening < 0 {
		http.Error(w, `{"error":"opening cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Receipts != nil && *body.Receipts < 0 {
		http.Error(w, `{"error":"receipts cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Closing != nil && *body.Closing < 0 {
		http.Error(w, `{"error":"closing cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if body.Price != nil && *body.Price < 0 {
		http.Error(w, `{"error":"price cannot be negative"}`, http.StatusBadRequest)
		return
	}

	if body.Closing != nil {
		current, err := getEntry(date, productID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		if current != nil {
			opening := current.Opening
			if body.Opening != nil {
				opening = *body.Opening
			}
			receipts := current.Receipts
			if body.Receipts != nil {
				receipts = *body.Receipts
			}
			total := opening + receipts
			if *body.Closing > total {
				http.Error(w, `{"error":"closing cannot exceed total (opening + receipts)"}`, http.StatusBadRequest)
				return
			}
		}
	}

	entry, err := UpdateEntry(date, productID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}
	cache.Invalidate(cacheKey, "/api/history/"+date, "analytics:monthly-comparison:"+getToday())
	writeJSON(w, http.StatusOK, entry)
}

func CloseHandler(w http.ResponseWriter, r *http.Request) {
	today := getToday()
	if err := CloseDay(today); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	cache.Invalidate(cacheKey, "/api/history", "analytics:monthly-comparison:"+today)
	writeJSON(w, http.StatusOK, map[string]string{"message": "day closed"})
}

func SyncFromLastClosedHandler(w http.ResponseWriter, r *http.Request) {
	today := getToday()
	prevDate, err := SyncFromLastClosedDay(today)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}
	cache.Invalidate(cacheKey)
	writeJSON(w, http.StatusOK, map[string]string{
		"message":   "synced",
		"synced_from": prevDate,
	})
}

func getToday() string {
	return time.Now().Format("2006-01-02")
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
