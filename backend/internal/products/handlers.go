package products

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/emanncode/ifesquare/backend/internal/audit_log"
	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/db"
)

func cacheKey(scopeID int64, key string) string {
	return fmt.Sprintf("%d:%s", scopeID, key)
}

func ListHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	ck := cacheKey(scopeID, "/api/products")
	if cache.Serve(w, ck) {
		return
	}
	products, err := List(scopeID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if products == nil {
		products = []Product{}
	}
	cache.Set(ck, products)
	writeJSON(w, http.StatusOK, products)
}

func CreateHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"cannot read body"}`, http.StatusBadRequest)
		return
	}

	raw := make(map[string]json.RawMessage)
	if err := json.Unmarshal(body, &raw); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if productsRaw, ok := raw["products"]; ok {
		var products []struct {
			Name              string `json:"name"`
			Price             int    `json:"price"`
			Stock             int    `json:"stock"`
			LowStockThreshold *int   `json:"low_stock_threshold"`
		}
		if err := json.Unmarshal(productsRaw, &products); err != nil {
			http.Error(w, `{"error":"invalid products array"}`, http.StatusBadRequest)
			return
		}
		for _, p := range products {
			if p.Name == "" {
				http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
				return
			}
			if p.Price < 0 {
				http.Error(w, `{"error":"price cannot be negative"}`, http.StatusBadRequest)
				return
			}
			if p.Stock < 0 {
				http.Error(w, `{"error":"stock cannot be negative"}`, http.StatusBadRequest)
				return
			}
			if p.LowStockThreshold != nil && *p.LowStockThreshold < 0 {
				http.Error(w, `{"error":"low_stock_threshold cannot be negative"}`, http.StatusBadRequest)
				return
			}
			created, err := Create(scopeID, p.Name, p.Price, p.Stock, p.LowStockThreshold)
			if err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
				return
			}
			if err := audit_log.Write(scopeID, user.ID, "create", "product", strconv.FormatInt(created.ID, 10), nil,
				map[string]interface{}{"name": p.Name, "price": p.Price, "stock": p.Stock},
			); err != nil {
				// non-fatal
			}
		}
		ck := cacheKey(scopeID, "/api/products")
		ltk := cacheKey(scopeID, "/api/ledger/today")
		cache.Invalidate(ck, ltk)
		writeJSON(w, http.StatusCreated, map[string]string{"message": "products created"})
		return
	}

	var pData struct {
		Name              string `json:"name"`
		Price             int    `json:"price"`
		Stock             int    `json:"stock"`
		LowStockThreshold *int   `json:"low_stock_threshold"`
	}
	if err := json.Unmarshal(body, &pData); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	if pData.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}
	if pData.Price < 0 {
		http.Error(w, `{"error":"price cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if pData.Stock < 0 {
		http.Error(w, `{"error":"stock cannot be negative"}`, http.StatusBadRequest)
		return
	}
	if pData.LowStockThreshold != nil && *pData.LowStockThreshold < 0 {
		http.Error(w, `{"error":"low_stock_threshold cannot be negative"}`, http.StatusBadRequest)
		return
	}

	p, err := Create(scopeID, pData.Name, pData.Price, pData.Stock, pData.LowStockThreshold)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if err := audit_log.Write(scopeID, user.ID, "create", "product", strconv.FormatInt(p.ID, 10), nil,
		map[string]interface{}{"name": pData.Name, "price": pData.Price, "stock": pData.Stock},
	); err != nil {
		// non-fatal
	}
	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)
	writeJSON(w, http.StatusCreated, p)
}

func UpdateHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	allowed := map[string]bool{"name": true, "price": true, "stock": true, "low_stock_threshold": true}
	fields := make(map[string]interface{})
	for k, v := range body {
		if allowed[k] {
			fields[k] = v
		}
	}

	if name, ok := fields["name"]; ok && name == "" {
		http.Error(w, `{"error":"name cannot be empty"}`, http.StatusBadRequest)
		return
	}
	if price, ok := fields["price"]; ok {
		pf, ok2 := toFloat(price)
		if !ok2 || pf < 0 {
			http.Error(w, `{"error":"price cannot be negative"}`, http.StatusBadRequest)
			return
		}
	}
	if stock, ok := fields["stock"]; ok {
		sf, ok2 := toFloat(stock)
		if !ok2 || sf < 0 {
			http.Error(w, `{"error":"stock cannot be negative"}`, http.StatusBadRequest)
			return
		}
	}
	if threshold, ok := fields["low_stock_threshold"]; ok {
		if threshold != nil {
			tf, ok2 := toFloat(threshold)
			if !ok2 || tf < 0 {
				http.Error(w, `{"error":"low_stock_threshold cannot be negative"}`, http.StatusBadRequest)
				return
			}
			fields["low_stock_threshold"] = int(tf)
		} else {
			fields["low_stock_threshold"] = nil
		}
	}

	before, _ := Get(id, scopeID)

	p, err := Update(id, scopeID, fields)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if p == nil {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	if err := audit_log.Write(scopeID, user.ID, "update", "product", idStr, before, p); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)
	writeJSON(w, http.StatusOK, p)
}

func DeleteHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	before, _ := Get(id, scopeID)

	if err := Archive(id, scopeID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	if err := audit_log.Write(scopeID, user.ID, "archive", "product", idStr, before, nil); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/products")
	cache.Invalidate(ck)
	writeJSON(w, http.StatusOK, map[string]string{"message": "archived"})
}

func DeleteAllHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	if err := DeleteAll(scopeID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)
	writeJSON(w, http.StatusOK, map[string]string{"message": "all products deleted"})
}

func ArchiveAllHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	if err := ArchiveAll(scopeID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)
	writeJSON(w, http.StatusOK, map[string]string{"message": "all products archived"})
}

func TemplateHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="ifesquare-products-template.csv"`)
	wr := csv.NewWriter(w)
	wr.Write([]string{"Product", "Opening", "Receipts", "Closing", "Price", "Alert at"})
	wr.Write([]string{"Rice", "100", "20", "80", "5000", "10"})
	wr.Write([]string{"Beans", "50", "10", "40", "3000", "5"})
	wr.Flush()
}

func ListArchivedHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	products, err := ListArchived(scopeID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if products == nil {
		products = []Product{}
	}
	writeJSON(w, http.StatusOK, products)
}

func RestoreHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	before, _ := Get(id, scopeID)

	if err := Restore(id, scopeID); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	p, _ := Get(id, scopeID)
	if err := audit_log.Write(scopeID, user.ID, "restore", "product", idStr, before, p); err != nil {
		// non-fatal
	}

	ck := cacheKey(scopeID, "/api/products")
	cache.Invalidate(ck)
	writeJSON(w, http.StatusOK, p)
}

func ImportHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"cannot read body"}`, http.StatusBadRequest)
		return
	}

	rd := csv.NewReader(strings.NewReader(string(body)))
	if strings.ContainsRune(string(body), '\t') {
		rd.Comma = '\t'
	}
	records, err := rd.ReadAll()
	if err != nil {
		http.Error(w, `{"error":"invalid CSV: `+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	if len(records) < 2 {
		http.Error(w, `{"error":"CSV must have a header row and at least one data row"}`, http.StatusBadRequest)
		return
	}

	header := records[0]
	if len(header) < 6 || header[0] != "Product" || header[1] != "Opening" || header[2] != "Receipts" || header[3] != "Closing" || header[4] != "Price" || header[5] != "Alert at" {
		http.Error(w, `{"error":"CSV header must have columns: Product,Opening,Receipts,Closing,Price,Alert at"}`, http.StatusBadRequest)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, `{"error":"streaming not supported"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	total := len(records) - 1
	fmt.Fprintf(w, "data: {\"type\":\"start\",\"total\":%d}\n\n", total)
	flusher.Flush()

	tx, err := db.DB.Begin()
	if err != nil {
		fmt.Fprintf(w, "data: {\"type\":\"error\",\"message\":\"cannot start transaction\"}\n\n")
		flusher.Flush()
		return
	}

	today := time.Now().Format("2006-01-02")
	tx.Exec("INSERT OR IGNORE INTO days (user_id, date) VALUES (?, ?)", scopeID, today)

	// Batch-load existing product names and prices in one query.
	// Two products may share a name as long as their prices differ, so a row
	// only counts as a duplicate when both name and price match an existing product.
	existing := make(map[string]map[int]bool)
	if nameRows, err := tx.Query("SELECT name, price FROM products WHERE user_id = ? AND archived_at IS NULL", scopeID); err == nil {
		defer nameRows.Close()
		for nameRows.Next() {
			var n string
			var p int
			if nameRows.Scan(&n, &p) == nil {
				if existing[n] == nil {
					existing[n] = make(map[int]bool)
				}
				existing[n][p] = true
			}
		}
	}

	type pendingProduct struct {
		name              string
		price             int
		stock             int
		lowStockThreshold int
	}
	type pendingEntry struct {
		productIdx int
		opening    int
		receipts   int
		closing    int
		price      int
	}

	var products []pendingProduct
	var entries []pendingEntry
	var importErrors []string
	seen := make(map[string]map[int]int)

	for i, row := range records[1:] {
		if len(row) < 6 {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – not enough columns (expected 6)", i+2))
			continue
		}
		name := strings.TrimSpace(row[0])
		if name == "" {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – product name is empty", i+2))
			continue
		}
		opening, err := strconv.Atoi(strings.TrimSpace(row[1]))
		if err != nil || opening < 0 {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – Opening must be a positive whole number", i+2))
			continue
		}
		receiptsStr := strings.TrimSpace(row[2])
		receipts := 0
		if receiptsStr != "" {
			receipts, err = strconv.Atoi(receiptsStr)
			if err != nil || receipts < 0 {
				importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – Receipts must be a positive whole number", i+2))
				continue
			}
		}
		closing, err := strconv.Atoi(strings.TrimSpace(row[3]))
		if err != nil || closing < 0 {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – Closing must be a positive whole number", i+2))
			continue
		}
		price, err := parsePrice(strings.TrimSpace(row[4]))
		if err != nil || price < 0 {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – Price must be a valid number", i+2))
			continue
		}
		lowStockThreshold := 12
		thresholdStr := strings.TrimSpace(row[5])
		if thresholdStr != "" {
			t, err := strconv.Atoi(thresholdStr)
			if err != nil || t < 0 {
				importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – Alert at must be a positive whole number", i+2))
				continue
			}
			lowStockThreshold = t
		}

		// Two rows are only duplicates when name AND price match, so products
		// that share a name but differ in price are both imported.
		if existing[name] == nil {
			existing[name] = make(map[int]bool)
		}
		if existing[name][price] {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – '%s' with price %d is already in your product list", i+2, name, price))
			continue
		}
		if seen[name] == nil {
			seen[name] = make(map[int]int)
		}
		if prevRow, ok := seen[name][price]; ok {
			importErrors = append(importErrors, fmt.Sprintf("row %d: skipped – '%s' with price %d already appears in your CSV (first at row %d)", i+2, name, price, prevRow))
			continue
		}
		seen[name][price] = i + 2

		idx := len(products)
		products = append(products, pendingProduct{name, price, opening, lowStockThreshold})
		entries = append(entries, pendingEntry{idx, opening, receipts, closing, price})
		existing[name][price] = true
	}

	const chunkSize = 100
	var created int

	for start := 0; start < len(products); start += chunkSize {
		end := start + chunkSize
		if end > len(products) {
			end = len(products)
		}
		chunk := products[start:end]

		// Multi-row INSERT for products.
		ph := make([]string, len(chunk))
		args := make([]interface{}, 0, len(chunk)*5)
		for j, p := range chunk {
			ph[j] = "(?, ?, ?, ?, ?)"
			args = append(args, p.name, p.price, p.stock, p.lowStockThreshold, scopeID)
		}
		res, err := tx.Exec("INSERT INTO products (name, price, stock, low_stock_threshold, user_id) VALUES "+strings.Join(ph, ", "), args...)
		if err != nil {
			importErrors = append(importErrors, fmt.Sprintf("batch %d–%d: %s", start+1, end, err.Error()))
			continue
		}
		firstID, _ := res.LastInsertId()

		// Multi-row INSERT for entries (using sequential IDs).
		entryChunk := entries[start:end]
		eph := make([]string, len(entryChunk))
		eargs := make([]interface{}, 0, len(entryChunk)*7)
		for j, e := range entryChunk {
			eph[j] = "(?, ?, ?, ?, ?, ?, ?)"
			prodID := firstID + int64(j)
			eargs = append(eargs, scopeID, today, prodID, e.opening, e.receipts, e.closing, e.price)
		}
		tx.Exec("INSERT OR IGNORE INTO entries (user_id, day_date, product_id, opening, receipts, closing, price) VALUES "+strings.Join(eph, ", "), eargs...)

		created += len(chunk)
		if (created % 5 == 0) || created >= total {
			fmt.Fprintf(w, "data: {\"type\":\"progress\",\"current\":%d,\"total\":%d}\n\n", created, total)
			flusher.Flush()
		}
	}

	if err := tx.Commit(); err != nil {
		fmt.Fprintf(w, "data: {\"type\":\"error\",\"message\":\"commit failed: %s\"}\n\n", err.Error())
		flusher.Flush()
		return
	}

	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)

	log.Printf("CSV import: %d created, %d errors", created, len(importErrors))
	resp := map[string]interface{}{"created": created}
	if len(importErrors) > 0 {
		resp["errors"] = importErrors
	}
	respBytes, _ := json.Marshal(resp)
	fmt.Fprintf(w, "data: {\"type\":\"done\",%s}\n\n", string(respBytes[1:len(respBytes)-1]))
	flusher.Flush()
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func toFloat(v interface{}) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}

func parsePrice(s string) (int, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, fmt.Errorf("empty")
	}
	// Strip thousands separators so formatted values like "21,500.00" work.
	s = strings.ReplaceAll(s, ",", "")
	if parts := strings.SplitN(s, " ", 2); len(parts) == 2 {
		whole, err := strconv.ParseFloat(parts[0], 64)
		if err != nil {
			return 0, err
		}
		fracParts := strings.SplitN(parts[1], "/", 2)
		if len(fracParts) == 2 {
			num, e1 := strconv.ParseFloat(fracParts[0], 64)
			den, e2 := strconv.ParseFloat(fracParts[1], 64)
			if e1 != nil || e2 != nil || den == 0 {
				return 0, fmt.Errorf("bad fraction")
			}
			return int(whole + num/den + 0.5), nil
		}
		return 0, fmt.Errorf("bad format")
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}
	return int(f + 0.5), nil
}
