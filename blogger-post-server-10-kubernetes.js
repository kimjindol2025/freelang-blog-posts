const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postKubernetes() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Kubernetes Deployment: From Docker Images to Production Clusters',
    content: `
<p><strong>Docker containers are great, but managing 100 containers by hand is nightmare. Kubernetes orchestrates them: auto-scaling, self-healing, rolling updates, and resource management at scale.</strong></p>

<p>Kubernetes makes container orchestration possible at 50K req/sec.</p>

<h2>The Kubernetes Problem</h2>

<p>Without Kubernetes (manual deployment):</p>

<ul>
  <li><strong>CPU spikes</strong> → SSH into server, manually scale containers</li>
  <li><strong>Container crashes</strong> → Manually restart (or wait for monitoring alert)</li>
  <li><strong>Update rollout</strong> → Update each server one by one (error-prone)</li>
  <li><strong>Resource allocation</strong> → Overprovisioned to prevent outages</li>
</ul>

<p>With Kubernetes (automatic):</p>

<ul>
  <li>CPU spike → Auto-scale to 10 replicas in 2 minutes</li>
  <li>Container crashes → Automatically restart</li>
  <li>Update rollout → Rolling update, automatic rollback if health checks fail</li>
  <li>Resource allocation → Pack containers efficiently, bin packing</li>
</ul>

<h2>Component 1: Pod (Smallest Deployable Unit)</h2>

<p><strong>Pod = one or more containers</strong></p>

<pre><code>apiVersion: v1
kind: Pod
metadata:
  name: api-server
  labels:
    app: api
    version: v1
spec:
  containers:
  - name: api
    image: myregistry/api:v1.2.3
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5</code></pre>

<p><strong>Key concepts</strong>:</p>

<pre><code>- resources.requests: Kubernetes reserves this amount (minimum)
- resources.limits: Container can't exceed this
- livenessProbe: Is container alive? Restart if not
- readinessProbe: Is container ready to serve? (remove from load balancer if not)</code></pre>

<h2>Component 2: Deployment (Manage Replicas)</h2>

<p><strong>Deployment = Pod template + replica count + update strategy</strong></p>

<pre><code>apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 3  # Always run 3 copies
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1      # 1 extra pod during update
      maxUnavailable: 0 # Never take down all pods
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myregistry/api:v1.2.3
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"</code></pre>

<h2>Component 3: Service (Network Exposure)</h2>

<p><strong>Service = stable endpoint for pod traffic</strong></p>

<pre><code>apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: ClusterIP  # Internal only
  selector:
    app: api
  ports:
  - port: 80       # Service port
    targetPort: 8080 # Pod port
    protocol: TCP</code></pre>

<p><strong>Service types</strong>:</p>

<pre><code>1. ClusterIP (default)
   - Internal only, load balanced across pods
   - Use: Microservice communication

2. NodePort
   - Expose on node's port (30000-32767)
   - Use: Testing, small deployments

3. LoadBalancer
   - Cloud provider's load balancer (AWS ELB, GCP LB)
   - Use: External traffic

4. ExternalName
   - Route to external service (database outside cluster)</code></pre>

<h2>Component 4: Ingress (HTTP Routing)</h2>

<p><strong>Ingress = HTTP/HTTPS routing rules</strong></p>

<pre><code>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80</code></pre>

<h2>Component 5: Persistent Volumes (Storage)</h2>

<p><strong>StatefulSet for databases (unlike Deployment, preserves identity)</strong></p>

<pre><code>apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 100Gi

---

apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  replicas: 1
  serviceName: postgres
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi</code></pre>

<h2>Component 6: HPA (Horizontal Pod Autoscaling)</h2>

<p><strong>Auto-scale replicas based on metrics</strong></p>

<pre><code>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 15
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15</code></pre>

<p><strong>Autoscaling behavior</strong>:</p>

<pre><code>Current load: 70% CPU (50% target)
→ Scale up by 100% every 15 seconds
→ 3 → 6 → 12 → 25 → 50 (max)

Scale up is fast (reach peak in 60s)
Scale down is slow (stabilization: 5 minutes)
Result: Handles traffic spikes, doesn't oscillate</code></pre>

<h2>Component 7: ConfigMap & Secrets</h2>

<p><strong>ConfigMap (non-sensitive configuration)</strong></p>

<pre><code>apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_pool_size: "100"
  cache_ttl_seconds: "300"
  log_level: "INFO"

---

apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  containers:
  - name: api
    image: myregistry/api:v1.2.3
    envFrom:
    - configMapRef:
        name: app-config</code></pre>

<p><strong>Secret (sensitive data)</strong></p>

<pre><code>apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: dXNlcm5hbWU=  # base64 "username"
  password: cGFzc3dvcmQx  # base64 "password1"

---

apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  containers:
  - name: api
    image: myregistry/api:v1.2.3
    env:
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASS
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password</code></pre>

<h2>Complete K8s Architecture (50K req/sec)</h2>

<pre><code>┌──────────────────────────┐
│  Cloud Load Balancer     │ (AWS ELB, GCP LB)
└────────────┬─────────────┘
             │
┌────────────▼──────────────┐
│  Ingress Controller       │ (Nginx)
│  Route to services        │
└────────────┬──────────────┘
             │
┌────────────▼──────────────────────┐
│  Kubernetes Cluster                │
├────────────────────────────────────┤
│                                    │
│  Deployment: api (25 replicas)    │
│  ├─ Pod 1, Pod 2, ... Pod 25      │
│  │  Each: 256Mi mem, 100m CPU     │
│  │                                 │
│  Deployment: worker (5 replicas)   │
│  └─ Pod 1-5 (background jobs)     │
│                                    │
│  StatefulSet: postgres (1 replica) │
│  └─ Pod 1 (database, 100Gi PV)    │
│                                    │
│  HPA: Scales based on CPU/memory   │
│                                    │
└────────────────────────────────────┘</code></pre>

<h2>Deployment Workflow</h2>

<pre><code>1. Push Docker image
   docker push myregistry/api:v1.2.4

2. Update Deployment manifest
   image: myregistry/api:v1.2.4

3. Apply to cluster
   kubectl apply -f deployment.yaml

4. Rolling update happens automatically
   - Spin up 1 new pod (v1.2.4)
   - Health check passes (readiness probe)
   - Drain 1 old pod
   - Repeat until all updated

5. If health checks fail, automatic rollback
   kubectl rollout undo deployment/api-deployment</code></pre>

<h2>Real-World Example: Bank API</h2>

<pre><code>Cluster configuration:

Deployments:
  ├─ API servers: 10-50 replicas (HPA)
  ├─ Auth service: 5-20 replicas
  └─ Notification workers: 3-10 replicas

StatefulSets:
  └─ PostgreSQL: 1 master + 2 replicas

Services:
  ├─ api-service → API servers
  ├─ auth-service → Auth service
  └─ postgres-service → Database

HPA rules:
  ├─ Scale up if CPU > 70% or Memory > 80%
  ├─ Scale down if CPU < 30% and Memory < 50%
  └─ Max replicas: 50 per deployment

Traffic flow:
  User request
    → Cloud LB
    → Ingress Controller
    → Service
    → Pod (behind HAProxy)
    → Container (app logic)</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Declarations over imperative</h3>
<p>YAML manifests declare desired state. Kubernetes maintains it.</p>

<h3>2. Resource requests/limits are critical</h3>
<p>Without them, Kubernetes can't schedule efficiently.</p>

<h3>3. Health checks prevent cascade failures</h3>
<p>Liveness probe kills bad containers. Readiness probe prevents traffic to them.</p>

<h3>4. Rolling updates need testing</h3>
<p>maxSurge and maxUnavailable affect deployment speed and availability.</p>

<h3>5. Persistent volumes are database-specific</h3>
<p>Stateless apps are easier in K8s. Databases need careful handling.</p>

<h2>Next: CI/CD Pipeline</h2>

<p>Now we deploy to Kubernetes. Let's automate it:</p>

<ul>
  <li>GitHub Actions workflow</li>
  <li>Docker image building & pushing</li>
  <li>Automated testing (unit + integration)</li>
  <li>Code quality checks (linting, SAST)</li>
  <li>Blue-green deployment</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong>
`,
    labels: ['Kubernetes', 'Container Orchestration', 'Docker', 'Deployment', 'Scaling', 'StatefulSet', 'Ingress', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 10 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postKubernetes();
