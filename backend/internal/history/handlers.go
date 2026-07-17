package history

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/ledger"
	"github.com/go-chi/chi/v5"
)

func ListHandler(w http.ResponseWriter, r *http.Request) {
	key := r.URL.RequestURI()
	if cache.Serve(w, key) {
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 30
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
			limit = v
		}
	}

	days, err := ListClosedDays(limit)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if days == nil {
		days = []DaySummary{}
	}
	cache.Set(key, days)
	writeJSON(w, http.StatusOK, days)
}

func GetByDateHandler(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")
	if date == "" {
		http.Error(w, `{"error":"date required"}`, http.StatusBadRequest)
		return
	}

	key := r.URL.Path
	if cache.Serve(w, key) {
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

	out := make([]map[string]interface{}, 0, len(entries))
	totalRevenue := 0
	totalUnits := 0
	for _, e := range entries {
		total := e.Opening + e.Receipts
		var sales any
		var amount any
		if e.Closing != nil {
			s := total - *e.Closing
			if s < 0 {
				s = 0
			}
			a := s * e.Price
			sales = s
			amount = a
			totalUnits += s
			totalRevenue += a
		} else {
			sales = nil
			amount = nil
		}
		out = append(out, map[string]interface{}{
			"id":           e.ID,
			"day_date":     e.DayDate,
			"product_id":   e.ProductID,
			"product_name": e.ProductName,
			"product_unit": e.ProductUnit,
			"opening":      e.Opening,
			"receipts":     e.Receipts,
			"closing":      e.Closing,
			"price":        e.Price,
			"total":        total,
			"sales":        sales,
			"amount":       amount,
		})
	}

	result := map[string]interface{}{
		"date":          date,
		"entries":       out,
		"total_revenue": totalRevenue,
		"total_units":   totalUnits,
	}
	cache.Set(key, result)
	writeJSON(w, http.StatusOK, result)
}

func ExportCSVHandler(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="ifesquare-%s.csv"`, date))

	wr := csv.NewWriter(w)
	wr.Write([]string{"Product", "Opening", "Receipts", "Total", "Closing", "Sales", "Price", "Amount"})

	totalUnits := 0
	totalRevenue := 0

	for _, e := range entries {
		total := e.Opening + e.Receipts
		var closing, sales, amount string
		if e.Closing != nil {
			closing = fmt.Sprintf("%d", *e.Closing)
			s := total - *e.Closing
			if s < 0 {
				s = 0
			}
			sales = fmt.Sprintf("%d", s)
			amount = fmt.Sprintf("%d", s*e.Price)
			totalUnits += s
			totalRevenue += s * e.Price
		} else {
			closing = ""
			sales = ""
			amount = ""
		}
		wr.Write([]string{
			e.ProductName,
			fmt.Sprintf("%d", e.Opening),
			fmt.Sprintf("%d", e.Receipts),
			fmt.Sprintf("%d", total),
			closing,
			sales,
			fmt.Sprintf("%d", e.Price),
			amount,
		})
	}

	wr.Write([]string{"Total", "", "", "", "", fmt.Sprintf("%d", totalUnits), "", fmt.Sprintf("%d", totalRevenue)})

	wr.Flush()
	if err := wr.Error(); err != nil {
		http.Error(w, `{"error":"csv write error"}`, http.StatusInternalServerError)
	}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
