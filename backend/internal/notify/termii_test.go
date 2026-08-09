package notify

import "testing"

func TestSanitizePhoneNumber(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"08031234567", "2348031234567"},
		{"+2348031234567", "2348031234567"},
		{"2348031234567", "2348031234567"},
		{"0803 123 4567", "2348031234567"},
		{"+234 803 123 4567", "2348031234567"},
		{"080-3123-4567", "2348031234567"},
		{"", ""},
	}

	for _, tc := range tests {
		got := sanitizePhoneNumber(tc.input)
		if got != tc.expected {
			t.Errorf("sanitizePhoneNumber(%q) = %q; want %q", tc.input, got, tc.expected)
		}
	}
}
