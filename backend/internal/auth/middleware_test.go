package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireRole_OwnerAllowed(t *testing.T) {
	handler := RequireRole("owner")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}))

	user := User{ID: 1, Role: "owner"}
	ctx := context.WithValue(context.Background(), UserKey, user)
	req := httptest.NewRequest("GET", "/", nil).WithContext(ctx)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for owner, got %d", rec.Code)
	}
}

func TestRequireRole_StaffRejected(t *testing.T) {
	handler := RequireRole("owner")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}))

	user := User{ID: 2, Role: "staff"}
	ctx := context.WithValue(context.Background(), UserKey, user)
	req := httptest.NewRequest("GET", "/", nil).WithContext(ctx)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403 for staff, got %d", rec.Code)
	}
}

func TestRequireRole_NoUserRejected(t *testing.T) {
	handler := RequireRole("owner")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403 when no user in context, got %d", rec.Code)
	}
}

func TestResolveScopeID_OwnerReturnsOwnID(t *testing.T) {
	user := User{ID: 10, Role: "owner"}
	scopeID := ResolveScopeID(user)
	if scopeID != 10 {
		t.Errorf("expected scope ID 10 for owner, got %d", scopeID)
	}
}

func TestResolveScopeID_StaffReturnsOwnerID(t *testing.T) {
	ownerID := int64(5)
	user := User{ID: 20, Role: "staff", OwnerID: &ownerID}
	scopeID := ResolveScopeID(user)
	if scopeID != 5 {
		t.Errorf("expected scope ID 5 for staff, got %d", scopeID)
	}
}

func TestResolveScopeID_StaffNoOwnerReturnsOwnID(t *testing.T) {
	user := User{ID: 20, Role: "staff", OwnerID: nil}
	scopeID := ResolveScopeID(user)
	if scopeID != 20 {
		t.Errorf("expected scope ID 20 for staff without owner, got %d", scopeID)
	}
}
