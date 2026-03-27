const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postTroubleshooting() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Troubleshooting & Incident Response: When Things Break in Production',
    content: `
<p><strong>You shipped perfect code. But production still breaks. This post covers common issues, debugging techniques, memory leak detection, deadlock resolution, and post-mortem analysis to prevent future incidents.</strong></p>

<p>Production incidents are inevitable. How you respond determines whether they're learning opportunities or disasters.</p>

<h2>The Troubleshooting Problem</h2>

<p>When production breaks:</p>

<ul>
  <li><strong>Panic mode</strong> → No one knows what's happening</li>
  <li><strong>Blame game</strong> → "Is it networking?" "Is it the database?"</li>
  <li><strong>Band-aid fixes</strong> → Restart server, hope it works</li>
  <li><strong>No root cause analysis</strong> → Incident repeats next week</li>
</ul>

<p>Proper incident response:</p>

<ul>
  <li>Triage (determine severity)</li>
  <li>Restore service (fastest fix, even if temporary)</li>
  <li>Investigate (root cause analysis)</li>
  <li>Document (post-mortem)</li>
  <li>Prevent (permanent fix, tests)</li>
</ul>

<h2>Common Production Issues (Case Studies)</h2>

<h3>Incident 1: Memory Leak (CPU high, memory grows)</h3>

<p><strong>Symptoms</strong>:</p>

<pre><code>Timeline:
10:00 - Server starts: Memory = 100MB
10:30 - Memory = 200MB (doubled)
11:00 - Memory = 400MB (still growing)
11:30 - OOM killer → Server crashes (memory limit reached)</code></pre>

<p><strong>Investigation</strong>:</p>

<pre><code>1. Take memory profile
   curl http://localhost:6060/debug/pprof/heap > heap.prof
   go tool pprof heap.prof

2. Analyze top allocators
   (pprof) top10
   Showing nodes accounting for 500MB, 95% of 512MB total
       flat  flat%  sum%    cum   cum%
     200MB 39.06% 39.06%  300MB 58.59% bytes.Buffer.String
     150MB 29.30% 68.36%  200MB 39.06% strings.Builder
     100MB 19.53% 87.89%  150MB 29.30% io.ReadAll

3. Root cause: ReadAll in a loop without cleanup
   for {
     body := io.ReadAll(resp.Body)  // Allocates, never freed
     process(body)
     // resp.Body never closed!
   }</code></pre>

<p><strong>Fix</strong>:</p>

<pre><code>for {
  resp, _ := http.Get(url)
  body, _ := io.ReadAll(resp.Body)
  process(body)
  resp.Body.Close()  // ← KEY: Close the reader!
}</code></pre>

<h3>Incident 2: Database Deadlock (Requests hanging)</h3>

<p><strong>Symptoms</strong>:</p>

<pre><code>10:15 - API responses normal
10:16 - Requests start timing out (taking 30s)
10:17 - P99 latency = 30,000ms
10:18 - All requests blocked (0 successful)</code></pre>

<p><strong>Investigation</strong>:</p>

<pre><code>1. Check database connections
   SELECT * FROM pg_stat_activity;

   Query shows:
   - Connection 1: LOCK waiting (waiting for table)
   - Connection 2: LOCK waiting (waiting for table)
   - Connection 3: LOCK waiting (same)
   ...all 100 connections BLOCKED!

2. Check what's locking the table
   SELECT * FROM pg_locks WHERE NOT granted;

   Result: Transaction on connection 5 has exclusive lock
   (acquired at 10:15, never released)

3. Kill the blocking transaction
   SELECT pid FROM pg_stat_activity WHERE pid = 5;
   SELECT pg_terminate_backend(5);</code></pre>

<p><strong>Root cause</strong>:</p>

<pre><code>BEGIN TRANSACTION
  UPDATE accounts SET balance = balance - 100
  WHERE account_id = 1

  // Long-running operation (email sending)
  send_email(...)  ← PROBLEM: Doing I/O inside transaction!

  // By now, 100 connections waiting
COMMIT

Fix: Move I/O outside transaction
BEGIN TRANSACTION
  UPDATE accounts SET balance = balance - 100
  WHERE account_id = 1
COMMIT
send_email(...)  ← Send email AFTER transaction</code></pre>

<h3>Incident 3: Network Timeout (Cascading failures)</h3>

<p><strong>Symptoms</strong>:</p>

<pre><code>10:30 - Database is slow (100ms → 500ms)
10:31 - API starts timing out (60s timeout)
10:32 - Queue backs up (10,000 jobs pending)
10:33 - Memory grows (unprocessed jobs in memory)</code></pre>

<p><strong>Timeline</strong>:</p>

<pre><code>Database (slow query) → Connections blocked
  ↓
API (waiting for DB) → Timeout after 60s
  ↓
HTTP clients (API times out) → Retry immediately
  ↓
Queue grows → Each retry adds more jobs
  ↓
Memory grows → Server eventually crashes</code></pre>

<p><strong>Solution (Circuit Breaker pattern)</strong>:</p>

<pre><code>// Instead of blocking forever:
conn.Query(timeout: 60s)  // Hangs for 60s

// Use circuit breaker:
circuitBreaker := NewCircuitBreaker(
  failureThreshold: 5,     // Fail after 5 errors
  resetTimeout: 30s,       // Try again after 30s
)

try {
  result = circuitBreaker.Execute(func() {
    return conn.Query(timeout: 5s)  // Short timeout
  })
} catch CircuitBreakerOpen {
  // Circuit is open, fail fast
  return error("Service unavailable")
}

Result:
- After 5 failed DB queries in 1 second
- Circuit opens, fast-fails new requests (no 60s wait)
- Clients can retry other services
- After 30s, circuit tries again</code></pre>

<h2>Debugging Techniques</h2>

<h3>1. Strace (system call tracing)</h3>

<pre><code>// Hanging process? See what it's doing
strace -p 12345

Result:
futex(0x7f123456, FUTEX_WAIT, 0, NULL) = 0
  (waiting on a lock)

or

epoll_wait(3, [{fd=5, events=EPOLLIN}], 128, -1)
  (waiting for network I/O)</code></pre>

<h3>2. Curl with verbose output</h3>

<pre><code>curl -v https://api.example.com/health

// Shows:
*   Trying 10.0.0.1...
* Connected to api.example.com (10.0.0.1) port 443 (#0)
* SSL/TLS connection...
* Sending HTTP request...
< HTTP/1.1 200 OK

// Hangs after "Trying" = DNS issue
// Hangs after "Connected" = Network/firewall issue
// Hangs after "Sending HTTP" = Server not responding</code></pre>

<h3>3. Netstat (network connections)</h3>

<pre><code>netstat -an | grep ESTABLISHED | wc -l
// Shows number of active connections

netstat -an | grep TIME_WAIT | wc -l
// Shows number of closed-but-waiting connections
// (high number = possible file descriptor leak)</code></pre>

<h2>Post-Mortem Template</h2>

<pre><code>INCIDENT POSTMORTEM

Title: Database deadlock on 2026-03-27 10:15 UTC
Severity: P1 (Complete outage)
Duration: 3 minutes (10:15-10:18)
Impact: 500 failed transactions, $5,000 revenue loss

Root Cause:
  - Long-running email operation held database transaction lock
  - Lock blocked all 100 connection pool connections
  - Cascading timeout → clients retried → queue backlogged

Timeline:
10:15:00 - Slow query detected (database performing maintenance)
10:15:30 - Email operation triggered (coincident)
10:16:00 - First connection timeout
10:16:30 - Connection pool exhausted
10:18:00 - Operator killed deadlocked transaction
10:18:30 - Service recovered

Actions Taken:
  1. Killed blocking transaction (immediate recovery)
  2. Deployed code fix (move I/O outside transaction)
  3. Added circuit breaker for DB timeouts
  4. Increased timeout alerts (alert at 5s instead of 60s)

Action Items:
  ☐ Code review: transaction boundaries (due 2026-03-29)
  ☐ Add automated deadlock detection (due 2026-04-05)
  ☐ Update runbook for database timeouts (due 2026-03-28)
  ☐ Load test with slow database (due 2026-04-10)

Preventative Measures:
  - Lint rule: No I/O inside transactions
  - Test: Simulate slow database, verify fast-fail
  - Monitoring: Alert on transaction duration > 5s</code></pre>

<h2>Incident Response Checklist</h2>

<p><strong>Immediate (first 5 minutes)</strong>:</p>

<pre><code>☐ Page on-call engineer (if not already)
☐ Create incident channel (Slack #incident-2026-03-27)
☐ Identify severity (P1=outage, P2=degradation, P3=bug)
☐ Engage incident commander (coordinates team)
☐ Update status page (customer communication)</code></pre>

<p><strong>First 15 minutes</strong>:</p>

<pre><code>☐ Triage: What's broken? (API? Database? Network?)
☐ Scope: How many customers affected?
☐ Timeline: When did it start?
☐ Gather metrics (CPU, memory, database connections, error logs)
☐ Decide: Restore service (temporary fix) or investigate?</code></pre>

<p><strong>Restoration (if needed)</strong>:</p>

<pre><code>☐ Identify quickest fix (restart? rollback? kill query?)
☐ Execute fix
☐ Verify service restored (health check, smoke test)
☐ Communicate recovery to customers</code></pre>

<p><strong>After service restored</strong>:</p>

<pre><code>☐ Investigate root cause (logs, traces, profiling)
☐ Schedule permanent fix (code change, config change)
☐ Write post-mortem
☐ Plan preventative measures
☐ Set reminders for follow-ups</code></pre>

<h2>Real-World Example: Banking Payment Outage</h2>

<pre><code>Incident: 2026-03-27 15:30 UTC

Reports: "Payments failing"

Response timeline:
15:30 - Alert triggered (error rate >5%)
15:31 - On-call engineer paged, gathers team
15:32 - Check status: payment API returning 500 errors
15:33 - Check logs: "Connection timeout: postgres.example.com"
15:34 - Database is responsive but slow (200ms queries)
15:35 - Check database connections: 100/100 connections BUSY
15:36 - Identify: Connection pool exhausted
15:37 - Root cause: New report query (FULL SCAN of 10M rows) locked table
15:38 - Kill report query: SELECT pg_terminate_backend(pid)
15:39 - Connections freed, API recovers
15:40 - Service back to normal (10 minutes total)

Post-mortem:
- Report should not run during business hours
- Add max_rows limit to reports
- Implement query timeout (30s max)
- Add alert: DB connection pool > 80%

Result: Incident prevented with better monitoring and query limits</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Monitoring detects issues early</h3>
<p>Catch problems at 10% impact, not 100%.</p>

<h3>2. Runbooks save lives</h3>
<p>"When latency spikes, check X, Y, Z" beats "umm, what do we do?"</p>

<h3>3. Postmortems prevent repeats</h3>
<p>Root cause + preventative measure = incident never happens again.</p>

<h3>4. Blameless culture</h3>
<p>Focus on "why did the system allow this?" not "who broke it?"</p>

<h3>5. Testing in production</h3>
<p>Chaos engineering: intentionally break things to find weak points.</p>

<h2>Complete 13-Post Series Summary</h2>

<p>We've covered the complete backend system:</p>

<ul>
  <li><strong>Posts 1-3</strong>: Foundation (banking, REST API, framework)</li>
  <li><strong>Posts 4-7</strong>: Advanced (database, auth, caching, async)</li>
  <li><strong>Posts 8-11</strong>: Operations (monitoring, logging, K8s, CI/CD)</li>
  <li><strong>Posts 12-13</strong>: Performance & troubleshooting (5x throughput, incident response)</li>
</ul>

<p>From 0 to production at 50K req/sec.</p>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Troubleshooting', 'Incident Response', 'Debugging', 'Post-Mortem', 'Production Issues', 'Monitoring', 'Operations', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 13 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postTroubleshooting();
