package products

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/emanncode/ifesquare/backend/internal/cache"
)

func ListHandler(w http.ResponseWriter, r *http.Request) {
	if cache.Serve(w, "/api/products") {
		return
	}
	products, err := List()
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if products == nil {
		products = []Product{}
	}
	cache.Set("/api/products", products)
	writeJSON(w, http.StatusOK, products)
}

func CreateHandler(w http.ResponseWriter, r *http.Request) {
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
			Name  string `json:"name"`
			Unit  string `json:"unit"`
			Price int    `json:"price"`
			Stock int    `json:"stock"`
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
			if _, err := Create(p.Name, p.Unit, p.Price, p.Stock); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
				return
			}
		}
		cache.Invalidate("/api/products")
		writeJSON(w, http.StatusCreated, map[string]string{"message": "products created"})
		return
	}

	var pData struct {
		Name  string `json:"name"`
		Unit  string `json:"unit"`
		Price int    `json:"price"`
		Stock int    `json:"stock"`
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

	p, err := Create(pData.Name, pData.Unit, pData.Price, pData.Stock)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	cache.Invalidate("/api/products")
	writeJSON(w, http.StatusCreated, p)
}

func UpdateHandler(w http.ResponseWriter, r *http.Request) {
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

	allowed := map[string]bool{"name": true, "unit": true, "price": true, "stock": true}
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

	p, err := Update(id, fields)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	if p == nil {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}
	cache.Invalidate("/api/products")
	writeJSON(w, http.StatusOK, p)
}

func DeleteHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	if err := Archive(id); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	cache.Invalidate("/api/products")
	writeJSON(w, http.StatusOK, map[string]string{"message": "archived"})
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
