# Seed a User into Turso

Run these commands one by one in your terminal.

---

**Step 1 – Clear Go build cache (so `-create-user` flag is picked up)**

```bash
cd backend && go clean -cache
```

---

**Step 2 – Insert a user (you'll be prompted for the login password)**

```bash
JWT_SECRET="your-jwt-secret" \
  TURSO_DATABASE_URL="libsql://your-db-url.turso.io" \
  TURSO_AUTH_TOKEN="your-turso-auth-token" \
  go run ./cmd/server -create-user admin@example.com
```

Type the password when prompted and press Enter.

---

**Step 3 – Verify the user was created**

```bash
turso db shell ifesquare "SELECT id, email FROM users;"
```

You should see the ID and email printed.

---

**Step 4 – Log in**

Visit https://ifesquare.uniflowapp.xyz/login and sign in with `olajubajeifeoluwa93@gmail.com` and the password you set.
