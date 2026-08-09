package notify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"unicode"
)

// SendSMS sends an SMS message via Termii API to the specified phone number.
func SendSMS(phoneNumber, message string) error {
	apiKey := os.Getenv("TERMII_API_KEY")
	senderID := os.Getenv("TERMII_SENDER_ID")
	if apiKey == "" || senderID == "" {
		return fmt.Errorf("TERMII_API_KEY and TERMII_SENDER_ID must be set")
	}

	sanitizedPhone := sanitizePhoneNumber(phoneNumber)
	if sanitizedPhone == "" {
		return fmt.Errorf("phone number is empty after sanitization")
	}

	body := map[string]any{
		"to":      sanitizedPhone,
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
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("termii returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func sanitizePhoneNumber(phone string) string {
	// Remove all non-digit characters
	var sb strings.Builder
	for _, r := range phone {
		if unicode.IsDigit(r) {
			sb.WriteRune(r)
		}
	}
	digits := sb.String()

	// If it starts with "0" and is 11 digits long, prepend "234" and remove the leading "0"
	if len(digits) == 11 && strings.HasPrefix(digits, "0") {
		return "234" + digits[1:]
	}

	return digits
}
