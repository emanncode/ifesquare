package auth

import (
	"testing"
	"time"
)

func TestHashAndCheckPassword(t *testing.T) {
	password := "test-password-123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !CheckPassword(hash, password) {
		t.Error("CheckPassword returned false for correct password")
	}
	if CheckPassword(hash, "wrong-password") {
		t.Error("CheckPassword returned true for wrong password")
	}
}

func TestIssueAndParseToken(t *testing.T) {
	secret := []byte("test-secret-key-for-testing")
	userID := int64(42)
	email := "test@example.com"

	token, err := IssueToken(secret, userID, email, time.Hour)
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ParseToken(secret, token)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("UserID = %d, want %d", claims.UserID, userID)
	}
	if claims.Email != email {
		t.Errorf("Email = %s, want %s", claims.Email, email)
	}
}

func TestParseTokenInvalid(t *testing.T) {
	secret := []byte("secret")
	_, err := ParseToken(secret, "invalid-token")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestParseTokenWrongSecret(t *testing.T) {
	token, _ := IssueToken([]byte("secret-a"), 1, "a@a.com", time.Hour)
	_, err := ParseToken([]byte("secret-b"), token)
	if err == nil {
		t.Error("expected error for token signed with different secret")
	}
}

func TestIssueTokenDefaultTTL(t *testing.T) {
	secret := []byte("default-ttl")
	token, err := IssueToken(secret, 1, "u@u.com", 0) // zero TTL should use DefaultTokenTTL
	if err != nil {
		t.Fatalf("IssueToken with zero TTL: %v", err)
	}
	claims, err := ParseToken(secret, token)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	expected := time.Now().Add(DefaultTokenTTL)
	if claims.ExpiresAt.Time.Before(expected.Add(-time.Minute)) {
		t.Error("token expiry seems too short for default TTL")
	}
}
