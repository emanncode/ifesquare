package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

var jwtSecret []byte

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

const DefaultTokenTTL = 72 * time.Hour

const sessionsRevokedBeforeKey = "sessions_revoked_before"

// Claims are embedded in the httpOnly session JWT.
type Claims struct {
	UserID int64  `json:"uid"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// HashPassword returns a bcrypt hash of the plaintext password.
func HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// CheckPassword compares a bcrypt hash with a plaintext password.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// IssueToken signs a JWT for the given user. Used by the login handler.
func IssueToken(secret []byte, userID int64, email string, ttl time.Duration) (string, error) {
	if ttl <= 0 {
		ttl = DefaultTokenTTL
	}
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			Subject:   email,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// ParseToken validates a JWT and returns its claims.
func ParseToken(secret []byte, tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return claims, nil
}

// RevokeAllSessions invalidates every JWT issued so far.
// New logins work; existing cookies are rejected by middleware.
func RevokeAllSessions() error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	_, err := db.DB.Exec(`
		INSERT INTO app_meta (key, value) VALUES (?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value
	`, sessionsRevokedBeforeKey, now)
	if err != nil {
		return fmt.Errorf("revoke all sessions: %w", err)
	}
	return nil
}

// SessionsRevokedBefore returns the cutoff; tokens issued at or before it are invalid.
func SessionsRevokedBefore() (time.Time, error) {
	var raw string
	err := db.DB.QueryRow(
		`SELECT value FROM app_meta WHERE key = ?`,
		sessionsRevokedBeforeKey,
	).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return time.Time{}, nil
	}
	if err != nil {
		return time.Time{}, err
	}
	t, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		// Fall back to RFC3339 without nanos.
		t, err = time.Parse(time.RFC3339, raw)
		if err != nil {
			return time.Time{}, err
		}
	}
	return t, nil
}

// TokenIsRevoked reports whether claims were issued before the global logout cutoff.
func TokenIsRevoked(claims *Claims) (bool, error) {
	cutoff, err := SessionsRevokedBefore()
	if err != nil {
		return false, err
	}
	if cutoff.IsZero() {
		return false, nil
	}
	if claims.IssuedAt == nil {
		return true, nil
	}
	// Allow a 1s skew so a token issued in the same second as revoke still works after re-login.
	return !claims.IssuedAt.Time.After(cutoff), nil
}
