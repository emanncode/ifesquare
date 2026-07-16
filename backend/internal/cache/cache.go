package cache

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

var Default = New(30 * time.Second)

type entry struct {
	data       []byte
	contentType string
	staleAt    time.Time
}

type Store struct {
	mu     sync.RWMutex
	items  map[string]*entry
	ttl    time.Duration
}

func New(ttl time.Duration) *Store {
	return &Store{
		items: make(map[string]*entry),
		ttl:   ttl,
	}
}

func (s *Store) Set(key string, v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	s.items[key] = &entry{
		data:       data,
		contentType: "application/json",
		staleAt:    time.Now().Add(s.ttl),
	}
	return nil
}

func (s *Store) Get(key string) ([]byte, string, bool) {
	s.mu.RLock()
	e, ok := s.items[key]
	s.mu.RUnlock()

	if !ok {
		return nil, "", false
	}

	if time.Now().After(e.staleAt) {
		return nil, "", false
	}

	return e.data, e.contentType, true
}

func Serve(w http.ResponseWriter, key string) bool {
	data, ctype, ok := Default.Get(key)
	if !ok {
		return false
	}
	w.Header().Set("Content-Type", ctype)
	w.Write(data)
	return true
}

func Set(key string, v interface{}) error {
	return Default.Set(key, v)
}

func Invalidate(keys ...string) {
	Default.mu.Lock()
	defer Default.mu.Unlock()
	for _, key := range keys {
		delete(Default.items, key)
	}
}

func InvalidateAll() {
	Default.mu.Lock()
	defer Default.mu.Unlock()
	Default.items = make(map[string]*entry)
}

func Keys() []string {
	Default.mu.RLock()
	defer Default.mu.RUnlock()
	keys := make([]string, 0, len(Default.items))
	for k := range Default.items {
		keys = append(keys, k)
	}
	return keys
}
