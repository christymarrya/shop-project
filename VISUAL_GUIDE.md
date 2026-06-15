# 🎨 SQL Injection - Visual Explanations & Diagrams

Visual guides and diagrams to help understand SQL injection vulnerabilities.

---

## 🔴 The Basic Problem: String Concatenation

### How Vulnerable Code Works

```
User Input: admin_demo' OR '1'='1

Vulnerable Code:
    const username = "admin_demo' OR '1'='1"
    const password = "anything"
    const sql = `SELECT * FROM lab_users 
                 WHERE username = '${username}' AND password = '${password}'`
                              ↑
                    DIRECT INJECTION POINT

Resulting SQL:
    SELECT * FROM lab_users 
    WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
                                   ↑↑↑↑↑↑↑
                     This makes the condition ALWAYS TRUE!

Result: ✅ ATTACKER GAINS ACCESS
```

---

## 🟢 The Solution: Parameterized Queries

### How Secure Code Works

```
User Input: admin_demo' OR '1'='1

Secure Code:
    const username = "admin_demo' OR '1'='1"
    const password = "anything"
    const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?'
                                               ↑                           ↑
                                    PLACEHOLDERS (not concatenation!)

Database Receives:
    Query: SELECT * FROM lab_users WHERE username = ? AND password = ?
    Param 1: admin_demo' OR '1'='1  ← Treated as DATA, not SQL CODE
    Param 2: anything

Database Processing:
    - Database NEVER interprets the parameter as SQL
    - Quotes and special characters are automatically escaped
    - Parameter is treated as literal text string
    - Looking for a user literally named: admin_demo' OR '1'='1
    - No such user exists

Result: ❌ ATTACK BLOCKED (Access Denied)
```

---

## 📊 OR-Based Bypass Attack Flow

```
┌─────────────────────────────────────────────────┐
│         Attacker's Input                        │
│  Username: admin_demo' OR '1'='1                │
│  Password: anything                             │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│    Backend Application Code (VULNERABLE)        │
│                                                 │
│  const sql = `SELECT * FROM lab_users           │
│              WHERE username = '${username}' AND │
│              password = '${password}'`          │
└────────────────────┬────────────────────────────┘
                     │
         STRING CONCATENATION HAPPENS HERE
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│  Resulting SQL String (MALICIOUS)               │
│                                                 │
│  SELECT * FROM lab_users                        │
│  WHERE username = 'admin_demo' OR '1'='1'       │
│  AND password = 'anything'                      │
└────────────────────┬────────────────────────────┘
                     │
         PARSED AS MODIFIED QUERY
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│      SQL Query Interpretation                   │
│                                                 │
│  WHERE username = 'admin_demo'                  │
│        ↓                                        │
│        FALSE (no user named 'admin_demo')       │
│                                                 │
│  OR '1'='1'                                     │
│        ↓                                        │
│        TRUE (1 always equals 1)                 │
│                                                 │
│  Result: FALSE OR TRUE = TRUE ✅                │
│                                                 │
│  The AND password check is ignored!             │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│      Database Returns                           │
│                                                 │
│  ✅ FIRST USER IN DATABASE (usually admin!)    │
│  ID: 1                                          │
│  Username: admin_demo                           │
│  Password: DemoPass123                          │
│  Secret: FLAG{sqli_demo_success_99182}          │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│      Result: AUTHENTICATION BYPASSED! 💥       │
│                                                 │
│  Attacker gets admin access without            │
│  knowing the correct password!                  │
└─────────────────────────────────────────────────┘
```

---

## 📊 Comment Injection Attack Flow

```
┌──────────────────────────────────────────┐
│      Attacker's Input                    │
│  Username: admin_demo' --                │
│  Password: (anything, will be ignored)   │
└────────────────────┬─────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────┐
│  Vulnerable Code                         │
│  const sql = `SELECT * FROM lab_users    │
│              WHERE username = '${...}'   │
│              AND password = '${...}'`    │
└────────────────────┬─────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────┐
│  Resulting SQL String                    │
│                                          │
│  SELECT * FROM lab_users                 │
│  WHERE username = 'admin_demo' --'       │
│  AND password = 'anything'                │
│                    ↑                     │
│                 SQL COMMENT              │
│          (everything after -- is ignored)│
└────────────────────┬─────────────────────┘
                     │
         SQL PARSER IGNORES EVERYTHING
         AFTER THE COMMENT MARKER
                     │
                     ↓
┌──────────────────────────────────────────┐
│  What Database Actually Executes         │
│                                          │
│  SELECT * FROM lab_users                 │
│  WHERE username = 'admin_demo'           │
│                                          │
│  (The AND password check is completely   │
│   removed from the query!)                │
└────────────────────┬─────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────┐
│      Result: AUTHENTICATION BYPASSED! ✅ │
│                                          │
│  Admin user returned without checking    │
│  the password at all!                    │
└──────────────────────────────────────────┘
```

---

## 🛡️ Parameterized Query Protection Flow

```
┌──────────────────────────────────────────┐
│    Attacker's Input (Same as before!)    │
│  Username: admin_demo' OR '1'='1         │
│  Password: anything                      │
└────────────────────┬─────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────┐
│  Secure Code (Using Parameterized Query) │
│                                          │
│  const sql = 'SELECT * FROM lab_users    │
│              WHERE username = ?          │
│              AND password = ?'           │
│                            ↑             │
│                      PLACEHOLDERS        │
│                                          │
│  const params = [username, password]    │
│                 ↑                ↑       │
│              PASSED SEPARATELY, │       │
│              NOT IN SQL STRING -─────────│
└────────────────────┬─────────────────────┘
                     │
        QUERY AND DATA SEPARATED
        BY THE DATABASE DRIVER
                     │
                     ↓
┌──────────────────────────────────────────┐
│  What Database Receives                  │
│                                          │
│  Query:  SELECT * FROM lab_users         │
│          WHERE username = ?              │
│          AND password = ?                │
│                                          │
│  Parameter 1: "admin_demo' OR '1'='1"   │
│           ↑↑↑↑↑                         │
│    Treated as LITERAL TEXT STRING        │
│    (not SQL code)                        │
│                                          │
│  Parameter 2: "anything"                 │
└────────────────────┬─────────────────────┘
                     │
        DATABASE DRIVER ESCAPES
        SPECIAL CHARACTERS
                     │
                     ↓
┌──────────────────────────────────────────┐
│  What's Actually Searched For             │
│                                          │
│  Looking for a user named:               │
│  'admin_demo' OR '1'='1' (literal!)     │
│                                          │
│  With password: 'anything'               │
│                                          │
│  No user with that name exists!          │
└────────────────────┬─────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────┐
│    Result: ACCESS DENIED ✅ (Safe!)      │
│                                          │
│  Attack blocked because the injection    │
│  is treated as literal data, not SQL     │
└──────────────────────────────────────────┘
```

---

## 🔄 Comparison: Vulnerable vs Secure

```
═══════════════════════════════════════════════════════════════════════════
  SCENARIO: User attempts OR-based bypass with: admin_demo' OR '1'='1
═══════════════════════════════════════════════════════════════════════════

❌ VULNERABLE CODE (String Concatenation)
───────────────────────────────────────────────────────────────────────────
const username = "admin_demo' OR '1'='1"
const password = "anything"
const sql = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`

Result SQL: SELECT * FROM lab_users WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
                                                                     ↑↑↑↑↑↑↑
                                                            Makes condition TRUE

Outcome: ✅ ATTACK SUCCEEDS → User gains unauthorized access


✅ SECURE CODE (Parameterized Queries)
───────────────────────────────────────────────────────────────────────────
const username = "admin_demo' OR '1'='1"
const password = "anything"
const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?'
dbQuery(sql, [username, password])

Query: SELECT * FROM lab_users WHERE username = ? AND password = ?
Param 1: "admin_demo' OR '1'='1" (treated as text, not SQL)
Param 2: "anything"

Outcome: ❌ ATTACK BLOCKED → User gets access denied

═══════════════════════════════════════════════════════════════════════════
```

---

## 🎯 Key Difference Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    VULNERABLE APPROACH                          │
│                                                                 │
│  SQL Code + User Input = Final Query                           │
│                                                                 │
│  const sql = `SELECT * FROM users                              │
│              WHERE username = '${userInput}'`                  │
│                                    ↑                           │
│                          USER CONTROLS THIS!                   │
│                                                                 │
│  User can inject SQL code through the input                    │
└─────────────────────────────────────────────────────────────────┘

                            vs

┌─────────────────────────────────────────────────────────────────┐
│                    SECURE APPROACH                              │
│                                                                 │
│  SQL Code + Placeholder → bind Data = Final Query              │
│                                                                 │
│  const sql = 'SELECT * FROM users WHERE username = ?'          │
│                                                    ↑            │
│                                          Database Placeholder   │
│  const data = [userInput]                                      │
│                ↑                                               │
│           Separate from SQL                                    │
│                                                                 │
│  User can NOT inject SQL code (data is never SQL)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Attack Success Rates

```
                    VULNERABLE ENDPOINT
                         (String Concat)
                              │
        ┌───────────────────────────────────────┐
        │                                       │
    ✅ 100%                               ✅ 95%
 Basic Bypass                        Advanced Attacks
 (OR 1=1)                        (UNION SELECT, Blind)
        │                               │
        └───────────────────────────────┘
                        │
        ATTACKER SUCCESS RATE: 95-100%


                    SECURE ENDPOINT
                   (Parameterized Queries)
                              │
        ┌───────────────────────────────────────┐
        │                                       │
    ❌ 0%                                  ❌ 0%
 Basic Bypass                        Advanced Attacks
 (OR 1=1)                        (UNION SELECT, Blind)
        │                               │
        └───────────────────────────────┘
                        │
        ATTACKER SUCCESS RATE: 0%
```

---

## 🧬 SQL Injection Attack Chain

```
                        Attacker
                           │
                           ↓
                 Identifies vulnerable input
                   (login form, search, etc.)
                           │
                           ↓
                 Crafts SQL injection payload
              (e.g., ' OR '1'='1, --comment)
                           │
                           ↓
                   Submits malicious input
                   (through web form or API)
                           │
                           ↓
                   Backend receives input
                           │
                           ↓
            ┌──────────────────────────┐
            │   IS CODE VULNERABLE?    │
            └──────────────┬────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                            │
            ↓                            ↓
    ✅ YES (Concatenation)     ❌ NO (Parameterized)
            │                            │
            ↓                            ↓
    Payload injected      Payload escaped
    into SQL query        (treated as data)
            │                            │
            ↓                            ↓
    Modified SQL      Query executes
    executes          normally
            │                            │
            ↓                            ↓
    ✅ ATTACK SUCCEEDS             ❌ BLOCKED
    - Bypass auth                      Access Denied
    - Extract data                     Safe ✅
    - Modify records
    - Delete data
```

---

## 📊 Query Structure Evolution

### Step 1: Intended Query
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' AND password = 'DemoPass123'
```
**Status:** ✅ Correct (legitimate login attempt)

---

### Step 2: Vulnerable Code Template
```typescript
const sql = `SELECT * FROM lab_users 
             WHERE username = '${username}' AND password = '${password}'`
```
**Status:** ⚠️ Dangerous (concatenation)

---

### Step 3: Attacker Input
```
username = admin_demo' OR '1'='1
password = anything
```
**Status:** 💉 Malicious payload

---

### Step 4: Vulnerable Execution
```sql
SELECT * FROM lab_users 
WHERE username = 'admin_demo' OR '1'='1' AND password = 'anything'
                               ↑↑↑↑↑↑↑
                        Condition is ALWAYS TRUE
```
**Status:** ❌ Authentication Bypassed!

---

### Step 5: Secure Parameterized
```sql
Query:  SELECT * FROM lab_users WHERE username = ? AND password = ?
Params: ["admin_demo' OR '1'='1", "anything"]
        (Treated as literal text, not SQL code)
```
**Status:** ✅ Attack Blocked! Access Denied

---

## 🛡️ Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│                   MULTIPLE DEFENSES                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: SECURE CODING                                │
│  ├─ Parameterized queries (PRIMARY DEFENSE)            │
│  ├─ Prepared statements                                │
│  └─ Use database-specific secure methods               │
│                                                          │
│  Layer 2: INPUT VALIDATION                             │
│  ├─ Pattern matching (detect suspicious input)         │
│  ├─ Whitelist acceptable characters                    │
│  └─ Length validation                                  │
│                                                          │
│  Layer 3: DATABASE SECURITY                            │
│  ├─ Principle of least privilege (limited permissions) │
│  ├─ Separate read-only accounts                        │
│  └─ Disable dangerous features                         │
│                                                          │
│  Layer 4: MONITORING & LOGGING                         │
│  ├─ Log all suspicious activity                        │
│  ├─ Alert on detection patterns                        │
│  └─ Audit trails for compliance                        │
│                                                          │
│  Layer 5: RUNTIME PROTECTION                           │
│  ├─ Web Application Firewall (WAF)                     │
│  ├─ IDS/IPS systems                                    │
│  └─ Rate limiting                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘

Even if ONE layer is bypassed, others provide protection!
```

---

## 🔍 Detection Pattern Examples

```
┌─────────────────────────────────────────────────────────┐
│        WHAT TRIGGERS SQL INJECTION DETECTION             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. SQL Comments                                         │
│    ❌ "--", "#", "/*", "*/"                            │
│                                                          │
│ 2. Boolean Conditions                                   │
│    ❌ "OR '1'='1'", "AND 1=1", "OR true"              │
│                                                          │
│ 3. UNION Attacks                                        │
│    ❌ "UNION SELECT", "UNION ALL SELECT"               │
│                                                          │
│ 4. Stacked Queries                                      │
│    ❌ "'; DROP", "; DELETE", "; UPDATE"                │
│                                                          │
│ 5. Suspicious Functions                                 │
│    ❌ "SLEEP()", "BENCHMARK()", "LOAD_FILE()"          │
│                                                          │
│ 6. Database Access                                      │
│    ❌ "information_schema", "xp_cmdshell"              │
│                                                          │
└─────────────────────────────────────────────────────────┘

Lab Automatically Detects ALL of These!
```

---

## 📋 Lab Endpoints Visual Map

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend                              │
│  http://localhost:3000/security-lab/sql-injection        │
│                                                          │
│  ┌─────────────────┬──────────────────┐               │
│  │  VULNERABLE     │      SECURE       │               │
│  │      MODE       │       MODE        │               │
│  └────────┬────────┴──────────┬────────┘               │
│           │                   │                         │
└───────────┼───────────────────┼───────────────────────────┘
            │                   │
         HTTP POST           HTTP POST
            │                   │
    ┌───────┴──────────────────┴─────────┐
    │         Backend (Express)           │
    │  http://localhost:5000              │
    └───────┬──────────────────┬──────────┘
            │                  │
            ↓                  ↓
    ┌──────────────────┐  ┌──────────────────┐
    │ /api/security-   │  │ /api/security-   │
    │ lab/sql-         │  │ lab/sql-         │
    │ injection/       │  │ injection/       │
    │ login-           │  │ login-           │
    │ vulnerable       │  │ secure           │
    │                  │  │                  │
    │ Code:            │  │ Code:            │
    │ String Concat    │  │ Parameterized    │
    │                  │  │ Queries          │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             │  Both Send          │
             │  Detection Logs     │
             │  If Suspicious      │
             │                     │
             └────────────┬────────┘
                          │
                   ┌──────▼──────┐
                   │  MySQL DB   │
                   │             │
                   │ lab_users   │
                   │ audit_logs  │
                   └─────────────┘
```

---

## 🎓 Learning Map

```
START HERE
    │
    ├─→ Understanding SQL Injection Concept
    │   └─→ Read: "What is SQL Injection?"
    │
    ├─→ See Vulnerability in Action
    │   └─→ Test: "OR '1'='1" payload
    │
    ├─→ Understand How Attacks Work
    │   ├─→ Test: Multiple payloads
    │   └─→ Study: Resulting SQL queries
    │
    ├─→ Learn Why Parameterized Works
    │   ├─→ Read: Secure Code Examples
    │   └─→ Test: Payloads on Secure Endpoint
    │
    ├─→ Understand Detection
    │   ├─→ Read: Detection Patterns
    │   └─→ View: Security Logs
    │
    └─→ Master the Topic
        ├─→ Test Custom Payloads
        ├─→ Review Backend Code
        ├─→ Understand Database Protection
        └─→ Apply Knowledge to Own Code
```

---

## ✨ Key Takeaways

```
┌────────────────────────────────────────────────────────┐
│ 1. ALWAYS use parameterized queries                    │
│    (Never concatenate user input into SQL)             │
│                                                        │
│ 2. SQL Injection is SERIOUS but PREVENTABLE            │
│    (Proper practices eliminate the risk)               │
│                                                        │
│ 3. Defense in Depth is KEY                            │
│    (Multiple layers catch what one misses)             │
│                                                        │
│ 4. Input Validation helps but isn't enough             │
│    (Must secure the SQL execution itself)              │
│                                                        │
│ 5. Monitor and Log suspicious activity                 │
│    (Detection catches attacks that slip through)       │
└────────────────────────────────────────────────────────┘
```

---

**Visual Guide Complete! 📚**  
Now review the detailed documentation for deeper understanding.
