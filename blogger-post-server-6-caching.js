const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postCaching() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Caching Strategy: Redis, TTL, and Cache Invalidation Patterns',
    content: `
<p><strong>A database layer is only as fast as your slowest queries. This post covers caching strategies: in-memory Redis, TTL management, cache invalidation patterns (TTL, event-driven, LRU), and cache-aside vs write-through patterns.</strong></p>

<p>The most expensive query is the one that runs every time. Let's cache it.</p>

<h2>The Caching Problem</h2>

<p>Real database query times without cache:</p>

<ul>
  <li><strong>User profile lookup</strong>: 5ms (database I/O)</li>
  <li><strong>Leaderboard query</strong>: 50ms (sorting 1M records)</li>
  <li><strong>Product search</strong>: 100ms (full-text index scan)</li>
  <li><strong>Session validation</strong>: 2ms (cache miss)</li>
</ul>

<p>At 10K req/sec, that's 10,000 req/sec × 5ms = 50 seconds of database CPU/sec (50 cores fully busy).</p>

<p><strong>With caching (90% hit rate)</strong>: 9,000 cache hits × 0.1ms + 1,000 misses × 5ms = much better.</p>

<h2>Component 1: Redis Architecture</h2>

<p><strong>Why Redis?</strong> Single-threaded, in-memory, 100K ops/sec per core, rich data types (strings, lists, sets, sorted sets).</p>

<h3>Redis Data Structures</h3>

<pre><code>1. Strings (User profiles)
   SET user:123 '{"name":"Alice","score":950}'

2. Hashes (Session data)
   HSET session:abc123 user_id 123 roles "admin,user"

3. Sorted Sets (Leaderboards)
   ZADD leaderboard:game1 950 user:123
   ZRANGE leaderboard:game1 0 99 WITHSCORES

4. Lists (Job queues)
   LPUSH jobs:processing job_id_456
   RPOP jobs:processing

5. Sets (Unique visitors)
   SADD visitors:2026-03-27 user:123
   SCARD visitors:2026-03-27</code></pre>

<h2>Component 2: TTL Management</h2>

<p><strong>Too short (1 second)</strong>: Cache misses constantly, database overloaded.</p>

<p><strong>Too long (1 hour)</strong>: Data inconsistency, stale reads.</p>

<p><strong>Right TTL by data type</strong>:</p>

<pre><code>User profile: 5 minutes
Session token: 1 hour
Leaderboard: 1 minute
Product catalog: 1 hour
Search index: 30 minutes
API rate limit: 1 second
Config values: 5 minutes</code></pre>

<h2>Component 3: Cache Invalidation Patterns</h2>

<p><strong>Pattern 1: TTL (Time-based)</strong> — Simple but has stale data.</p>

<p><strong>Pattern 2: Event-Driven</strong> — When data changes, invalidate cache:</p>

<pre><code>POST /api/user/123/profile {name: "Bob"}
  → Update database
  → redis.DEL("user:123")
  → Next GET cache-misses and fetches fresh data</code></pre>

<p><strong>Pattern 3: LRU (Least Recently Used)</strong> — Evict old entries when cache is full.</p>

<p><strong>Pattern 4: Write-Through</strong> — Update cache AND database (risky if DB fails).</p>

<p><strong>Pattern 5: Cache-Aside (Recommended)</strong> — Database is source of truth, cache is optimization:</p>

<pre><code>GET user:
  1. Try cache
  2. If miss, fetch from DB
  3. Store in cache

UPDATE user:
  1. Update DB
  2. Invalidate cache (redis.DEL)</code></pre>

<h2>Component 4: Cache Hit Rate</h2>

<p><strong>Target: >90% hit rate</strong></p>

<pre><code>Hit rate = (cache hits) / (hits + misses)

Example:
- 90% hit rate: 0.9 × 0.1ms + 0.1 × 5ms = 0.59ms avg
- 80% hit rate: 0.8 × 0.1ms + 0.2 × 5ms = 1.08ms avg
- 50% hit rate: 0.5 × 0.1ms + 0.5 × 5ms = 2.55ms avg</code></pre>

<h2>Component 5: Cache Stampede Prevention</h2>

<p><strong>Problem (Thundering Herd)</strong>: All cache entries expire at same time → 10K simultaneous DB queries.</p>

<p><strong>Solution 1: Probabilistic TTL</strong> — Randomize expiry (300 ± 60 seconds).</p>

<p><strong>Solution 2: Stale-While-Revalidate</strong>:</p>

<pre><code>soft_ttl = 5 min  (stale, can serve)
hard_ttl = 10 min (expired, must refetch)

If stale but < hard TTL:
  → Serve value immediately
  → Background: refresh from DB</code></pre>

<h2>Complete Caching Stack</h2>

<pre><code>API Request (50K/sec)
  ↓
Cache Layer (Redis) — 90% hit rate
  ↓ (10% miss)
Database Query (5ms avg)
  ↓
Store in Redis (TTL-based)
  ↓
Response (0.6ms avg latency)</code></pre>

<h2>Real-World Example: E-commerce</h2>

<pre><code>Product search: 10,000 requests for "shoes" in 1 hour

Without cache:
- 10,000 × 100ms = 1,000 seconds CPU

With cache (90% hit rate):
- First query: 100ms
- Next 9,000 hits: 0.1ms each = 0.9s
- Total: ~1 second CPU
- Improvement: 900x faster</code></pre>

<h2>Testing: 30+ Test Cases</h2>

<pre><code>✓ GET within TTL returns value
✓ GET after expiry returns nil
✓ Hit rate calculation accurate
✓ LRU eviction under pressure
✓ Event-driven invalidation
✓ TTL randomization prevents stampede
✓ Concurrent reads (race-free)
✓ Cache-aside pattern correctness
✓ Stale-while-revalidate behavior
✓ Redis connection pooling
✓ Fallback if Redis unavailable</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Cache-aside pattern is safest</h3>
<p>Database is source of truth, cache is optimization.</p>

<h3>2. 90% hit rate is target</h3>
<p>Above that: diminishing returns. Below that: still hitting DB frequently.</p>

<h3>3. TTL matters more than size</h3>
<p>5-min TTL on 100K keys beats 1-hour TTL on 1M keys.</p>

<h3>4. Event-driven invalidation is complex</h3>
<p>Easy to forget to invalidate. Rely on TTL + stale-while-revalidate instead.</p>

<h3>5. Redis is the default</h3>
<p>90% of caching use cases. Predictable, rich types, monitorable.</p>

<h2>Next: Async Processing & Message Queues</h2>

<p>Long-running tasks shouldn't block API responses:</p>

<ul>
  <li>Background job processing</li>
  <li>Message queues (RabbitMQ/Kafka)</li>
  <li>Event-driven architecture</li>
  <li>Retry policies & dead-letter queues</li>
  <li>Distributed tracing for async jobs</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Caching', 'Redis', 'TTL', 'Cache Invalidation', 'Performance', 'Backend', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 6 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postCaching();
