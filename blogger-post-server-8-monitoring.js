const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postMonitoring() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Monitoring & Alerting: Prometheus, Grafana, and Real-Time Visibility',
    content: `
<p><strong>You can't fix what you can't see. This post covers monitoring: Prometheus metrics, Grafana dashboards, alert rules for 99.99% uptime, and custom KPIs.</strong></p>

<p>Production systems fail silently. Build visibility first.</p>

<h2>The Monitoring Problem</h2>

<p>Without monitoring:</p>
<ul>
  <li>Users report slowness → no data</li>
  <li>Database fails → learn from customer complaints (2 hours late)</li>
  <li>Memory leak → server crashes at 3 AM (no warning)</li>
</ul>

<p>With monitoring: Alert at 95% CPU (before crash), detect latency spikes in seconds, track memory trends, identify DDoS attacks instantly.</p>

<h2>Component 1: Prometheus Architecture</h2>

<p><strong>What is Prometheus?</strong> Time-series database. Scrapes endpoints every 15 seconds, stores metrics with timestamps.</p>

<pre><code>Application (exposes /metrics)
  ↓
Prometheus (scrapes every 15s)
  ├─ cpu_usage: 0.65
  ├─ memory_bytes: 1,024,000
  └─ requests_total: 150,000
  ↓
Grafana (queries every 60s)
  └─ Renders dashboard with graphs</code></pre>

<h3>Metric Types</h3>

<pre><code>1. Counter (always increasing)
   requests_total: 150,000
   errors_total: 2,500

2. Gauge (up/down)
   cpu_usage: 0.65
   memory_bytes: 1,024,000

3. Histogram (distribution)
   request_duration: [0.001s, 0.005s, 0.010s, 0.050s, 0.100s]
   Calculates p50, p95, p99 latencies

4. Summary (percentiles)
   Similar to histogram</code></pre>

<h2>Component 2: Instrumentation</h2>

<p><strong>Adding metrics to Go server</strong>:</p>

<pre><code>var (
  requestCounter = prometheus.NewCounterVec(
    prometheus.CounterOpts{Name: "http_requests_total"},
    []string{"method", "endpoint"},
  )
  requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
      Name: "http_request_duration_seconds",
      Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1},
    },
    []string{"method", "endpoint"},
  )
)

// In handler:
func handleRequest(w, r) {
  start := time.Now()
  doWork()
  duration := time.Since(start).Seconds()

  requestCounter.WithLabelValues(r.Method, r.URL.Path).Inc()
  requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
}

// Expose /metrics
http.Handle("/metrics", promhttp.Handler())</code></pre>

<h2>Component 3: Grafana Dashboards</h2>

<p><strong>Key panels for 50K req/sec system</strong>:</p>

<pre><code>Requests/sec (real-time traffic)
P50/P95/P99 Latency (response time)
CPU/Memory/Disk Usage (resources)
Database Connections (dependencies)
Error Rate (application health)
Cache Hit Rate (performance)
Queue Length (async processing)

Update frequency: Every 10 seconds</code></pre>

<h2>Component 4: Alert Rules (PrometheusRules)</h2>

<p><strong>Example alerts</strong>:</p>

<pre><code>1. High CPU (>80% for 5 minutes)
   Alert: "CPU usage above threshold"
   Action: Auto-scale or investigate

2. High P99 Latency (>500ms)
   Alert: "Response time degradation"
   Action: Check database, cache hit rate

3. Error Rate >1%
   Alert: "High error rate detected"
   Action: Investigate logs, check dependencies

4. Memory Leak (memory increase >10% in 1 hour)
   Alert: "Potential memory leak"
   Action: Restart container, investigate

5. Down time detection (<1 successful request in 1 minute)
   Alert: "Service unavailable"
   Action: Page on-call engineer immediately</code></pre>

<h2>Component 5: SLA Monitoring (99.99% Uptime)</h2>

<p><strong>Calculating SLA</strong>:</p>

<pre><code>99.99% uptime = 52.6 minutes downtime per year
  = 4.38 minutes per month
  = 8.64 seconds per day

Calculation:
uptime = (successful_requests) / (total_requests) * 100

Example (daily):
- Successful: 4,320,000 requests
- Failures: 43 requests
- Uptime: 4,320,000 / 4,320,043 = 99.999% ✓ (exceeds SLA)</code></pre>

<h2>Component 6: Custom KPIs</h2>

<p><strong>Business metrics (not just infrastructure)</strong>:</p>

<pre><code>1. User Registration Rate
   registrations_per_minute = (NEW_USERS - previous) / 60

2. Transaction Success Rate
   transaction_success = SUCCESS / (SUCCESS + FAILED) * 100

3. Average Order Value
   avg_order_value = TOTAL_REVENUE / ORDERS_COUNT

4. Payment Conversion
   conversion = COMPLETED_PAYMENTS / INITIATED_PAYMENTS * 100

5. Feature Usage
   feature_X_daily_active_users = COUNT(DISTINCT user_id)

Dashboard:
├─ Infrastructure metrics (CPU, memory, latency)
├─ Application metrics (errors, request rate)
└─ Business KPIs (revenue, conversion, user growth)</code></pre>

<h2>Complete Monitoring Stack</h2>

<pre><code>Applications (Go, Node.js, Python)
  │ (expose /metrics endpoint)
  ↓
Prometheus (scraper + time-series DB)
  ├─ Store metrics with timestamps
  ├─ 15GB per 100K metrics/sec for 1 year
  ├─ Query language: PromQL
  │
Grafana (dashboard + visualization)
  ├─ Charts, heatmaps, tables
  ├─ Template variables (filter by host, service)
  ├─ Annotations (mark deployments, incidents)
  │
Alertmanager (alert routing)
  ├─ Group alerts
  ├─ Send to: Slack, PagerDuty, Email
  │
Human (on-call engineer)
  └─ Respond to incidents</code></pre>

<h2>Real-World Example: Banking System</h2>

<pre><code>Dashboard for transaction processing:

Requests/sec: 500 (normal baseline)
P99 Latency: 120ms (acceptable)
Error Rate: 0.01% (2 errors per 20K requests)

Alert triggers at 15:30:
├─ P99 Latency jumps to 800ms
├─ Database connections: 95/100 (saturated)
├─ Query response time: 500ms (5x slower)

Actions taken:
1. Alert fires → Slack notification
2. On-call engineer checks dashboard
3. See: Database slow queries
4. Kill long-running query
5. Latency drops to 150ms in 2 minutes
6. SLA maintained (downtime < 8.64 seconds)</code></pre>

<h2>Testing: 20+ Metrics & Alerts</h2>

<pre><code>✓ Counter increments correctly
✓ Gauge tracks current value
✓ Histogram buckets accurate
✓ Percentile calculations (p50, p95, p99)
✓ Alert fires when CPU > 80%
✓ Alert clears when CPU drops
✓ Multiple alerts don't spam
✓ Alert deduplication works
✓ SLA calculation accurate
✓ Custom KPI tracking correct</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Metrics need context</h3>
<p>CPU 80% might be fine for batch jobs, critical for API.</p>

<h3>2. Alert on trends, not absolutes</h3>
<p>Memory 100MB is normal for one service, leak for another.</p>

<h3>3. Dashboards are for humans</h3>
<p>Show what matters, hide noise. Less is more.</p>

<h3>4. Latency is the canary</h3>
<p>Latency spike usually precedes failure (queue building up).</p>

<h3>5. Infrastructure + Business metrics</h3>
<p>CPU tells you system load. Conversion tells you business impact.</p>

<h2>Next: Logging & Distributed Tracing</h2>

<p>Metrics show WHAT happened. Logs show WHY:</p>

<ul>
  <li>Structured logging (JSON format)</li>
  <li>ELK Stack (Elasticsearch, Logstash, Kibana)</li>
  <li>Jaeger distributed tracing</li>
  <li>Trace correlation across services</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Monitoring', 'Prometheus', 'Grafana', 'Alerting', 'SLA', 'Metrics', 'Observability', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 8 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postMonitoring();
