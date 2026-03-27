const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postAsync() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Async Processing & Message Queues: From Blocking to Non-Blocking',
    content: `
<p><strong>Some tasks take too long to complete synchronously (sending emails, processing videos, generating reports). This post covers background job processing, message queues (RabbitMQ/Kafka), event-driven architecture, retry policies, and distributed tracing.</strong></p>

<p>The user shouldn't wait for a 10-second email send. Fire-and-forget it.</p>

<h2>The Async Problem</h2>

<p>Synchronous approach (blocking):</p>

<pre><code>User POST /api/account/register {email, password}
  → 1. Create user in DB (10ms)
  → 2. Send verification email (5000ms) ← BLOCKS!
  → 3. Return response (5010ms)

At 100 req/sec:
  → 100 reqs × 5000ms blocking = 500 seconds CPU time
  → Need 500 cores just for email sending!</code></pre>

<p>Asynchronous approach (fire-and-forget):</p>

<pre><code>User POST /api/account/register {email, password}
  → 1. Create user in DB (10ms)
  → 2. Queue job: {type: "send_email", email, token}
  → 3. Return response immediately (15ms)

Worker processes emails in background:
  → 4. Pop job from queue
  → 5. Send email (5000ms)
  → 6. Mark job as complete

Result: User gets 15ms response, email happens in background</code></pre>

<h2>Component 1: Job Queue Architecture</h2>

<p><strong>Basic queue</strong>:</p>

<pre><code>                 API Server
                     │
                 (enqueue job)
                     ↓
         ┌──────────────────────┐
         │   Job Queue (Redis)  │
         │  [job1, job2, job3]  │
         └──────────────────────┘
                     ↑
            (dequeue job)
                     │
          ┌──────────────────┐
          │  Worker 1        │
          │  Worker 2        │
          │  Worker 3 (pool) │
          └──────────────────┘</code></pre>

<p><strong>Job structure</strong>:</p>

<pre><code>{
  id: "job_12345",
  type: "send_email",
  priority: "high",
  payload: {
    email: "user@example.com",
    subject: "Verify your account",
    body: "Click here: ...",
    token: "abc123"
  },
  retries: 0,
  max_retries: 3,
  created_at: "2026-03-27T10:00:00Z",
  scheduled_at: "2026-03-27T10:00:00Z"
}</code></pre>

<h2>Component 2: Message Queue Patterns</h2>

<p><strong>Pattern 1: Fire-and-Forget (Redis/Resque)</strong></p>

<pre><code>Benefits:
  ✓ Simple: LPUSH job to queue
  ✓ Fast: Enqueue takes 1ms
  ✓ No persistence needed for retries

Limitations:
  ✗ No delivery guarantee (queue crashes = lost jobs)
  ✗ No ordering (jobs may process out of order)</code></pre>

<p><strong>Pattern 2: RabbitMQ (Reliable Queuing)</strong></p>

<pre><code>Benefits:
  ✓ Persistent: Messages written to disk before ACK
  ✓ Durable: Survives broker restart
  ✓ Routing: Messages routed by exchange rules

Process:
  1. Producer sends message
  2. RabbitMQ writes to disk
  3. Returns ACK to producer
  4. Consumer receives message
  5. Consumer processes + sends ACK
  6. RabbitMQ deletes message</code></pre>

<p><strong>Pattern 3: Kafka (Distributed Streaming)</strong></p>

<pre><code>Benefits:
  ✓ Massive scale: 1M messages/sec per broker
  ✓ Replay-able: Messages kept for 7 days
  ✓ Multiple consumers: Many apps read same messages

Use case:
  - Analytics (process millions of events)
  - Logging (centralized event stream)
  - Event replay (re-process historical events)</code></pre>

<h2>Component 3: Job Processing</h2>

<p><strong>Simple worker loop</strong>:</p>

<pre><code>func worker() {
  for {
    // 1. Wait for job (block until available)
    job := queue.BLPop(timeout: 10s)
    if job == nil {
      continue
    }

    // 2. Execute job
    success := processJob(job)

    // 3. Handle result
    if success {
      // Mark as complete (remove from queue)
      continue
    } else {
      // Retry: push back to queue
      if job.retries < job.max_retries {
        job.retries++
        queue.LPUSH(job)
      } else {
        // Dead-letter: move to failed queue
        dead_letter_queue.LPUSH(job)
        logging.Error("Job failed after retries:", job.id)
      }
    }
  }
}</code></pre>

<p><strong>Worker pool (3 workers)</strong>:</p>

<pre><code>// Start 3 independent workers
for i := 0; i < 3; i++ {
  go worker()
}

// Now processing 3 jobs in parallel
// Throughput: ~60 emails/sec (if 20ms per email)</code></pre>

<h2>Component 4: Retry Policies</h2>

<p><strong>Problem</strong>: Transient failures (network timeout, service down)</p>

<p><strong>Exponential backoff</strong>:</p>

<pre><code>Retry 1: Wait 1 second, try again
Retry 2: Wait 2 seconds, try again
Retry 3: Wait 4 seconds, try again
Retry 4: Wait 8 seconds, try again
Retry 5: Wait 16 seconds, try again

After 5 retries: (1+2+4+8+16) = 31 seconds total

Result: Transient failures auto-recover within 31 seconds
Permanent failures fail fast after 5 attempts</code></pre>

<p><strong>Implementation</strong>:</p>

<pre><code>func processJobWithRetry(job Job) bool {
  backoff := 1 // second

  for attempts := 0; attempts <= job.max_retries; attempts++ {
    // Try to process
    err := sendEmail(job.payload)

    if err == nil {
      return true  // Success!
    }

    if attempts < job.max_retries {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      time.Sleep(time.Duration(backoff) * time.Second)
      backoff *= 2
    }
  }

  return false  // All retries exhausted
}</code></pre>

<h2>Component 5: Dead-Letter Queues</h2>

<p><strong>Problem</strong>: Job fails after all retries, what happens?</p>

<p><strong>Solution</strong>: Dead-letter queue (DLQ)</p>

<pre><code>                Normal Queue
                     │
    ┌────────────┬────┴────┬──────────────┐
    │            │         │              │
  Success    Temporary   Permanent      MAX_RETRIES
             Failure     Failure        Exceeded
    │            │         │              │
    ↓            ↓         ↓              ↓
 Delete      Retry      Dead-Letter   Dead-Letter
             (backoff)    Queue         Queue

Process:
1. Job fails permanently
2. Retries exhausted
3. Move to DLQ
4. Alert operator
5. Manual investigation

Later:
6. Fix root cause
7. Reprocess DLQ jobs</code></pre>

<h2>Component 6: Distributed Tracing for Async Jobs</h2>

<p><strong>Problem</strong>: Job fails in background, how do we debug?</p>

<p><strong>Trace ID propagation</strong>:</p>

<pre><code>API Request → trace_id: "xyz-123"
  │
  ├─ SPAN: "register_user" (10ms)
  │   └─ DB Query (5ms)
  │
  ├─ SPAN: "enqueue_email" (2ms)
  │   └─ Redis LPUSH (1ms)
  │   └─ trace_id attached to job
  │
  └─ Response (sent in 20ms)

Worker picks up job with trace_id: "xyz-123"
  │
  ├─ SPAN: "process_email" (5000ms)
  │   ├─ Connect to SMTP (100ms)
  │   ├─ Send email (4900ms)
  │   ├─ trace_id: "xyz-123" ← linked to original request!
  │   └─ Mark complete

Logs are now correlated:
  [xyz-123] User registered
  [xyz-123] Email queued
  [xyz-123] Email sent successfully</code></pre>

<h2>Complete Async Architecture</h2>

<pre><code>API Server (50K req/sec)
  │
  ├─ Fast path: Create DB record (10ms)
  │  └─ Return response to user immediately
  │
  └─ Async path: Enqueue job (2ms)
     └─ Return job_id

Redis Queue
  │
  ├─ Job 1: send_email (5000ms)
  ├─ Job 2: generate_report (30000ms)
  ├─ Job 3: resize_image (2000ms)
  └─ ...

Worker Pool (3 workers)
  │
  ├─ Worker 1: Processing send_email (currently)
  ├─ Worker 2: Processing resize_image (currently)
  └─ Worker 3: Waiting for job

Monitoring:
  Queue length: 150 jobs pending
  Worker utilization: 66% (2/3 busy)
  P95 job latency: 2.3 seconds from enqueue to complete</code></pre>

<h2>Real-World Example: User Registration</h2>

<pre><code>// Synchronous (old way)
POST /api/register
  → Create user (10ms)
  → Hash password (50ms) ← slow!
  → Send email (5000ms) ← very slow!
  → Return 200 OK (5060ms total)

// Asynchronous (new way)
POST /api/register
  → Create user (10ms)
  → Queue: {type: "hash_password", user_id: 123}
  → Queue: {type: "send_email", email: "..."}
  → Return 200 OK + job_ids (20ms)

User sees response in 20ms instead of 5060ms!
  → 250x faster from user's perspective
  → Password hashing & email send in background

Benefits:
  ✓ Fast response time
  ✓ Better UX (no waiting for slow operations)
  ✓ Graceful degradation (if email service is down, user still created)</code></pre>

<h2>Testing: 25+ Test Cases</h2>

<pre><code>✓ Job enqueued successfully
✓ Worker picks up job
✓ Job processed successfully
✓ Transient failure triggers retry
✓ Exponential backoff timing correct
✓ Max retries exhausted → DLQ
✓ Trace ID propagated through job
✓ Worker pool processes 3 jobs in parallel
✓ Poison pill (invalid job) logged without blocking
✓ Multiple workers don't process same job
✓ Job priority honored (high jobs first)
✓ Job scheduled_at timestamp honored</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Not everything needs to be synchronous</h3>
<p>If user doesn't need the result immediately, make it async.</p>

<h3>2. Retry with exponential backoff</h3>
<p>Handles transient failures without overwhelming the system.</p>

<h3>3. Dead-letter queues are essential</h3>
<p>Failed jobs need investigation. Don't silently discard them.</p>

<h3>4. Trace IDs propagate through the system</h3>
<p>Link async jobs back to original request for debugging.</p>

<h3>5. Worker pool sizing matters</h3>
<p>3 workers per 10K req/sec is reasonable starting point. Monitor queue length.</p>

<h2>Next: Monitoring & Alerting</h2>

<p>Now we need visibility into system health:</p>

<ul>
  <li>Prometheus metrics collection</li>
  <li>Grafana dashboards</li>
  <li>Alert rules (CPU, memory, latency)</li>
  <li>SLA monitoring (99.99% uptime)</li>
  <li>Custom business KPIs</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Async Processing', 'Message Queues', 'RabbitMQ', 'Kafka', 'Job Processing', 'Distributed Tracing', 'Backend', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 7 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postAsync();
