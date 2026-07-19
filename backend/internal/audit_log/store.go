package audit_log

import (
	"encoding/json"

	"github.com/emanncode/ifesquare/backend/internal/db"
)

func Write(scopeID, userID int64, action, entityType, entityID string, before, after interface{}) error {
	var beforeJSON, afterJSON *string
	if before != nil {
		b, err := json.Marshal(before)
		if err != nil {
			return err
		}
		s := string(b)
		beforeJSON = &s
	}
	if after != nil {
		a, err := json.Marshal(after)
		if err != nil {
			return err
		}
		s := string(a)
		afterJSON = &s
	}

	_, err := db.DB.Exec(
		`INSERT INTO audit_log (scope_id, user_id, action, entity_type, entity_id, before, after)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		scopeID, userID, action, entityType, entityID, beforeJSON, afterJSON,
	)
	return err
}
