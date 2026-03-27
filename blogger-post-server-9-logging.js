const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postLogging() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Logging & Distributed Tracing: Complete Visibility Across Services',
    content: `
<p><strong>Metrics show WHAT happened. Logs show WHY it happened. This post covers structured logging, ELK Stack (Elasticsearch, Logstash, Kibana), Jaeger distributed tracing, and how to trace requests across 10+ microservices.</strong></p>

<p>A single metric (request failed) means nothing. Logs tell the story.</p>

<h2>The Logging Problem</h2>

<p>Bad logging practices:</p>

<ul>
  <li><strong>Unstructured logs</strong>: "Error: connection failed" (no context)</li>
  <li><strong>No trace ID</strong>: Can't correlate related logs from different services</li>
  <li><strong>Local logs only</strong>: SSH into 10 servers to debug (painful)</li>
  <li><strong>Lost logs on restart</strong>: Server crashes, logs gone</li>
</ul>

<p>Good logging practices:</p>

<ul>
  <li><strong>Structured JSON logs</strong>: {timestamp, level, service, trace_id, user_id, message}</li>
  <li><strong>Trace ID propagation</strong>: Same ID through entire request lifecycle</li>
  <li><strong>Centralized logging</strong>: All logs in one searchable place</li>
  <li><strong>Long retention</strong>: 30-90 days for investigation</li>
</ul>

<h2>Component 1: Structured Logging (JSON Format)</h2>

<p><strong>Bad log (unstructured)</strong>:</p>

<pre><code>2026-03-27 10:15:32 ERROR User registration failed: connection timeout</code></pre>

<p><strong>Good log (structured JSON)</strong>:</p>

<pre><code>{
  "timestamp": "2026-03-27T10:15:32.123Z",
  "level": "ERROR",
  "service": "auth-service",
  "trace_id": "xyz-123",
  "span_id": "span-456",
  "user_id": 789,
  "endpoint": "/api/register",
  "method": "POST",
  "message": "Database connection timeout",
  "error": "connection deadline exceeded",
  "duration_ms": 5000,
  "db_host": "postgres.example.com"
}</code></pre>

<p><strong>Benefits</strong>:</p>

<pre><code>1. Parseable (JSON, not free text)
2. Searchable (query: service="auth" AND level="ERROR")
3. Contextual (has trace_id, user_id, endpoint)
4. Aggregatable (group by service, endpoint)</code></pre>

<h3>Logging in Code</h3>

<pre><code>// Go example
logger := log.WithFields(log.Fields{
  "service": "auth-service",
  "trace_id": traceID,
  "user_id": userID,
})

try {
  user := db.CreateUser(email, password)
  logger.WithFields(log.Fields{
    "action": "user_created",
    "user_id": user.ID,
  }).Info("User registration successful")
} catch err {
  logger.WithFields(log.Fields{
    "error": err.Error(),
    "action": "user_create_failed",
  }).Error("User registration failed")
}</code></pre>

<h2>Component 2: ELK Stack (Elasticsearch, Logstash, Kibana)</h2>

<p><strong>Architecture</strong>:</p>

<pre><code>Application Servers
  │ (JSON logs to stdout/file)
  ↓
Filebeat (log shipper)
  ├─ Reads log files
  ├─ Ships to Logstash
  │
Logstash (log processor)
  ├─ Parse JSON
  ├─ Extract fields
  ├─ Enrich with metadata
  ├─ Send to Elasticsearch
  │
Elasticsearch (searchable index)
  ├─ 100K events/sec ingestion
  ├─ 30-90 day retention
  ├─ Index rotation (logs-2026-03-27)
  │
Kibana (visualization)
  ├─ Search queries
  ├─ Dashboard creation
  ├─ Alerting based on logs</code></pre>

<h3>Elasticsearch Query Examples</h3>

<pre><code>Find all errors in last hour:
  level: ERROR AND timestamp: [now-1h TO now]

Find slow requests:
  duration_ms > 1000 AND timestamp: [now-1h TO now]

Find user-specific logs:
  user_id: 123 AND trace_id: xyz-456

Find service-specific errors:
  service: "auth-service" AND level: ERROR

Find cascading failures (service A fails, then B):
  timestamp range and trace_id correlation</code></pre>

<h2>Component 3: Distributed Tracing (Jaeger)</h2>

<p><strong>Problem</strong>: Request goes through 5 services. Where does it slow down?</p>

<p><strong>Trace propagation</strong>:</p>

<pre><code>User Request
  │
  ├─ API Gateway (trace_id: abc-123)
  │   ├─ Auth Service (span: auth_check, duration: 50ms)
  │   │   ├─ Database Query (span: db_query, duration: 30ms)
  │   │   └─ Cache Lookup (span: cache_hit, duration: 1ms)
  │   │
  │   ├─ User Service (span: get_user, duration: 100ms)
  │   │   └─ Database Query (span: db_query, duration: 95ms)
  │   │
  │   └─ Notification Service (span: send_welcome_email, duration: 2000ms)
  │       └─ SMTP Connection (span: smtp_send, duration: 1950ms)
  │
  └─ Total: 2150ms

Trace ID (abc-123) links all spans together!</code></pre>

<h3>Trace Sampling</h3>

<pre><code>At 50K req/sec, tracing every request = 50K traces/sec = expensive

Sampling strategy:
- Error requests: 100% (all errors traced)
- High latency (>1s): 10% sample
- Normal requests: 1% sample

Result: ~500 traces/sec instead of 50,000/sec (100x reduction)</code></pre>

<h2>Component 4: Log Aggregation & Analysis</h2>

<p><strong>Real-time dashboards</strong>:</p>

<pre><code>Kibana Dashboard for 50K req/sec system:

Errors in last 5 minutes: 0
P99 request duration: 250ms
Requests per service:
  ├─ API Gateway: 50,000
  ├─ Auth Service: 40,000
  ├─ User Service: 35,000
  └─ Notification Service: 8,000

Top 5 slow endpoints:
  1. POST /api/user/register (2150ms avg)
  2. GET /api/leaderboard (500ms avg)
  3. POST /api/payment/process (450ms avg)
  ...

Top 5 error endpoints:
  1. POST /api/oauth/callback (0.5% error rate)
  2. POST /api/report/generate (0.2% error rate)
  ...</code></pre>

<h2>Complete Observability Stack</h2>

<pre><code>Application (instrumented with traces + structured logs)
  ├─ Logs: stdout (JSON)
  ├─ Traces: OpenTelemetry (trace_id in every log)
  │
Filebeat (ships logs)
  ↓
ELK Stack
  ├─ Logstash (processes)
  ├─ Elasticsearch (stores 100K events/sec)
  └─ Kibana (visualizes)

Jaeger
  ├─ Collects traces
  ├─ Shows service dependency graph
  └─ Identifies bottlenecks

Result: Complete view of system health</code></pre>

<h2>Real-World Example: Payment Processing</h2>

<pre><code>User makes payment (trace_id: payment-xyz-123)

Logs:
[payment-xyz-123] Payment initiated by user:456 for $100
[payment-xyz-123] Validating card...
[payment-xyz-123] Card validation passed (Stripe)
[payment-xyz-123] Charging $100 to card
[payment-xyz-123] ERROR: Stripe API timeout (retrying)
[payment-xyz-123] Retry 1/3: Charging $100
[payment-xyz-123] Charge successful
[payment-xyz-123] Notifying user...
[payment-xyz-123] Email sent (SendGrid)
[payment-xyz-123] Payment complete in 5000ms

Trace view:
├─ Validate Card (50ms) → Stripe API
├─ Charge (1st attempt: timeout 3000ms)
├─ Charge (2nd attempt: success 1500ms)
├─ Send Email (500ms) → SendGrid
└─ Total: 5050ms

Dashboard shows:
- Payment success rate: 99.8%
- Retry rate: 0.5% (indicates Stripe flakiness)
- Email delivery rate: 99.9%</code></pre>

<h2>Testing: 20+ Log Patterns</h2>

<pre><code>✓ JSON logs parse correctly
✓ Trace ID propagates through all services
✓ Span timing accurate
✓ Error logs captured
✓ Slow query logs recorded
✓ Elasticsearch indexing works
✓ Kibana queries return correct results
✓ Trace sampling works
✓ OpenTelemetry SDK integration</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Structured logging is not optional</h3>
<p>JSON format enables searching, aggregation, automation.</p>

<h3>2. Trace IDs are essential</h3>
<p>Without them, debugging across services is impossible.</p>

<h3>3. Sampling is critical at scale</h3>
<p>Tracing every request is expensive. Sample intelligently.</p>

<h3>4. Retention vs cost tradeoff</h3>
<p>30 days logs = fine for most issues. 90 days = expensive but useful for long-term trends.</p>

<h3>5. Log patterns reveal system behavior</h3>
<p>Error logs show what broke. Slow logs show bottlenecks. Success logs show happy path.</p>

<h2>Next: Kubernetes Deployment</h2>

<p>Now that we see everything, let's deploy at scale:</p>

<ul>
  <li>Pod/Service/Deployment manifests</li>
  <li>Ingress controller (Nginx)</li>
  <li>StatefulSet for databases</li>
  <li>Persistent volumes (PV/PVC)</li>
  <li>Auto-scaling (HPA/VPA)</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Logging', 'Distributed Tracing', 'ELK Stack', 'Jaeger', 'Observability', 'Elasticsearch', 'Kibana', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 9 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postLogging();
