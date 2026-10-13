package notify

import (
	"os"
	"testing"
)

func TestNormalizeNigerianPhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"08012345678", "2348012345678"},
		{"+2348012345678", "2348012345678"},
		{"2348012345678", "2348012345678"},
		{"090 9876 5432", "2349098765432"},
		{"+234-701-234-5678", "2347012345678"},
		{"", ""},
	}

	for _, tt := range tests {
		got := NormalizeNigerianPhone(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeNigerianPhone(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestSendSMS_MockFallback(t *testing.T) {
	// Ensure TERMII_API_KEY is empty so it triggers mock logging without network calls
	origKey := os.Getenv("TERMII_API_KEY")
	os.Unsetenv("TERMII_API_KEY")
	defer func() {
		if origKey != "" {
			os.Setenv("TERMII_API_KEY", origKey)
		}
	}()

	err := SendSMS("08012345678", "Ifesquare test message")
	if err != nil {
		t.Fatalf("expected nil error on mock SMS dispatch, got: %v", err)
	}
}
