# ShopZone SQL Injection Detection Lab

This lab is a safe training feature for detecting suspected SQL injection attempts during login. It does not introduce SQL injection vulnerabilities, does not concatenate user input into SQL queries, and does not allow authentication bypass.

## What It Detects

The login endpoint inspects the submitted `username` and `password` fields before any database lookup. It looks for suspicious patterns such as SQL comments, boolean conditions, `UNION SELECT`, stacked query indicators, and suspicious SQL keywords or database functions.

When a suspicious payload is detected, ShopZone:

1. Rejects the login request.
2. Returns `Suspicious input detected.`
3. Writes a structured `sql_injection_attempt` event to `logs/security.json.log`.
4. Saves the event to the `audit_logs` table for the Admin Security Events page.

## Safe Trigger Examples

Use the normal login form or call the API directly with a harmless simulated payload:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin'' OR ''1''=''1","password":"training"}'
```

Expected response:

```json
{
  "error": "Suspicious input detected."
}
```

Other safe examples:

```text
admin'--
' UNION SELECT username,password FROM users--
admin'; DROP TABLE users;--
```

These examples are detected and blocked before ShopZone attempts authentication.

## Local Verification

Check the security log:

```powershell
Get-Content logs/security.json.log -Tail 20
```

Look for fields like:

```json
{
  "event_category": "security_audit",
  "event_type": "sql_injection_attempt",
  "severity": "high",
  "username_attempt": "admin' OR '1'='1",
  "source_ip": "::1",
  "endpoint": "/api/auth/login",
  "request_id": "..."
}
```

You can also view events in the ShopZone admin panel:

1. Login as an admin.
2. Open Admin Panel.
3. Select Security Events / Audit Logs.
4. Filter Event Type by SQL Injection Attempt.

## Splunk Verification

Sample searches:

```spl
index=shopzone event_type="sql_injection_attempt"
```

```spl
index=shopzone event_category="security_audit"
```

Useful training searches:

```spl
index=shopzone event_type="sql_injection_attempt"
| stats count by source_ip, username_attempt
```

```spl
index=shopzone event_category="security_audit" severity="high"
| table _time event_type severity source_ip username_attempt endpoint request_id
```

```spl
index=shopzone event_type="sql_injection_attempt"
| timechart span=15m count
```

## Suggested Splunk Dashboard Panels

Create a dashboard named `ShopZone SQL Injection Lab` with these panels:

- Single value: total SQL injection attempts.
- Table: latest attempts with `_time`, `source_ip`, `username_attempt`, `endpoint`, and `request_id`.
- Timechart: attempts over time.
- Bar chart: attempts by `source_ip`.
- Bar chart: attempts by `username_attempt`.

## Security Notes

- The login flow keeps using prepared statements through `dbQuery('SELECT * FROM users WHERE username = ?', [username])`.
- Suspicious input is rejected before the database credential lookup.
- The feature is detection and logging only; it is not an exploit path.
- Logs are JSON-formatted for Splunk ingestion.
