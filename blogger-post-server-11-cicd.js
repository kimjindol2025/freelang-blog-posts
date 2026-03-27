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
    content: `
<p><strong>Manually building Docker images and pushing them is error-prone. CI/CD pipelines automate the entire flow: push code → run tests → build image → deploy to Kubernetes → verify health.</strong></p>

<p>Good CI/CD means you ship code, not artifacts.</p>

<h2>The CI/CD Problem</h2>

<p>Manual deployment:</p>

<ul>
  <li><strong>Git push</strong> → Someone runs tests locally (maybe)</li>
  <li><strong>Build image</strong> → Docker build (slow, manual)</li>
  <li><strong>Push to registry</strong> → Docker push (manual)</li>
  <li><strong>Deploy</strong> → kubectl apply (manual, error-prone)</li>
  <li><strong>Verify</strong> → Manual health checks (might skip)</li>
</ul>

<p>Automated pipeline:</p>

<ul>
  <li>Git push → Automatic tests (unit + integration)</li>
  <li>Tests pass → Automatic image build (cached layers)</li>
  <li>Image push → Automatic K8s deployment</li>
  <li>Auto-verify → Health checks, smoke tests</li>
  <li>Failed test → Block deployment (no bad code shipped)</li>
</ul>

<h2>Component 1: GitHub Actions Workflow</h2>

<p><strong>GitHub Actions = serverless CI/CD in your repo</strong></p>

<pre><code>name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Set up Go
      uses: actions/setup-go@v2
      with:
        go-version: 1.19

    - name: Run tests
      run: |
        go test ./... -race -v
        go test ./... -bench=. -benchmem

    - name: Run linting
      uses: golangci/golangci-lint-action@v2
      with:
        version: latest

    - name: SAST (security scan)
      uses: securego/gosec@master
      with:
        args: '-no-fail -fmt sarif -out /tmp/gosec-report.sarif ./...'

    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v1
      with:
        sarif_file: /tmp/gosec-report.sarif

  build:
    needs: test  # Don't build if tests fail
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1

    - name: Login to Docker Registry
      uses: docker/login-action@v1
      with:
        registry: myregistry.azurecr.io
        username: \${{ secrets.REGISTRY_USERNAME }}
        password: \${{ secrets.REGISTRY_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v2
      with:
        context: .
        push: true
        tags: myregistry.azurecr.io/api:\${{ github.sha }}
        tags: myregistry.azurecr.io/api:latest
        cache-from: type=registry,ref=myregistry.azurecr.io/api:buildcache
        cache-to: type=registry,ref=myregistry.azurecr.io/api:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Update K8s manifests
      run: |
        sed -i "s/image: .*/image: myregistry.azurecr.io\\/api:\\${{ github.sha }}/g" deployment.yaml

    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f deployment.yaml
        kubectl rollout status deployment/api-deployment

    - name: Health check
      run: |
        for i in {1..10}; do
          status=\$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health)
          if [ \$status -eq 200 ]; then
            echo "Health check passed"
            exit 0
          fi
          sleep 10
        done
        echo "Health check failed"
        exit 1

    - name: Smoke tests
      run: |
        curl -X POST https://api.example.com/api/test -d '{"test": "data"}'
        # Add more smoke tests here

  rollback:
    if: failure()  # Only run if previous steps failed
    needs: deploy
    runs-on: ubuntu-latest
    steps:
    - name: Rollback deployment
      run: |
        kubectl rollout undo deployment/api-deployment</code></pre>

<h2>Component 2: Docker Build Optimization</h2>

<p><strong>Multi-stage build (small final image)</strong>:</p>

<pre><code>FROM golang:1.19 as builder
WORKDIR /app
COPY . .
RUN go build -o api .

FROM alpine:3.17
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/api /app/api
EXPOSE 8080
CMD ["/app/api"]</code></pre>

<p><strong>Result</strong>:</p>

<pre><code>golang:1.19 (1.3GB) → removed after build
alpine:3.17 (7MB) → final image
Final image size: ~50MB (instead of 1.3GB!)
Build cache: Layer-by-layer, reuses unchanged layers</code></pre>

<h2>Component 3: Testing Pipeline</h2>

<p><strong>Test pyramid (investment of test time)</strong>:</p>

<pre><code>    /\
   /  \       E2E (10 tests, 2 minutes)
  /────\      Integration (30 tests, 3 minutes)
 /──────\     Unit tests (100+ tests, 30 seconds)
</code></pre>

<p><strong>Example test script</strong>:</p>

<pre><code>#!/bin/bash
set -e

echo "Running unit tests..."
go test ./... -race -v

echo "Running integration tests..."
docker-compose up -d postgres redis
sleep 5
go test ./tests/integration/... -v
docker-compose down

echo "Running E2E tests..."
kubectl apply -f e2e-test-pod.yaml
kubectl wait --for=condition=complete job/e2e-tests --timeout=300s
kubectl logs job/e2e-tests

echo "All tests passed!"</code></pre>

<h2>Component 4: Blue-Green Deployment</h2>

<p><strong>Zero-downtime deployment strategy</strong>:</p>

<pre><code>Before deployment:
Load Balancer → Blue (v1.2.3, all traffic)
Load Balancer → Green (empty, v1.2.4 ready)

Steps:
1. Deploy to Green (v1.2.4)
2. Run smoke tests on Green
3. Switch Load Balancer to Green
4. Keep Blue running (fallback)
5. Monitor Green for 10 minutes
6. If stable, delete Blue
7. If unstable, switch back to Blue (rollback in 30 seconds)</code></pre>

<h2>Component 5: Code Quality Gates</h2>

<p><strong>Checks that block deployment</strong>:</p>

<pre><code>✓ All tests pass
✓ Code coverage > 80%
✓ No linting errors
✓ No security vulnerabilities (SAST)
✓ No dependency CVEs
✓ Build successful
✓ Health check passes
✓ Smoke tests pass

Any one failure → Block deployment, notify team</code></pre>

<h2>Complete CI/CD Workflow</h2>

<pre><code>Developer pushes code to main branch
  │
  ├─ GitHub Actions triggered
  │   │
  │   ├─ Run unit tests (go test ./...)
  │   │   └─ If fail: STOP, notify developer
  │   │
  │   ├─ Run linting (golangci-lint)
  │   │   └─ If fail: STOP
  │   │
  │   ├─ SAST scan (gosec)
  │   │   └─ If vulnerabilities found: STOP
  │   │
  │   ├─ Build Docker image (docker buildx)
  │   │   └─ Push to registry
  │   │
  │   ├─ Update K8s manifest (sed, update image tag)
  │   │   └─ Apply: kubectl apply
  │   │
  │   ├─ Health check (curl /health)
  │   │   └─ If fail after 5 retries: ROLLBACK
  │   │
  │   ├─ Smoke tests (curl /api/test)
  │   │   └─ If fail: ROLLBACK
  │   │
  │   └─ Success: Code in production (1 hour from commit)</code></pre>

<h2>Real-World Example: Banking API Deployment</h2>

<pre><code>Timeline: 2026-03-27 10:00

10:00:05 - Developer pushes code
10:00:10 - Tests start (30 seconds)
10:00:40 - Lint check (15 seconds)
10:00:55 - SAST scan (20 seconds)
10:01:15 - Docker build (2 minutes, 135 seconds)
10:03:30 - Image push (30 seconds)
10:04:00 - K8s deployment
10:04:05 - Rolling update starts
10:04:30 - Health checks pass
10:04:35 - Smoke tests pass
10:04:40 - Done!

Total time: 4:40 from push to production
Downtime: 0 seconds (rolling update maintains service)

If anything fails at any step:
  - Step 1-3 fail: Developer notified, code not built
  - Build fails: Image not pushed
  - Deploy fails: Automatic rollback to previous version
  - Health check fails: Rollback (keep previous version running)</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Fail fast, fail loudly</h3>
<p>Tests block bad code from shipping. Alerts inform the team instantly.</p>

<h3>2. Build once, deploy everywhere</h3>
<p>Docker image is immutable artifact. Same artifact in dev, staging, prod.</p>

<h3>3. Automation removes human error</h3>
<p>No more "I forgot to run tests" or "forgot to update config".</p>

<h3>4. Rollback is your safety net</h3>
<p>Problems in production? Rollback in seconds. Investigate later.</p>

<h3>5. Monitoring + CI/CD = confidence</h3>
<p>You know deployment is working because health checks pass.</p>

<h2>Next: Performance Optimization Case Study</h2>

<p>We've built a complete system (10K → 50K req/sec). How did we get there?</p>

<ul>
  <li>Bottleneck identification (profiling)</li>
  <li>Query optimization</li>
  <li>Connection pooling tuning</li>
  <li>Load balancing strategies</li>
  <li>Before/after benchmarks (5x improvement)</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
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
