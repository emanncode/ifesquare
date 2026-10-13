package notify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

var smsClient = &http.Client{Timeout: 10 * time.Second}

// NormalizeNigerianPhone standardizes phone numbers into international format without '+'.
// Examples:
// - '08012345678' -> '2348012345678'
// - '+2348012345678' -> '2348012345678'
// - '2348012345678' -> '2348012345678'
func NormalizeNigerianPhone(phone string) string {
	clean := regexp.MustCompile(`[^\d+]`).ReplaceAllString(strings.TrimSpace(phone), "")
	clean = strings.TrimPrefix(clean, "+")
	if strings.HasPrefix(clean, "0") && len(clean) == 11 {
		return "234" + clean[1:]
	}
	return clean
}

type termiiPayload struct {
	To      string `json:"to"`
	From    string `json:"from"`
	SMS     string `json:"sms"`
	Type    string `json:"type"`
	Channel string `json:"channel"`
	APIKey  string `json:"api_key"`
}

// SendSMS dispatches an SMS message using the Termii REST API.
// If TERMII_API_KEY is not configured (e.g., local dev or testing), it logs a mock message and returns nil.
func SendSMS(toPhone, message string) error {
	formattedPhone := NormalizeNigerianPhone(toPhone)
	if formattedPhone == "" {
		return fmt.Errorf("invalid phone number: %s", toPhone)
	}

	apiKey := os.Getenv("TERMII_API_KEY")
	senderID := os.Getenv("TERMII_SENDER_ID")
	if senderID == "" {
		senderID = "talert"
	}

	channel := os.Getenv("TERMII_CHANNEL")
	if channel == "" {
		channel = "generic"
	}

	if apiKey == "" {
		log.Printf("[MOCK SMS] To: %s | From: %s | Msg: %s", formattedPhone, senderID, message)
		return nil
	}

	payload := termiiPayload{
		To:      formattedPhone,
		From:    senderID,
		SMS:     message,
		Type:    "plain",
		Channel: channel,
		APIKey:  apiKey,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal termii payload: %w", err)
	}

	resp, err := smsClient.Post("https://api.ng.termii.com/api/sms/send", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("termii api request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("termii api error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}
