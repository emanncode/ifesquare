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

	"github.com/emanncode/ifesquare/backend/internal/audit_log"
	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/notify"
)

func cacheKey(scopeID int64, key string) string {
	return fmt.Sprintf("%d:%s", scopeID, key)
}

type staffEntryResponse struct {
	ID                 int64  `json:"id"`
	DayDate            string `json:"day_date"`
	ProductID          int64  `json:"product_id"`
	ProductName        string `json:"product_name"`
	Opening            int    `json:"opening"`
	Receipts           int    `json:"receipts"`
	Closing            *int   `json:"closing"`
	EffectiveThreshold int    `json:"effective_threshold"`
	CurrentStock       int    `json:"current_stock"`
	IsLowStock         bool   `json:"is_low_stock"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
}

func TodayHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
	isStaff := user.Role == "staff"

	ck := cacheKey(scopeID, "/api/ledger/today")
	if !isStaff && cache.Serve(w, ck) {
		return
	}

	entries, err := GetTodayEntries(scopeID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []EntryWithProduct{}
	}

	var resp []interface{}
	for _, e := range entries {
		if isStaff {
			resp = append(resp, staffEntryResponse{
				ID:                 e.ID,
				DayDate:            e.DayDate,
				ProductID:          e.ProductID,
				ProductName:        e.ProductName,
				Opening:            e.Opening,
				Receipts:           e.Receipts,
				Closing:            e.Closing,
				EffectiveThreshold: e.EffectiveThreshold,
				CurrentStock:       e.CurrentStock,
				IsLowStock:         e.IsLowStock,
				CreatedAt:          e.CreatedAt,
				UpdatedAt:          e.UpdatedAt,
			})
		} else {
			resp = append(resp, e)
		}
	}
	if resp == nil {
		resp = []interface{}{}
	}

	if !isStaff {
		cache.Set(ck, entries)
	}
	writeJSON(w, http.StatusOK, resp)
}

func UpdateTodayEntryHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
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

	if user.Role == "staff" {
		if body.Price != nil || body.Opening != nil {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
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
		current, err := getEntry(today, productID, scopeID)
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

	before, _ := getEntry(today, productID, scopeID)

	entry, err := UpdateEntry(today, productID, scopeID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}

	if err := audit_log.Write(scopeID, user.ID, "update", "entry", today+":"+productIDStr, before, entry); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/ledger/today")
	hk := cacheKey(scopeID, "/api/history/"+today)
	mk := cacheKey(scopeID, "analytics:monthly-comparison:"+today)
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, entry)
}

func UpdateEntryHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
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
		current, err := getEntry(date, productID, scopeID)
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

	before, _ := getEntry(date, productID, scopeID)

	entry, err := UpdateEntry(date, productID, scopeID, body.Opening, body.Receipts, body.Closing, body.Price)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, `{"error":"entry not found"}`, http.StatusNotFound)
		return
	}

	if err := audit_log.Write(scopeID, user.ID, "update", "entry", date+":"+productIDStr, before, entry); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/ledger/today")
	hk := cacheKey(scopeID, "/api/history/"+date)
	mk := cacheKey(scopeID, "analytics:monthly-comparison:"+getToday())
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, entry)
}

func CloseHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
	today := getToday()
	if err := CloseDay(today, scopeID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	if err := audit_log.Write(scopeID, user.ID, "close", "day", today, nil, nil); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/ledger/today")
	hk := cacheKey(scopeID, "/api/history")
	mk := cacheKey(scopeID, "analytics:monthly-comparison:"+today)
	cache.Invalidate(ck, hk, mk)
	writeJSON(w, http.StatusOK, map[string]string{"message": "day closed"})

	go sendCloseNotification(scopeID, today)
}

func sendCloseNotification(scopeID int64, date string) {
	var phoneNumber sql.NullString
	var notifyOnClose int
	err := db.DB.QueryRow("SELECT phone_number, notify_on_close FROM users WHERE id = ?", scopeID).Scan(&phoneNumber, &notifyOnClose)
	if err != nil || !phoneNumber.Valid || notifyOnClose == 0 {
		return
	}

	rows, err := db.DB.Query(`
		SELECT e.opening, e.receipts, e.closing, e.price, p.name, p.low_stock_threshold
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
	`, date, scopeID)
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
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	today := getToday()
	prevDate, err := SyncFromLastClosedDay(today, scopeID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}
	ck := cacheKey(scopeID, "/api/ledger/today")
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
