package ledger

import (
	"database/sql"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"github.com/emanncode/ifesquare/backend/internal/audit_log"
	"github.com/emanncode/ifesquare/backend/internal/cache"
	"github.com/emanncode/ifesquare/backend/internal/db"
	"github.com/emanncode/ifesquare/backend/internal/notify"
)

// StartAutoCloseWorker launches a background goroutine that checks every 2 minutes
// for any unclosed days from the previous business day after the 2:00 AM rollover.
func StartAutoCloseWorker() {
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()

		var lastAutoClosedDate string

		for range ticker.C {
			now := db.GetNow()
			// Business day rolls over at 2:00 AM.
			// Run auto-close between 2:02 AM and 2:30 AM local time.
			if now.Hour() == 2 && now.Minute() >= 2 {
				today := db.GetToday()
				if lastAutoClosedDate == today {
					continue
				}

				// Yesterday's business date (26 hours ago from 2 AM)
				yesterday := now.Add(-26 * time.Hour).Format("2006-01-02")

				rows, err := db.DB.Query(`
					SELECT user_id FROM days
					WHERE date = ? AND closed_at IS NULL
				`, yesterday)
				if err != nil {
					log.Printf("auto-close: query unclosed days: %v", err)
					continue
				}

				var unclosedOwners []int64
				for rows.Next() {
					var uid int64
					if err := rows.Scan(&uid); err == nil {
						unclosedOwners = append(unclosedOwners, uid)
					}
				}
				rows.Close()

				for _, ownerID := range unclosedOwners {
					log.Printf("auto-close: auto-finalizing day %s for owner %d", yesterday, ownerID)
					if err := CloseDay(yesterday, ownerID); err == nil {
						db.DB.Exec("UPDATE days SET auto_closed = 1 WHERE user_id = ? AND date = ?", ownerID, yesterday)

						// Write system audit log
						_ = audit_log.Write(ownerID, ownerID, "auto_close", "day", yesterday, nil, map[string]string{"auto_closed": "true"})

						// Invalidate cache
						ck := cacheKey(ownerID, "/api/ledger/today")
						hk := cacheKey(ownerID, "/api/history")
						mk := cacheKey(ownerID, "analytics:monthly-comparison:"+yesterday)
						cache.Invalidate(ck, hk, mk)

						// Dispatch auto-close notifications (SMS & Email)
						go DispatchCloseDayNotifications(yesterday, ownerID, true)
					} else {
						log.Printf("auto-close error for owner %d: %v", ownerID, err)
					}
				}

				lastAutoClosedDate = today
			}
		}
	}()
}

// DispatchCloseDayNotifications gathers day metrics and dispatches Termii SMS
// and/or SMTP email to the owner based on notification settings.
func DispatchCloseDayNotifications(date string, userID int64, isAutoClosed bool) {
	rows, err := db.DB.Query(`
		SELECT e.opening, e.receipts, e.closing, e.price, p.name, p.low_stock_threshold
		FROM entries e
		JOIN products p ON p.id = e.product_id
		WHERE e.day_date = ? AND e.user_id = ?
	`, date, userID)
	if err != nil {
		log.Printf("notify: query entries for close dispatch: %v", err)
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
			continue
		}

		total := opening + receipts
		c := int(closing.Int64)
		if closing.Valid && c >= 0 {
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
			threshold := defaultThreshold
			if lowStockThreshold.Valid {
				threshold = int(lowStockThreshold.Int64)
			}
			if c <= threshold {
				lowStockCount++
			}
		}
	}

	// Retrieve user notification settings
	var phoneNumber, email, email2, email3 sql.NullString
	var notifyOnClose int
	err = db.DB.QueryRow(`
		SELECT phone_number, email, email_2_address, email_3_address, notify_on_close
		FROM users
		WHERE id = ?
	`, userID).Scan(&phoneNumber, &email, &email2, &email3, &notifyOnClose)
	if err != nil {
		log.Printf("notify: query user notification settings: %v", err)
		return
	}

	t, err := time.Parse("2006-01-02", date)
	dayStr := date
	if err == nil {
		dayStr = t.Format("Mon 2 Jan")
	}

	revK := int(math.Round(float64(totalRevenue) / 1000))
	prefix := "Ifesquare"
	if isAutoClosed {
		prefix = "Ifesquare [Auto-Closed]"
	}

	var msg string
	if lowStockCount > 0 {
		msg = fmt.Sprintf("%s: %s closed. Revenue ₦%dk, %d units sold. Top: %s. %d items low on stock.", prefix, dayStr, revK, totalUnits, topProduct, lowStockCount)
	} else {
		msg = fmt.Sprintf("%s: %s closed. Revenue ₦%dk, %d units sold. Top: %s.", prefix, dayStr, revK, totalUnits, topProduct)
	}

	// 1. Dispatch SMS if phone number exists and notifications enabled
	if notifyOnClose == 1 && phoneNumber.Valid && strings.TrimSpace(phoneNumber.String) != "" {
		if err := notify.SendSMS(phoneNumber.String, msg); err != nil {
			log.Printf("notify: send sms error: %v", err)
		}
	}

	// 2. Dispatch Email to primary and secondary recipients
	var recipients []string
	if email.Valid && strings.TrimSpace(email.String) != "" {
		recipients = append(recipients, email.String)
	}
	if email2.Valid && strings.TrimSpace(email2.String) != "" {
		recipients = append(recipients, email2.String)
	}
	if email3.Valid && strings.TrimSpace(email3.String) != "" {
		recipients = append(recipients, email3.String)
	}

	subject := fmt.Sprintf("%s: Day Closed Summary - %s", prefix, date)
	for _, rec := range recipients {
		_ = notify.SendEmail(rec, subject, msg)
	}
}
