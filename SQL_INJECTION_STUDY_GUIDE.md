# SQL Injection Study Guide – ShopZone Authentication

## Overview
This guide explains SQL injection vulnerabilities, how they work in the ShopZone login, and how to prevent them.

---

## 1. VULNERABLE LOGIN (Current Implementation)

### The Problem: String Concatenation
```typescript
// ❌ VULNERABLE CODE
const normalizedUsername = username.replace(/--$/, '-- ');
const sql = `SELECT * FROM users WHERE username = '${normalizedUsername}'`;
const users = await dbQuery(sql);
```

**Why it's vulnerable:**
- User input (`username`) is directly inserted into the SQL string.
- An attacker can inject SQL syntax to manipulate the query logic.

### Example: What Gets Executed

**Normal login (legitimate):**
```
Input: username = "admin"
SQL:   SELECT * FROM users WHERE username = 'admin'
```

**SQL injection attack:**
```
Input: username = "' OR 1=1 --"
SQL:   SELECT * FROM users WHERE username = '' OR 1=1 -- '
```

The injected `OR 1=1` makes the WHERE clause always TRUE, returning the first user (bypassing password check).

---

## 2. Common SQL Injection Payloads for Testing

### Test 1: Boolean-Based Bypass
```
Username:  ' OR 1=1 --
Password:  anything
Result:    Logs in as the first user in database
```

**What happens:**
```sql
-- Original query:
SELECT * FROM users WHERE username = 'admin'

-- With injection:
SELECT * FROM users WHERE username = '' OR 1=1 -- '
                                          ↑ Always TRUE
-- The comment (--) removes the password check
```

---

### Test 2: Comment-Based Bypass
```
Username:  admin' --
Password:  anything
Result:    Logs in as admin without checking password
```

**What happens:**
```sql
-- Original query:
SELECT * FROM users WHERE username = 'admin' AND password = 'hashed_value'

-- With injection:
SELECT * FROM users WHERE username = 'admin' -- ' AND password = ...
                                    ↑ Comments out the password verification
```

---

### Test 3: Data Exfiltration (UNION Attack)
```
Username:  ' UNION SELECT 1, username, password, email, role FROM users --
Password:  anything
Result:    Extracts all user credentials
```

**What happens:**
```sql
-- Combines legitimate query with attacker's SELECT
SELECT * FROM users WHERE username = ''
UNION SELECT 1, username, password, email, role FROM users --
```

---

## 3. SECURE LOGIN (Prevention Method)

### The Solution: Parameterized Queries (Prepared Statements)

```typescript
// ✅ SECURE CODE
const sql = 'SELECT * FROM users WHERE username = ?';
const users = await dbQuery(sql, [username]);
```

**Why it's secure:**
- The SQL structure is **defined first** (template).
- User input is **bound as data**, not code.
- The database driver **never** interprets user input as SQL syntax.

### How Parameterized Queries Work

```sql
-- Parameterized template (sent first):
PREPARE stmt FROM 'SELECT * FROM users WHERE username = ?'

-- User input (sent separately):
SET @username = 'admin'

-- Execute with data binding:
EXECUTE stmt USING @username
-- Result: Searches for username literally as "admin"
-- Even if user enters: ' OR 1=1 --, it's treated as literal text, not syntax
```

### TypeScript Example

```typescript
// ❌ VULNERABLE
const username = "' OR 1=1 --";
const sql = `SELECT * FROM users WHERE username = '${username}'`;
// Executes: SELECT * FROM users WHERE username = '' OR 1=1 --'

// ✅ SECURE
const username = "' OR 1=1 --";
const sql = 'SELECT * FROM users WHERE username = ?';
await dbQuery(sql, [username]);
// Executes: SELECT * FROM users WHERE username = '(literal)' OR 1=1 --''
// Searches for exact username: ' OR 1=1 --
// Returns: No match (user doesn't exist), login fails safely
```

---

## 4. How to Test the Vulnerable Login

### Using the Frontend
1. Open http://localhost:3000/login
2. Enter username: `' OR 1=1 --`
3. Enter password: `anything`
4. Click "Sign In"
5. You should log in as the first user

### Using curl (Command Line)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"'"'"' OR 1=1 --'"'"'","password":"anything"}'
```

### Using Node.js
```bash
node tools/sqli_batch.js
```

---

## 5. Attack Impact & Risk Assessment

| Attack Type | Impact | Severity |
|-------------|--------|----------|
| Authentication Bypass | Login without password | **CRITICAL** |
| Data Extraction | Read all user records | **CRITICAL** |
| Data Modification | UPDATE/DELETE queries | **CRITICAL** |
| Command Execution | OS-level access (DB-dependent) | **CRITICAL** |

---

## 6. Defense Checklist

### ✅ Always Use Parameterized Queries
```typescript
// Good
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// Bad
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### ✅ Input Validation (Belt & Suspenders)
```typescript
// Validate format
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
  return res.status(400).json({ error: 'Invalid username' });
}
```

### ✅ Least Privilege (Database)
- Create database users with **minimal permissions**
- App user: SELECT, INSERT (no DROP/ALTER)
- Admin user: Full access (separate account)

### ✅ Web Application Firewall (WAF)
- Log and block suspicious patterns: `' OR`, `--`, `UNION`, etc.
- Example: [OWASP ModSecurity](https://modsecurity.org/)

### ✅ Output Encoding (When Applicable)
- If displaying user input in HTML/JavaScript, encode it
- Prevents stored XSS (different from SQLi, but related)

---

## 7. Real-World Context

### Why This Happens
- **Legacy code**: Old codebases built before security best practices
- **Prototype/MVP mindset**: Rushed development skips security
- **Lack of training**: Developers unaware of injection risks

### Major Breaches Due to SQLi
- **Equifax (2017)**: 147 million records exposed
- **OWASP Top 10 #3**: SQL Injection is consistently in top vulnerabilities

### Cost of Fixing vs. Breach
- **Fix prevention**: Hours to implement parameterized queries
- **Breach remediation**: Millions in fines, notification costs, reputation damage

---

## 8. Hands-On Exercise

### Step 1: Test Current Vulnerability
```bash
# Start backend
cd backend && npm run dev

# Test injection
node tools/sqli_batch.js
```

### Step 2: Implement Secure Version (Optional)
Replace the vulnerable login in `backend/src/controllers/auth.controller.ts`:

```typescript
// Replace vulnerable SQL
const sql = `SELECT * FROM users WHERE username = '${username}'`;

// With parameterized query
const sql = 'SELECT * FROM users WHERE username = ?';
const users = await dbQuery(sql, [username]);
```

### Step 3: Verify Prevention Works
```bash
# Test with same payload
node tools/sqli_batch.js

# Result: Login fails (expected, no user with that exact username)
```

---

## 9. Key Takeaways

| Concept | Vulnerable | Secure |
|---------|-----------|--------|
| **Query building** | String concatenation | Parameterized queries |
| **Input handling** | Interpreted as code | Treated as data |
| **Injection risk** | High | None |
| **Best practice** | Never do this | Always use this |

---

## 10. References & Tools

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PortSwigger SQL Injection Lab](https://portswigger.net/web-security/sql-injection)
- [MySQL Parameterized Queries](https://dev.mysql.com/doc/refman/8.0/en/prepare.html)

---

## How to Revert to Secure Mode

When done studying, revert the login to use parameterized queries by uncommenting the secure version in the auth controller.

Good luck with your security studies! 🔐
