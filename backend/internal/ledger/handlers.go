package ledger

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/getsentry/sentry-go"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/notify"
)

func cacheKey(userID int64, key string) string {
	return fmt.Sprintf("%d:%s", userID, key)
}

func TodayHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
	ck := cacheKey(userID, "/api/ledger/today")
	if cache.Serve(w, ck) {
		return
	}
	entries, err := GetTodayEntries(userID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []EntryWithProduct{}
	}
	cache.Set(ck, entries)
	writeJSON(w, http.StatusOK, entries)
}

func UpdateTodayEntryHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
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
		current, err := getEntry(today, productID, userID)
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

	entry, err := UpdateEntry(today, productID, userID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}
	ck := cacheKey(userID, "/api/ledger/today")
	hk := cacheKey(userID, "/api/history/"+today)
	mk := cacheKey(userID, "analytics:monthly-comparison:"+today)
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, entry)
}

func UpdateEntryHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
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
		current, err := getEntry(date, productID, userID)
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

	entry, err := UpdateEntry(date, productID, userID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}
	ck := cacheKey(userID, "/api/ledger/today")
	hk := cacheKey(userID, "/api/history/"+date)
	mk := cacheKey(userID, "analytics:monthly-comparison:"+getToday())
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, entry)
}

func CloseHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
	today := getToday()
	if err := CloseDay(today, userID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	ck := cacheKey(userID, "/api/ledger/today")
	hk := cacheKey(userID, "/api/history")
	mk := cacheKey(userID, "analytics:monthly-comparison:"+today)
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, map[string]string{"message": "day closed"})

	go sendCloseNotification(userID, today)
}

func sendCloseNotification(userID int64, date string) {
	var phoneNumber sql.NullString
	var notifyOnClose int
	err := db.DB.QueryRow("SELECT phone_number, notify_on_close FROM users WHERE id = ?", userID).Scan(&phoneNumber, &notifyOnClose)
	if err != nil || !phoneNumber.Valid || notifyOnClose == 0 {
		return
	}

	rows, err := db.DB.Query(`
		SELECT e.opening, e.receipts, e.closing, e.price, p.name, p.low_stock_threshold
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
	`, date, userID)
	if err != nil {
		sentry.CaptureException(fmt.Errorf("notify: query entries: %w", err))
		return
	}
	defer rows.Close()

	var totalRevenue, totalUnits int
	var topProduct string
	var topAmount int
	var lowStockCount int

	for rows.Next() {
		var opening, receipts, price int
		var closing sql.NullInt64
		var name string
		var lowStockThreshold sql.NullInt64
		if err := rows.Scan(&opening, &receipts, &closing, &price, &name, &lowStockThreshold); err != nil {
			sentry.CaptureException(fmt.Errorf("notify: scan entry: %w", err))
			return
		}

		total := opening + receipts
		c := int(closing.Int64)
		if closing.Valid && c > 0 {
			sold := total - c
			if sold > 0 {
				amount := sold * price
				totalRevenue += amount
				totalUnits += sold
				if amount > topAmount {
					topAmount = amount
					topProduct = name
				}
			}
			currentStock := c
			threshold := defaultThreshold
			if lowStockThreshold.Valid {
				threshold = int(lowStockThreshold.Int64)
			}
			if currentStock <= threshold {
				lowStockCount++
			}
		}
	}
	if err := rows.Err(); err != nil {
		sentry.CaptureException(fmt.Errorf("notify: rows iter: %w", err))
		return
	}

	msg := buildSummaryMessage(date, totalRevenue, totalUnits, topProduct, lowStockCount)
	if err := notify.SendSMS(phoneNumber.String, msg); err != nil {
		sentry.CaptureException(fmt.Errorf("notify: send sms: %w", err))
	}
}

func buildSummaryMessage(date string, totalRevenue, totalUnits int, topProduct string, lowStockCount int) string {
	t, err := time.Parse("2006-01-02", date)
	dayStr := date
	if err == nil {
		dayStr = t.Format("Mon 2 Jan")
	}

	revK := int(math.Round(float64(totalRevenue) / 1000))
	var msg string
	if lowStockCount > 0 {
		msg = fmt.Sprintf("Ifesquare: %s closed. Revenue ₦%dk, %d units sold. Top: %s. %d items low on stock.", dayStr, revK, totalUnits, topProduct, lowStockCount)
	} else {
		msg = fmt.Sprintf("Ifesquare: %s closed. Revenue ₦%dk, %d units sold. Top: %s.", dayStr, revK, totalUnits, topProduct)
	}
	return msg
}

func SyncFromLastClosedHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
	today := getToday()
	prevDate, err := SyncFromLastClosedDay(today, userID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}
	ck := cacheKey(userID, "/api/ledger/today")
	cache.Invalidate(ck)
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
