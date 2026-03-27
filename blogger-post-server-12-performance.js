const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postPerformance() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Performance Optimization Case Study: 10K to 50K req/sec',
    content: `
<p><strong>How do you go from 10K to 50K req/sec? Profiling, identifying bottlenecks, optimizing one layer at a time, and validating each improvement with benchmarks.</strong></p>

<p>Performance isn't about guessing. It's about measuring, identifying the slowest part, fixing it, and repeating.</p>

<h2>The Performance Problem</h2>

<p>Starting point: 10K req/sec with high latency</p>

<pre><code>Metrics:
  - Throughput: 10,000 req/sec
  - P99 Latency: 2000ms (bad!)
  - Error rate: 2% (connection timeouts)
  - Database CPU: 95% (maxed out)
  - API CPU: 45% (idle!)</code></pre>

<p>This tells us: bottleneck is the database, not API logic.</p>

<h2>Step 1: Bottleneck Identification (Profiling)</h2>

<p><strong>Tools</strong>:</p>

<pre><code>Go:
  - pprof (CPU, memory, goroutine profiling)
  - trace (execution timeline)

Python:
  - cProfile (function-level CPU)
  - memory_profiler (line-by-line memory)

Node.js:
  - clinic.js (CPU, memory, I/O)
  - node --prof (V8 profiler)</code></pre>

<p><strong>Example: Go pprof</strong></p>

<pre><code>// Add profiling to your binary
import _ "net/http/pprof"

// Run with profiling endpoint
curl http://localhost:6060/debug/pprof/profile?seconds=10 > cpu.prof
go tool pprof cpu.prof

(pprof) top10
Showing nodes accounting for 8500ms, 85.00% of 10000ms total
      flat  flat%   sum%        cum   cum%
    3000ms 30.00% 30.00%     5000ms 50.00% database/sql.Scan
    2000ms 20.00% 50.00%     3500ms 35.00% crypto/sha256.Sum256
    1500ms 15.00% 65.00%     1500ms 15.00% time.Sleep (garbage collection)
    1000ms 10.00% 75.00%     2000ms 20.00% net.Dial
    ...</code></pre>

<p><strong>Findings</strong>:</p>

<pre><code>1. database/sql.Scan: 50% of time (connection overhead)
2. SHA-256 hashing: 35% of time (key hashing)
3. Garbage collection: 15% of time (allocations)
4. Network dial: 20% of time (no connection pooling)</code></pre>

<h2>Step 2: Fix Connection Pooling (50% improvement)</h2>

<p><strong>Problem</strong>: New database connection per request = 300ms overhead</p>

<p><strong>Solution</strong>: Connection pool</p>

<pre><code>Before:
  Request → Open connection (300ms) → Query (10ms) → Close (20ms) = 330ms
  10K req/sec × 330ms = 3300 seconds = 55 cores needed

After (pool of 100):
  Request → Borrow connection (1ms) → Query (10ms) → Return (1ms) = 12ms
  10K req/sec × 12ms = 120 seconds = 2 cores

Improvement: 330ms → 12ms = 27.5x faster!</code></pre>

<p><strong>Code</strong>:</p>

<pre><code>var db *sql.DB
db, err := sql.Open("postgres", dsn)
db.SetMaxOpenConns(100)
db.SetMaxIdleConns(50)
db.SetConnMaxLifetime(time.Hour)</code></pre>

<p><strong>Benchmark result</strong>:</p>

<pre><code>Before: 10,000 req/sec, P99=2000ms
After:  25,000 req/sec, P99=500ms

Improvement: 2.5x throughput, 4x latency reduction</code></pre>

<h2>Step 3: Replace SHA-256 with FNV-1a (5x improvement)</h2>

<p><strong>Problem</strong>: SHA-256 is slow (computing 32 bytes when only using 4)</p>

<p><strong>Solution</strong>: FNV-1a hash (much faster)</p>

<pre><code>// Before
func hash(key string) uint32 {
    sum := sha256.Sum256([]byte(key))
    return binary.BigEndian.Uint32(sum[:4])
}

// After
func hash(key string) uint32 {
    h := fnv.New32a()
    h.Write([]byte(key))
    return h.Sum32()
}</code></pre>

<p><strong>Benchmark</strong>:</p>

<pre><code>BenchmarkSHA256-8      500000     2000ns/op
BenchmarkFNV1a-8      5000000      380ns/op

Improvement: 2000ns → 380ns = 5.3x faster</code></pre>

<p><strong>System impact</strong>:</p>

<pre><code>Hash operations: 15% of time (from pprof)
15% × 5.3x improvement = 7% overall improvement
Throughput: 25K → 27K req/sec</code></pre>

<h2>Step 4: Reduce Garbage Collection (3x improvement)</h2>

<p><strong>Problem</strong>: Every request allocates new buffers</p>

<p><strong>Solution</strong>: sync.Pool (reuse allocations)</p>

<pre><code>var bufPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 0, 512)
    },
}

func handleRequest(req []byte) {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf[:0])  // Reset and return

    // Use buf instead of allocating new buffer
}</code></pre>

<p><strong>Result</strong>:</p>

<pre><code>Allocation rate before: 1000MB/sec
Allocation rate after: 100MB/sec (10x reduction)
GC pause time: 50ms → 5ms (10x reduction)</code></pre>

<p><strong>System impact</strong>:</p>

<pre><code>GC time: 15% of CPU (from pprof)
Reduction: 15% × (50ms → 5ms) = 5ms per request = 5% improvement
Throughput: 27K → 32K req/sec</code></pre>

<h2>Step 5: Query Optimization (10% improvement)</h2>

<p><strong>Problem</strong>: Database executing inefficient queries</p>

<p><strong>Solution</strong>: Add indexes, optimize queries</p>

<pre><code>Query: SELECT balance FROM accounts WHERE id = ?
  Before: Full table scan (1M rows checked) = 50ms
  After: Index lookup (20 comparisons) = 0.1ms
  Improvement: 500x faster

Query: SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
  Before: No index (full scan + sort) = 100ms
  After: Composite index (user_id, created_at) = 2ms
  Improvement: 50x faster</code></pre>

<p><strong>System impact</strong>:</p>

<pre><code>Database CPU: 95% → 40% (less work)
Query time: 10ms → 2ms average
Throughput: 32K → 40K req/sec</code></pre>

<h2>Step 6: Load Balancing & Horizontal Scaling (2x improvement)</h2>

<p><strong>Problem</strong>: Single API server (CPU limited)</strong>

<p><strong>Solution</strong>: Run 3 API servers + load balancer</p>

<pre><code>Load Balancer (round-robin)
  ├─ API Server 1 (CPU: 40%)
  ├─ API Server 2 (CPU: 40%)
  └─ API Server 3 (CPU: 40%)

Before: 1 server at 40K req/sec, CPU = 95%
After: 3 servers at ~50K req/sec, CPU = 40% per server

Improvement: 40K → 50K req/sec (25% increase)
Room to grow before hitting CPU limits again</code></pre>

<h2>Complete Performance Journey</h2>

<pre><code>Stage   Optimization           Throughput  P99 Latency   Changes
────────────────────────────────────────────────────────────
0       Baseline              10K/sec     2000ms
1       Connection pooling    25K/sec     500ms         2.5x
2       FNV-1a hashing        27K/sec     450ms         1.08x
3       sync.Pool buffers     32K/sec     300ms         1.18x
4       Query indexes         40K/sec     100ms         1.25x
5       Load balance (3x)     50K/sec     50ms          1.25x

Total improvement: 10K → 50K req/sec (5x)
Total latency: 2000ms → 50ms (40x)</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Profile first, guess never</h3>
<p>Use profiling tools to identify actual bottlenecks, not assumptions.</p>

<h3>2. One layer at a time</h3>
<p>Fix network layer, then database, then application logic. Identify the slowest part first.</p>

<h3>3. Measure everything</h3>
<p>Benchmark before/after each change. Some optimizations hurt other metrics.</p>

<h3>4. Horizontal scaling beats vertical</h3>
<p>3 servers better than 1 massive server (cheaper, fault-tolerant).</p>

<h3>5. Diminishing returns</h3>
<p>First 5 optimizations get you 90% of the way. Last 10% takes 90% of the effort.</p>

<h2>Next: Troubleshooting & Incident Response</h2>

<p>Now we're doing 50K req/sec reliably. But things still break. How do we debug and recover?</p>

<ul>
  <li>Common production issues</li>
  <li>Debugging techniques</li>
  <li>Memory leak detection</li>
  <li>Database deadlock resolution</li>
  <li>Post-mortem analysis</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Performance', 'Optimization', 'Profiling', 'Benchmarking', 'Scaling', 'Case Study', 'Backend', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 12 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postPerformance();
