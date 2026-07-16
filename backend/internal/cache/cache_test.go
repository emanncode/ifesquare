package cache

import (
	"testing"
	"time"
)

func TestSetAndGet(t *testing.T) {
	local := New(time.Minute)
	err := local.Set("key1", map[string]string{"hello": "world"})
	if err != nil {
		t.Fatalf("Set: %v", err)
	}

	data, _, ok := local.Get("key1")
	if !ok {
		t.Fatal("expected cache hit")
	}
	if string(data) != `{"hello":"world"}` {
		t.Errorf("got %s, expected %s", data, `{"hello":"world"}`)
	}
}

func TestMiss(t *testing.T) {
	local := New(time.Minute)
	_, _, ok := local.Get("nonexistent")
	if ok {
		t.Fatal("expected cache miss for nonexistent key")
	}
}

func TestExpiry(t *testing.T) {
	local := New(50 * time.Millisecond)
	local.Set("k", "v")
	time.Sleep(100 * time.Millisecond)
	_, _, ok := local.Get("k")
	if ok {
		t.Fatal("expected cache miss after expiry")
	}
}

func TestInvalidate(t *testing.T) {
	local := New(time.Minute)
	local.Set("a", 1)
	local.Set("b", 2)

	local.Invalidate("a")
	_, _, ok := local.Get("a")
	if ok {
		t.Fatal("expected miss after Invalidate")
	}
	_, _, ok = local.Get("b")
	if !ok {
		t.Fatal("expected hit for non-invalidated key")
	}
}

func TestInvalidateAll(t *testing.T) {
	local := New(time.Minute)
	local.Set("a", 1)
	local.Set("b", 2)

	local.InvalidateAll()
	if _, _, ok := local.Get("a"); ok {
		t.Fatal("expected miss after InvalidateAll")
	}
	if _, _, ok := local.Get("b"); ok {
		t.Fatal("expected miss after InvalidateAll")
	}
}

func TestDefaultSingleton(t *testing.T) {
	Set("singleton", "value")
	data, _, ok := Get("singleton")
	if !ok {
		t.Fatal("Default Get should find value set via Set")
	}
	if string(data) != `"value"` {
		t.Errorf("got %s, expected \"value\"", data)
	}
	Invalidate("singleton")
}
