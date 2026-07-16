package auth

import (
	"sync"
	"time"
)

type rateLimiter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
	max      int
	window   time.Duration
}

var loginLimiter = &rateLimiter{
	attempts: make(map[string][]time.Time),
	max:      5,
	window:   15 * time.Minute,
}

func (rl *rateLimiter) allow(key string) (bool, time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	entries := rl.attempts[key]
	var valid []time.Time
	for _, t := range entries {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.max {
		oldest := valid[0]
		retryAfter := rl.window - now.Sub(oldest)
		return false, retryAfter
	}

	rl.attempts[key] = append(valid, now)
	return true, 0
}

func (rl *rateLimiter) reset(key string) {
	rl.mu.Lock()
	delete(rl.attempts, key)
	rl.mu.Unlock()
}
