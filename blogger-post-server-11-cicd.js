const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postCICD() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'CI/CD Pipeline: Automated Testing, Building, and Deployment',
    content: `<p><strong>Manually building Docker images is error-prone. CI/CD pipelines automate: push code → run tests → build image → deploy to Kubernetes → verify health.</strong></p><p>Good CI/CD means you ship code, not artifacts.</p><h2>The CI/CD Problem</h2><p>Manual deployment:</p><ul><li>Git push → Someone runs tests locally (maybe)</li><li>Build image → Docker build (slow, manual)</li><li>Push registry → Docker push (manual)</li><li>Deploy → kubectl apply (manual, error-prone)</li><li>Verify → Manual health checks</li></ul><p>Automated pipeline:</p><ul><li>Git push → Automatic tests run</li><li>Tests pass → Automatic image build</li><li>Image push → Automatic K8s deployment</li><li>Auto-verify → Health checks pass</li><li>Failed test → Block deployment immediately</li></ul><h2>Component 1: GitHub Actions</h2><p><strong>GitHub Actions = serverless CI/CD</strong></p><pre><code>name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout
    - name: Run tests
      run: go test ./... -race -v
    - name: Run linting
      run: golangci-lint run
    - name: SAST scan
      run: gosec ./...

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout
    - name: Build Docker image
      run: docker build -t myregistry/api:latest .
    - name: Push image
      run: docker push myregistry/api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to K8s
      run: kubectl apply -f deployment.yaml
    - name: Health check
      run: curl https://api.example.com/health</code></pre><h2>Component 2: Docker Build Optimization</h2><p><strong>Multi-stage build</strong>:</p><pre><code>FROM golang:1.19 as builder
COPY . /app
RUN cd /app && go build -o api

FROM alpine:3.17
COPY --from=builder /app/api /app/api
CMD ["/app/api"]</code></pre><p><strong>Result: 1.3GB → 50MB</strong></p><h2>Component 3: Testing Pipeline</h2><p><strong>Test pyramid</strong>:</p><pre><code>E2E: 10 tests (2 min)
Integration: 30 tests (3 min)
Unit: 100+ tests (30 sec)

Total: ~5 minutes of testing</code></pre><h2>Component 4: Blue-Green Deployment</h2><p><strong>Zero-downtime strategy</strong>:</p><pre><code>1. Deploy to Green (new version)
2. Run smoke tests
3. Switch traffic to Green
4. Keep Blue as fallback
5. Monitor Green 10 minutes
6. If stable, delete Blue
7. If unstable, rollback (30 seconds)</code></pre><h2>Component 5: Quality Gates</h2><pre><code>✓ Tests pass
✓ Coverage > 80%
✓ No lint errors
✓ No security vulnerabilities
✓ No dependency CVEs
✓ Build successful
✓ Health checks pass
✓ Smoke tests pass

ANY failure → Block deployment</code></pre><h2>Real-World Timeline</h2><pre><code>10:00:05 - Developer pushes code
10:00:40 - Tests pass (30s)
10:00:55 - Lint check (15s)
10:01:15 - SAST scan (20s)
10:03:30 - Docker build (2 min)
10:04:00 - Image push (30s)
10:04:40 - K8s rolling update
10:04:50 - Health checks pass
10:04:55 - Smoke tests pass
10:05:00 - Done! (5 min total)

Downtime: 0 seconds</code></pre><h2>Lessons Learned</h2><h3>1. Fail fast, fail loudly</h3><p>Tests block bad code. Alerts inform team instantly.</p><h3>2. Build once, deploy everywhere</h3><p>Same Docker artifact in dev, staging, prod.</p><h3>3. Automation removes human error</h3><p>No more forgotten tests or config updates.</p><h3>4. Rollback is your safety net</h3><p>Problems? Rollback in seconds. Investigate later.</p><h3>5. Monitoring validates deployment</h3><p>Health checks prove deployment works.</p><h2>Next: Performance Optimization Case Study</h2><p>How do we achieve 50K req/sec? Profiling, bottleneck identification, and validation with benchmarks.</p><ul><li>Bottleneck identification (profiling)</li><li>Query optimization</li><li>Connection pooling tuning</li><li>Load balancing strategies</li><li>5x throughput improvement</li></ul><p><strong>Made in Korea 🇰🇷</strong>`,
    labels: ['CI/CD', 'GitHub Actions', 'Docker', 'Kubernetes', 'Automation', 'DevOps', 'Deployment', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 11 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postCICD();
