package products

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/emanncode/ifesquare/backend/internal/audit_log"
	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
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

func TemplateHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="ifesquare-products-template.csv"`)
	wr := csv.NewWriter(w)
	wr.Write([]string{"name", "price", "stock"})
	wr.Write([]string{"Rice", "5000", "100"})
	wr.Write([]string{"Beans", "3000", "50"})
	wr.Flush()
}

func ImportHandler(w http.ResponseWriter, r *http.Request) {
	scopeID := r.Context().Value(auth.ScopeIDKey).(int64)
	user := r.Context().Value(auth.UserKey).(auth.User)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"cannot read body"}`, http.StatusBadRequest)
		return
	}

	rd := csv.NewReader(strings.NewReader(string(body)))
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
	if len(header) < 3 || header[0] != "name" || header[1] != "price" || header[2] != "stock" {
		http.Error(w, `{"error":"CSV header must have columns: name,price,stock"}`, http.StatusBadRequest)
		return
	}

	var created int
	var errors []string
	for i, row := range records[1:] {
		if len(row) < 3 {
			errors = append(errors, fmt.Sprintf("row %d: too few columns", i+2))
			continue
		}
		name := strings.TrimSpace(row[0])
		if name == "" {
			errors = append(errors, fmt.Sprintf("row %d: name is required", i+2))
			continue
		}
		price, err := strconv.Atoi(strings.TrimSpace(row[1]))
		if err != nil || price < 0 {
			errors = append(errors, fmt.Sprintf("row %d: invalid price", i+2))
			continue
		}
		stock, err := strconv.Atoi(strings.TrimSpace(row[2]))
		if err != nil || stock < 0 {
			errors = append(errors, fmt.Sprintf("row %d: invalid stock", i+2))
			continue
		}
		createdProd, err := Create(scopeID, name, price, stock, nil)
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: %s", i+2, err.Error()))
			continue
		}
		if err := audit_log.Write(scopeID, user.ID, "create", "product", strconv.FormatInt(createdProd.ID, 10), nil,
			map[string]interface{}{"name": name, "price": price, "stock": stock},
		); err != nil {
			// non-fatal
		}
		created++
	}

	ck := cacheKey(scopeID, "/api/products")
	ltk := cacheKey(scopeID, "/api/ledger/today")
	cache.Invalidate(ck, ltk)

	resp := map[string]interface{}{"created": created}
	if len(errors) > 0 {
		resp["errors"] = errors
	}
	writeJSON(w, http.StatusOK, resp)
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
