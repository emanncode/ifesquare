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
		rl.attempts[key] = valid
		return false, retryAfter
	}

	rl.attempts[key] = append(valid, now)

	// Clean up stale map keys periodically when map grows
	if len(rl.attempts) > 100 {
		for k, times := range rl.attempts {
			var hasRecent bool
			for _, t := range times {
				if t.After(cutoff) {
					hasRecent = true
					break
				}
			}
			if !hasRecent {
				delete(rl.attempts, k)
			}
		}
	}
	return true, 0
}

func (rl *rateLimiter) reset(key string) {
	rl.mu.Lock()
	delete(rl.attempts, key)
	rl.mu.Unlock()
}
