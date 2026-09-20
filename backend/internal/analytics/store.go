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

func computeMonthlyComparison(currentFrom, currentTo, previousFrom, previousTo string, userID int64) (*MonthlyComparison, error) {
	rows, err := db.DB.Query(`
		SELECT day_date, opening, receipts, closing, price
		FROM entries
		WHERE ((day_date BETWEEN ? AND ?) OR (day_date BETWEEN ? AND ?))
		  AND user_id = ?
	`, currentFrom, currentTo, previousFrom, previousTo, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currentRev, currentUnits, prevRev, prevUnits int

	for rows.Next() {
		var dayDate string
		var opening, receipts, price int
		var closing *int
		if err := rows.Scan(&dayDate, &opening, &receipts, &closing, &price); err != nil {
			return nil, err
		}

		total := opening + receipts
		sales := 0
		amount := 0
		if closing != nil && *closing >= 0 {
			s := total - *closing
			if s > 0 {
				sales = s
				amount = s * price
			}
		}

		if dayDate >= currentFrom && dayDate <= currentTo {
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
