package auth

import (
	"context"
	"database/sql"
	"net/http"
	"os"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const ScopeIDKey contextKey = "scope_id"
const UserKey contextKey = "user"

type User struct {
	ID            int64
	Email         string
	Role          string
	OwnerID       *int64
	PhoneNumber   *string
	NotifyOnClose bool
	Active        bool
}

func ResolveScopeID(user User) int64 {
	if user.Role == "staff" && user.OwnerID != nil {
		return *user.OwnerID
	}
	return user.ID
}

func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := r.Context().Value(UserKey).(User)
			if !ok || user.Role != role {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		claims, err := ParseToken(jwtSecret, cookie.Value)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		revoked, err := TokenIsRevoked(claims)
		if err != nil || revoked {
			secure := r.TLS != nil || os.Getenv("APP_ENV") == "production"
			http.SetCookie(w, &http.Cookie{
				Name:     "token",
				Value:    "",
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteLaxMode,
				Secure:   secure,
				MaxAge:   -1,
			})
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var role string
		var ownerID sql.NullInt64
		var active int
		var phoneNumber sql.NullString
		var notifyOnClose int
		err = db.DB.QueryRow(
			"SELECT role, owner_id, active, phone_number, notify_on_close FROM users WHERE id = ?",
			claims.UserID,
		).Scan(&role, &ownerID, &active, &phoneNumber, &notifyOnClose)
		if err != nil || active == 0 {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		user := User{
			ID:            claims.UserID,
			Email:         claims.Email,
			Role:          role,
			Active:        active == 1,
			NotifyOnClose: notifyOnClose != 0,
		}
		if ownerID.Valid {
			user.OwnerID = &ownerID.Int64
		}
		if phoneNumber.Valid {
			user.PhoneNumber = &phoneNumber.String
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, ScopeIDKey, ResolveScopeID(user))
		ctx = context.WithValue(ctx, UserKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
