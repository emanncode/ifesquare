package analytics

import (
	"math"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type Period struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Revenue int    `json:"revenue"`
	Units   int    `json:"units"`
}

type MonthlyComparison struct {
	Current         Period   `json:"current"`
	Previous        Period   `json:"previous"`
	RevenueDeltaPct *float64 `json:"revenueDeltaPct"`
	UnitsDeltaPct   *float64 `json:"unitsDeltaPct"`
}

func computeDateRanges(today string) (currentFrom, currentTo, previousFrom, previousTo string) {
	t, _ := time.Parse("2006-01-02", today)
	y, m, d := t.Date()

	currentFrom = time.Date(y, m, 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	currentTo = today

	prevM := m - 1
	prevY := y
	if prevM == 0 {
		prevM = 12
		prevY--
	}

	prevMonthStart := time.Date(prevY, prevM, 1, 0, 0, 0, 0, time.UTC)
	lastDayOfPrevMonth := time.Date(prevY, prevM+1, 0, 0, 0, 0, 0, time.UTC).Day()

	prevDay := d
	if prevDay > lastDayOfPrevMonth {
		prevDay = lastDayOfPrevMonth
	}

	previousFrom = prevMonthStart.Format("2006-01-02")
	previousTo = time.Date(prevY, prevM, prevDay, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	return
}

func computeMonthlyComparison(currentFrom, currentTo, previousFrom, previousTo string) (*MonthlyComparison, error) {
	rows, err := db.DB.Query(`
		SELECT e.id, e.day_date, e.product_id, e.opening, e.receipts, e.closing, e.price,
		       e.created_at, e.updated_at, p.name, p.unit
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE (e.day_date BETWEEN ? AND ?) OR (e.day_date BETWEEN ? AND ?)
		ORDER BY e.day_date
	`, currentFrom, currentTo, previousFrom, previousTo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currentRev, currentUnits, prevRev, prevUnits int

	for rows.Next() {
		var e struct {
			ID          int64
			DayDate     string
			ProductID   int64
			Opening     int
			Receipts    int
			Closing     *int
			Price       int
			CreatedAt   string
			UpdatedAt   string
			ProductName string
			ProductUnit string
		}
		if err := rows.Scan(&e.ID, &e.DayDate, &e.ProductID, &e.Opening, &e.Receipts, &e.Closing, &e.Price, &e.CreatedAt, &e.UpdatedAt, &e.ProductName, &e.ProductUnit); err != nil {
			return nil, err
		}

		total := e.Opening + e.Receipts
		sales := 0
		amount := 0
		if e.Closing != nil && *e.Closing > 0 {
			s := total - *e.Closing
			if s > 0 {
				sales = s
				amount = s * e.Price
			}
		}

		if e.DayDate >= currentFrom && e.DayDate <= currentTo {
			currentRev += amount
			currentUnits += sales
		} else {
			prevRev += amount
			prevUnits += sales
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	res := &MonthlyComparison{
		Current: Period{
			From:    currentFrom,
			To:      currentTo,
			Revenue: currentRev,
			Units:   currentUnits,
		},
		Previous: Period{
			From:    previousFrom,
			To:      previousTo,
			Revenue: prevRev,
			Units:   prevUnits,
		},
	}

	if prevRev == 0 {
		res.RevenueDeltaPct = nil
	} else {
		v := math.Round((float64(currentRev-prevRev)/float64(prevRev))*100*10) / 10
		res.RevenueDeltaPct = &v
	}

	if prevUnits == 0 {
		res.UnitsDeltaPct = nil
	} else {
		v := math.Round((float64(currentUnits-prevUnits)/float64(prevUnits))*100*10) / 10
		res.UnitsDeltaPct = &v
	}

	return res, nil
}
