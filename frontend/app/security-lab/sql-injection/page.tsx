"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, ArrowLeft, Terminal, Shield, HelpCircle, 
  Code, List, CheckCircle, AlertTriangle, Play, Database, Key, Sparkles, RefreshCw
} from 'lucide-react';
import Navbar from '../../../components/Navbar';

type ModeType = 'vulnerable' | 'secure';
type DocTabType = 'payloads' | 'detection' | 'splunk' | 'prevention';

export default function SqlInjectionLab() {
  const [mode, setMode] = useState<ModeType>('vulnerable');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [terminalResult, setTerminalResult] = useState<any>(null);
  const [errorText, setErrorText] = useState('');
  const [docTab, setDocTab] = useState<DocTabType>('payloads');

  // Live SQL Query string display
  const getLiveQuery = () => {
    if (mode === 'vulnerable') {
      return `SELECT * FROM lab_users WHERE username = '${username || 'INPUT_USERNAME'}' AND password = '${password || 'INPUT_PASSWORD'}';`;
    }
    return `PREPARE stmt FROM 'SELECT * FROM lab_users WHERE username = ? AND password = ?';
SET @usr = '${username || 'INPUT_USERNAME'}';
SET @pwd = '${password || 'INPUT_PASSWORD'}';
EXECUTE stmt USING @usr, @pwd;`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTerminalResult(null);
    setErrorText('');

    const endpoint = mode === 'vulnerable' ? 'login-vulnerable' : 'login-secure';
    try {
      const response = await fetch(`http://localhost:5000/api/security-lab/sql-injection/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        setTerminalResult(data);
        if (data.error === 'Suspicious input detected') {
          setErrorText('ALERT: SQL Injection Attempt Flagged & Logged!');
        } else {
          setErrorText(data.message || 'Access Denied: Invalid credentials.');
        }
      } else {
        setTerminalResult(data);
      }
    } catch (err: any) {
      setErrorText('Error connecting to the lab backend server.');
      setTerminalResult({ error: 'Connection failure', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fillPayload = (usr: string, pwd: string) => {
    setUsername(usr);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Isolated Lab Warning & Header */}
        <div className="bg-[#1e293b] text-white p-6 rounded-lg border border-slate-700 shadow-md mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-900 tracking-wider">
                Cybersecurity Training Lab – Not Production
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Sandbox Active</span>
            </div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
              <Shield className="h-6.5 w-6.5 text-[#febd69]" />
              <span>SQL Injection (SQLi) Demonstration &amp; Logs Lab</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Explore how unparameterized queries permit malicious query syntax manipulation, test defensive prepared statements, and analyze Splunk metrics.
            </p>
          </div>
          <div>
            <Link href="/admin" className="px-3.5 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Admin Console</span>
            </Link>
          </div>
        </div>

        {/* Lab Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Lab Form and SQL Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Mode Selector and Form Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
              
              {/* Selector */}
              <div className="flex flex-col sm:flex-row gap-3 border-b border-slate-100 pb-4 justify-between items-start sm:items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Lab Protection Level:</span>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
                  <button
                    onClick={() => { setMode('vulnerable'); setTerminalResult(null); setErrorText(''); }}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                      mode === 'vulnerable' 
                        ? 'bg-rose-500 text-white shadow-sm' 
                        : 'text-slate-650 hover:text-slate-850 hover:bg-slate-200'
                    }`}
                  >
                    Vulnerable Mode
                  </button>
                  <button
                    onClick={() => { setMode('secure'); setTerminalResult(null); setErrorText(''); }}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                      mode === 'secure' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-650 hover:text-slate-850 hover:bg-slate-200'
                    }`}
                  >
                    Secure Mode
                  </button>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-start gap-3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                {mode === 'vulnerable' ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-rose-800 text-xs">VULNERABLE PATHWAY: String Concatenation</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Queries are created by sewing input directly inside quotes. This allows inputs with SQL formatting to escape the string boundaries and run raw statements.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-800 text-xs">SECURE PATHWAY: Parameterization</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Inputs are mapped to parameters (represented by placeholders `?`). The database compiles the SQL template first, treating inputs as literal arguments, completely blocking payload execution.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Lab Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 flex items-center gap-1">
                      <Database className="h-3.5 w-3.5 text-slate-400" />
                      <span>Lab Username</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter username or payload..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-250 rounded text-xs focus:outline-none focus:border-amber-400 font-mono text-slate-800"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1.5 flex items-center gap-1">
                      <Key className="h-3.5 w-3.5 text-slate-400" />
                      <span>Lab Password</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter password..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-250 rounded text-xs focus:outline-none focus:border-amber-400 font-mono text-slate-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[10px] text-slate-400">
                    Target Table: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-amber-700">lab_users</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 rounded text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors ${
                      mode === 'vulnerable' 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    <span>Run Query Demo</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SQL Query Visualizer */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  <span>Generated SQL Statement (Live)</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                  {mode === 'vulnerable' ? 'RAW CONCATENATION' : 'PREPARED STATEMENT'}
                </span>
              </div>
              <div className="bg-[#1e293b] p-4 rounded border border-slate-800 font-mono text-xs text-amber-350 overflow-x-auto leading-relaxed shadow-inner">
                <pre>{getLiveQuery()}</pre>
              </div>
            </div>

            {/* Response Console Terminal */}
            <div className="bg-[#020617] border border-slate-900 rounded-lg p-5 shadow-2xl space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold flex items-center gap-1">
                <Terminal className="h-4 w-4" />
                <span>Sandbox Output Terminal</span>
              </span>

              {errorText && (
                <div className={`px-4 py-2 border rounded text-xs font-bold ${
                  errorText.includes('ALERT') 
                    ? 'bg-rose-950/30 border-rose-800 text-rose-400' 
                    : 'bg-amber-950/30 border-amber-800 text-amber-400'
                }`}>
                  {errorText}
                </div>
              )}

              <div className="bg-[#0b1329] p-4 rounded border border-slate-900 font-mono text-xs text-emerald-400 min-h-24 max-h-56 overflow-y-auto leading-relaxed scrollbar-thin">
                {terminalResult ? (
                  <pre>{JSON.stringify(terminalResult, null, 2)}</pre>
                ) : (
                  <span className="text-slate-600 block text-center mt-6">Run a demo query to see console logs...</span>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Payloads, Documentation, Detection Rules */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Documentation Tabs Navigation */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5">
              
              {/* Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 border border-slate-200 rounded">
                <button
                  onClick={() => setDocTab('payloads')}
                  className={`py-1.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    docTab === 'payloads' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Payloads
                </button>
                <button
                  onClick={() => setDocTab('detection')}
                  className={`py-1.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    docTab === 'detection' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Rules
                </button>
                <button
                  onClick={() => setDocTab('splunk')}
                  className={`py-1.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    docTab === 'splunk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Splunk
                </button>
                <button
                  onClick={() => setDocTab('prevention')}
                  className={`py-1.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    docTab === 'prevention' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Defense
                </button>
              </div>

              {/* Tab Content: Payloads */}
              {docTab === 'payloads' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                      <span>Interactive SQLi Lab Payloads</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Select one of the training payloads below to auto-fill the login form, then click **Run Query Demo** in Vulnerable and Secure modes to analyze differences.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Bypass 1 */}
                    <div className="border border-slate-200 p-3 rounded hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-rose-600 uppercase font-mono">Bypass: Auth Always True</span>
                        <button
                          type="button"
                          onClick={() => fillPayload("admin_demo' OR '1'='1", "any")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-250 rounded text-[9px] font-bold cursor-pointer transition-colors"
                        >
                          Use Payload
                        </button>
                      </div>
                      <span className="block font-mono text-xs bg-slate-50 border px-2 py-1 rounded text-slate-650 mb-1 max-w-full overflow-x-auto">
                        admin_demo' OR '1'='1
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Forces the boolean check inside WHERE clause to always return TRUE, bypassing password verification.
                      </p>
                    </div>

                    {/* Bypass 2 */}
                    <div className="border border-slate-200 p-3 rounded hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-rose-600 uppercase font-mono">Bypass: Comment SQL</span>
                        <button
                          type="button"
                          onClick={() => fillPayload("admin_demo' -- ", "any")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-250 rounded text-[9px] font-bold cursor-pointer transition-colors"
                        >
                          Use Payload
                        </button>
                      </div>
                      <span className="block font-mono text-xs bg-slate-50 border px-2 py-1 rounded text-slate-650 mb-1 max-w-full overflow-x-auto">
                        {"admin_demo' -- "}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Injects a comment indicator (`-- ` with space in MySQL), which comments out the remainder of the query (`AND password = '...'`), logging in as the target user without entering a password.
                      </p>
                    </div>

                    {/* Bypass 3 */}
                    <div className="border border-slate-200 p-3 rounded hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-rose-600 uppercase font-mono">UNION Query Data Leak</span>
                        <button
                          type="button"
                          onClick={() => fillPayload("nonexistent' UNION SELECT 99, 'injected', 'secret_pass', 'FLAG{union_sqli_leak_8821}' --", "any")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-250 rounded text-[9px] font-bold cursor-pointer transition-colors"
                        >
                          Use Payload
                        </button>
                      </div>
                      <span className="block font-mono text-xs bg-slate-50 border px-2 py-1 rounded text-slate-650 mb-1 max-w-full overflow-x-auto">
                        {"nonexistent' UNION SELECT 99, 'injected', 'secret_pass', 'FLAG{...}' --"}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Combines the base query results with a custom SELECT query statement, leaking mock internal database columns.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab Content: Detection Rules */}
              {docTab === 'detection' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <List className="h-4.5 w-4.5 text-blue-500" />
                    <span>Suspicious Pattern Rules</span>
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    The detection utility monitors credentials for patterns that indicate SQL Injection payloads, logging blocks to Splunk index logs:
                  </p>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px]">
                      <span className="font-bold text-slate-700 block">1. Comments and Markers</span>
                      <code className="text-amber-700 font-mono block mt-1 bg-white p-1 border rounded text-[10px]">/(--|#|\/\*|\*\/)/</code>
                      <span className="text-slate-400 block mt-1">Detects double hyphen comment syntax and block comments.</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px]">
                      <span className="font-bold text-slate-700 block">2. Boolean Conditions</span>
                      <code className="text-amber-700 font-mono block mt-1 bg-white p-1 border rounded text-[10px]">/\b(or|and)\b\s+[\w'"]+\s*=\s*[\w'"]+/i</code>
                      <span className="text-slate-400 block mt-1">Identifies tautologies like `'1'='1` or `x=x` designed to force a true check.</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px]">
                      <span className="font-bold text-slate-700 block">3. Union Select Statements</span>
                      <code className="text-amber-700 font-mono block mt-1 bg-white p-1 border rounded text-[10px]">/\bunion\s+(all\s+)?select\b/i</code>
                      <span className="text-slate-400 block mt-1">Detects attempts to leak rows from alternate database tables.</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px]">
                      <span className="font-bold text-slate-700 block">4. Stacked Statement Separator</span>
                      <code className="text-amber-700 font-mono block mt-1 bg-white p-1 border rounded text-[10px]">/;\s*(select|insert|update|delete|drop)\b/i</code>
                      <span className="text-slate-400 block mt-1">Detects statement separators used to chain multiple commands.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Splunk Indexing */}
              {docTab === 'splunk' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                    <span>Splunk Security Search Queries</span>
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Use these index queries to analyze demonstration audit logs, evaluate threat levels, and track SQL Injection payloads:
                  </p>

                  <div className="bg-slate-900 p-4 rounded border border-slate-950 font-mono text-[11px] text-emerald-400 space-y-3.5 shadow-inner">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Search for SQL Injection attempts:</span>
                      index=shopzone event_type="sql_injection_attempt"
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Search in security audit events:</span>
                      index=shopzone event_category="security_audit"
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Look up details of lab payloads:</span>
                      index=shopzone details.mode="vulnerable_lab" OR details.mode="secure_lab"
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Prevention Guide */}
              {docTab === 'prevention' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Code className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Prevention: Parameterized Queries</span>
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Prepared statements prevent SQL injection because the database server separates the query structure (SQL commands) from the inputs (bind arguments):
                  </p>

                  <div className="bg-slate-900 p-4 rounded border border-slate-950 font-mono text-[10px] text-[#febd69] overflow-x-auto shadow-inner">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Defensive implementation pattern:</span>
                    {`// 1. DO NOT DO THIS (Vulnerable)
const sql = \`SELECT * FROM users WHERE username = '\${usr}'\`;
const [rows] = await db.query(sql);

// 2. USE THIS INSTEAD (Secure)
const sql = 'SELECT * FROM users WHERE username = ?';
const [rows] = await db.query(sql, [usr]);`}
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Prepared queries compiles the query first. The database will only match the exact literal value <code className="font-mono text-amber-700 font-bold bg-slate-50 px-1 py-0.5 border rounded">usr</code>, preventing any code execution logic bypasses.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
