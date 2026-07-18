package analytics

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/auth"
	"github.com/emanncode/ifesquare/backend/internal/cache"
)

const cacheKeyPrefix = "analytics:monthly-comparison:"

func cacheKey(userID int64, key string) string {
	return fmt.Sprintf("%d:%s", userID, key)
}

func MonthlyComparisonHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(int64)
	today := time.Now().Format("2006-01-02")
	key := cacheKey(userID, cacheKeyPrefix+today)

	if cache.Serve(w, key) {
		return
	}

	currentFrom, currentTo, previousFrom, previousTo := computeDateRanges(today)

	result, err := computeMonthlyComparison(currentFrom, currentTo, previousFrom, previousTo, userID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	cache.Set(key, result)
	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
