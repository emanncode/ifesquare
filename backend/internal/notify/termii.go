package notify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func SendSMS(phoneNumber, message string) error {
	apiKey := os.Getenv("TERMII_API_KEY")
	senderID := os.Getenv("TERMII_SENDER_ID")
	if apiKey == "" || senderID == "" {
		return fmt.Errorf("TERMII_API_KEY and TERMII_SENDER_ID must be set")
	}

	body := map[string]any{
		"to":      phoneNumber,
		"from":    senderID,
		"sms":     message,
		"type":    "plain",
		"channel": "generic",
		"api_key": apiKey,
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal sms body: %w", err)
	}

	resp, err := http.Post("https://api.ng.termii.com/api/sms/send", "application/json", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("termii request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("termii returned status %d", resp.StatusCode)
	}

	return nil
}
