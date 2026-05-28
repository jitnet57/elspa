# Global Deployment Strategy for ElSpa

**Version:** 1.0  
**Last Updated:** 2026-05-29  
**Owner:** DevOps & Infrastructure Team  
**Status:** Enterprise Production Ready

---

## Table of Contents
1. [Executive Overview](#executive-overview)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [Multi-Region Deployment](#multi-region-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Kubernetes Orchestration](#kubernetes-orchestration)
6. [Load Balancing & Routing](#load-balancing--routing)
7. [Scaling Strategy](#scaling-strategy)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Alerting](#monitoring--alerting)
10. [Disaster Recovery](#disaster-recovery)
11. [Security Hardening](#security-hardening)
12. [Cost Optimization](#cost-optimization)

---

## Executive Overview

ElSpa Global operates across 10+ regions with a globally distributed, multi-region Kubernetes infrastructure providing:

- **99.99% Uptime SLA** across all regions
- **<200ms** API response times (p99, regional)
- **Sub-100ms** response times from local CDN edge
- **Zero-Downtime** deployments
- **Automatic Failover** (RTO 5 minutes)
- **Comprehensive Disaster Recovery** (RPO 5 minutes)

### Infrastructure Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Global Load Balancer                      │
│                  (Anycast Routing via CDN)                   │
└────┬──────────────┬──────────────┬──────────────┬───────────┘
     │              │              │              │
┌────▼────┐  ┌─────▼────┐  ┌──────▼────┐  ┌────▼────┐
│Asia-NE  │  │Asia-SE-1 │  │Asia-SE-2  │  │Europe   │
│Seoul    │  │Singapore │  │Manila     │  │Frankfurt│
│ap-ne-2  │  │ap-se-1   │  │ap-se-2    │  │eu-we-1 │
└────┬────┘  └─────┬────┘  └──────┬────┘  └────┬────┘
     │             │              │            │
  ┌──▼──┐       ┌──▼──┐       ┌──▼──┐     ┌──▼──┐
  │K8S  │       │K8S  │       │K8S  │     │K8S  │
  │(HA) │       │(HA) │       │(HA) │     │(HA) │
  │3 AZ │       │3 AZ │       │3 AZ │     │3 AZ │
  └──┬──┘       └──┬──┘       └──┬──┘     └──┬──┘
     │             │              │            │
  ┌──▼──┐       ┌──▼──┐       ┌──▼──┐     ┌──▼──┐
  │RDS  │       │RDS  │       │RDS  │     │RDS  │
  │Prim │       │Prim │       │Prim │     │Prim │
  │+Rep │       │+Rep │       │+Rep │     │+Rep │
  └─────┘       └─────┘       └─────┘     └─────┘
```

---

## Infrastructure Architecture

### Cloud Provider Selection

```
Primary:   AWS (Seoul, Singapore, Frankfurt)
  └─ Reasons: Region coverage, compliance, cost
  
Backup:    Azure (Optional secondary)
  └─ Reasons: EU compliance, failover redundancy
  
Edge:      Cloudflare CDN (Global)
  └─ Reasons: Edge caching, DDoS protection, cost reduction
```

### Regional Deployment Units

Each region includes:

```
1. Kubernetes Cluster
   ├─ 3 Availability Zones (HA)
   ├─ 6-12 worker nodes
   ├─ Auto Scaling (2-20 nodes based on load)
   └─ 99.95% SLA

2. Managed Databases
   ├─ Primary PostgreSQL (rds.r5.2xlarge)
   ├─ Failover Replica (rds.r5.2xlarge)
   ├─ Read Replicas (rds.r5.xlarge × 2)
   ├─ Daily automated backups
   └─ 35-day PITR capability

3. Cache & Session Store
   ├─ Redis Cluster (6 nodes × 3 shards)
   ├─ 99.99% availability
   └─ Automatic failover

4. Message Queue
   ├─ Kafka (3 brokers, 3 replicas)
   ├─ 7-day data retention
   └─ Consumer lag monitoring

5. Elasticsearch Cluster
   ├─ 3 master nodes
   ├─ 6 data nodes
   ├─ 3 ingest nodes
   └─ Daily snapshots to S3

6. Storage
   ├─ S3 buckets (multi-region replicated)
   ├─ Versioning enabled
   ├─ Server-side encryption
   └─ Lifecycle policies (90-day archival)
```

---

## Multi-Region Deployment

### Region Configuration Matrix

```yaml
Regions:
  ap-northeast-2:  # Seoul, Korea
    name: Seoul
    primary: true
    tenants: 120
    customers: 500K
    therapists: 40K
    uptime_sla: 99.99%
    compliance:
      - Ministry of Health & Welfare
      - KISA (security)
    payment_gateway: NICE, Inicis
    
  ap-southeast-1:  # Singapore
    name: Singapore
    primary: true
    tenants: 200
    customers: 1.2M
    therapists: 100K
    uptime_sla: 99.99%
    compliance:
      - PDPA
      - Monetary Authority of Singapore
    payment_gateway: 2C2P, Stripe
    
  ap-southeast-2:  # Manila, Philippines
    name: Manila
    primary: true
    tenants: 300
    customers: 800K
    therapists: 60K
    uptime_sla: 99.99%
    compliance:
      - BIR (Tax Authority)
      - SSS (Social Security)
      - DICT (Digital Transformation)
    payment_gateway: PayMaya, GCash
    
  ap-northeast-1:  # Tokyo, Japan
    name: Tokyo
    primary: false
    disaster_recovery: true
    tenants: 50
    customers: 200K
    therapists: 15K
    uptime_sla: 99.95%
    compliance:
      - PPC (Personal Information Protection Commission)
    payment_gateway: GMO, JPBANK
    
  eu-west-1:  # Frankfurt, Germany
    name: Frankfurt
    primary: false
    disaster_recovery: true
    tenants: 30
    customers: 100K
    therapists: 8K
    uptime_sla: 99.95%
    compliance:
      - GDPR
      - BaFin (Financial Regulation)
    payment_gateway: Stripe, PayU
```

### Data Replication Strategy

```
Replication Topology (RPO = 5 minutes):

Primary (Seoul) ──[Sync]──→ Standby (Seoul)
    │
    ├──[Async]──→ Manila (Asynchronous, lag 30-60s)
    │
    ├──[Async]──→ Singapore (Asynchronous, lag 30-60s)
    │
    ├──[Async]──→ Tokyo (Asynchronous, lag 1-2m)
    │
    └──[Async]──→ Frankfurt (Asynchronous, lag 2-5m)

Replication Configuration:
  - Physical streaming replication (WAL)
  - 50 Mbps dedicated replication links
  - Compression enabled
  - Heartbeat interval: 10s
  - Timeout: 30s
  - Auto-reconnect: yes
```

### Database Failover Procedure

```
Automatic Failover (Automated by AWS RDS):
  ├─ Detect: Primary unavailable (< 1 minute)
  ├─ Verify: Multi-AZ failover triggers
  ├─ DNS: CNAME updated to standby (< 2 minutes)
  ├─ Connection: App connects to new primary (< 5 minutes)
  └─ Validation: Application health checks pass

Manual Failover (For non-HA scenarios):
  ├─ Promote: Replica promoted to primary
  ├─ Update: Connection string in app config
  ├─ Verify: Data consistency check
  └─ Monitor: Replication lag tracking
  
Rollback Procedure:
  ├─ Create: New replica from old primary
  ├─ Sync: Catch up with new primary
  ├─ Test: Failback in staging first
  ├─ Execute: Switch connections back
  └─ Archive: Keep old primary for PITR
```

---

## CI/CD Pipeline

### Deployment Pipeline Architecture

```
┌──────────────────┐
│  Git Push        │
│  (feature branch)│
└────────┬─────────┘
         │
    ┌────▼───────────────────────┐
    │  GitHub Actions Trigger    │
    │  (Webhook)                 │
    └────┬───────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │  Stage 1: Build & Test        │
    │  ├─ Lint (ESLint, Ruff)       │
    │  ├─ Unit tests (Jest, Pytest) │
    │  ├─ Build Docker image        │
    │  └─ Push to ECR               │
    └────┬──────────────────────────┘
         │
         ├─ FAIL ──→ Notify developer
         │
    ┌────▼──────────────────────────┐
    │  Stage 2: Security Scanning   │
    │  ├─ SAST (SonarQube)          │
    │  ├─ Dependency check (Snyk)   │
    │  ├─ Container scan (Trivy)    │
    │  └─ License audit             │
    └────┬──────────────────────────┘
         │
         ├─ FAIL ──→ Block deployment
         │
    ┌────▼──────────────────────────┐
    │  Stage 3: Integration Tests   │
    │  ├─ Deploy to staging         │
    │  ├─ E2E tests (Cypress)       │
    │  ├─ Performance tests (k6)    │
    │  └─ Load tests (JMeter)       │
    └────┬──────────────────────────┘
         │
         ├─ FAIL ──→ Reject PR
         │
    ┌────▼──────────────────────────┐
    │  Code Review & Approval       │
    │  (GitHub Pull Request)        │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │  Stage 4: Staging Deployment  │
    │  ├─ Deploy to staging cluster │
    │  ├─ Smoke tests               │
    │  └─ Manual QA testing         │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │  Stage 5: Production Canary   │
    │  ├─ Deploy to 5% traffic      │
    │  ├─ Monitor error rates       │
    │  ├─ Monitor latency           │
    │  └─ Monitor resource usage    │
    └────┬──────────────────────────┘
         │
         ├─ FAIL ──→ Automatic rollback
         │
    ┌────▼──────────────────────────┐
    │  Stage 6: Full Rollout        │
    │  ├─ 100% traffic migration    │
    │  ├─ Monitor for 24 hours      │
    │  └─ Archive old version       │
    └──────────────────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy ElSpa

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  AWS_REGION: ap-northeast-2
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-northeast-2.amazonaws.com
  IMAGE_TAG: ${{ github.sha }}

jobs:
  # Stage 1: Build & Test
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov ruff
      
      - name: Lint with Ruff
        run: ruff check app/
      
      - name: Run tests
        run: |
          pytest tests/ --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      
      - name: Build and push Docker image
        run: |
          aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t $ECR_REGISTRY/elspa-api:$IMAGE_TAG .
          docker push $ECR_REGISTRY/elspa-api:$IMAGE_TAG

  # Stage 2: Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: actions/checkout@v3
      
      - name: SonarQube Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      - name: Snyk Dependency Check
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Trivy Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REGISTRY }}/elspa-api:${{ env.IMAGE_TAG }}
          format: 'sarif'
          output: 'trivy-results.sarif'

  # Stage 3: Integration Tests
  integration-tests:
    runs-on: ubuntu-latest
    needs: security-scan
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      
      - name: Run E2E tests
        run: |
          npm install
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:password@postgres:5432/test

  # Stage 4: Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update EKS kubeconfig
        run: |
          aws eks update-kubeconfig --name elspa-staging --region $AWS_REGION
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api api=${{ env.ECR_REGISTRY }}/elspa-api:${{ env.IMAGE_TAG }} \
            --namespace=staging \
            --record
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/api -n staging --timeout=5m
      
      - name: Run smoke tests
        run: |
          npm run test:smoke
        env:
          API_URL: https://staging-api.elspa.app

  # Stage 5: Production Canary
  deploy-production-canary:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update EKS kubeconfig
        run: |
          aws eks update-kubeconfig --name elspa-prod --region $AWS_REGION
      
      - name: Deploy canary (5% traffic)
        run: |
          kubectl patch virtualservice/api -p \
            '{"spec":{"hosts":[{"name":"api.elspa.app","http":[{"match":[{"uri":{"prefix":"/"}}],"route":[{"destination":{"host":"api-v1"},"weight":95},{"destination":{"host":"api-v2"},"weight":5}]}]}]}' \
            --namespace=production --type merge
      
      - name: Monitor canary metrics
        run: |
          ./scripts/monitor-canary.sh

  # Stage 6: Production Rollout
  deploy-production-full:
    runs-on: ubuntu-latest
    needs: deploy-production-canary
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Full rollout (100% traffic)
        run: |
          kubectl patch virtualservice/api -p \
            '{"spec":{"hosts":[{"name":"api.elspa.app","http":[{"match":[{"uri":{"prefix":"/"}}],"route":[{"destination":{"host":"api-v2"},"weight":100}]}]}]}}' \
            --namespace=production --type merge
      
      - name: Archive old version
        run: |
          kubectl delete deployment api-v1 -n production
```

---

## Kubernetes Orchestration

### Deployment Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elspa-api
  namespace: production
  labels:
    app: elspa-api
    version: v2
spec:
  replicas: 6  # Baseline, scales based on metrics
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0  # Zero-downtime deployment
  selector:
    matchLabels:
      app: elspa-api
  template:
    metadata:
      labels:
        app: elspa-api
        version: v2
    spec:
      affinity:
        # Spread across availability zones
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - elspa-api
              topologyKey: topology.kubernetes.io/zone
        # Prefer nodes with good resources
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 80
            preference:
              matchExpressions:
              - key: karpenter.sh/capacity-type
                operator: In
                values:
                - on-demand
      containers:
      - name: api
        image: 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/elspa-api:sha-abc123
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8000
          protocol: TCP
        env:
        - name: ENVIRONMENT
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 2
        
        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        
        # Resource requests & limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        
        # Security context
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
```

### Horizontal Pod Autoscaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: elspa-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: elspa-api
  minReplicas: 6      # Always maintain 6+ pods
  maxReplicas: 50     # Scale up to 50 for spike traffic
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # Scale up at 70% CPU
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80    # Scale up at 80% memory
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"      # Scale for 1000 req/s per pod
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50                 # Scale down 50% at a time
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100                # Double pods when scaling up
        periodSeconds: 30
      - type: Pods
        value: 10                 # Or add 10 pods
        periodSeconds: 30
      selectPolicy: Max            # Use whichever scales faster
```

---

## Load Balancing & Routing

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: elspa-api-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:123456789:certificate/abc123
    alb.ingress.kubernetes.io/healthcheck-path: /health/ready
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '10'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
    alb.ingress.kubernetes.io/waf-acl-arn: arn:aws:wafv2:ap-northeast-2:123456789:regional/webacl/elspa/abc123
spec:
  rules:
  - host: api.elspa.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: elspa-api-service
            port:
              number: 8000
  tls:
  - hosts:
    - api.elspa.app
    secretName: api-tls-cert
```

### Service Mesh (Istio)

```yaml
# k8s/istio-config.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: elspa-api
  namespace: production
spec:
  hosts:
  - api.elspa.app
  http:
  - name: canary
    match:
    - uri:
        prefix: "/"
    route:
    - destination:
        host: elspa-api
        port:
          number: 8000
        subset: v2
      weight: 95      # 95% to stable version
    - destination:
        host: elspa-api
        port:
          number: 8000
        subset: v1
      weight: 5       # 5% to canary version
    timeout: 5s
    retries:
      attempts: 3
      perTryTimeout: 1s
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: elspa-api
  namespace: production
spec:
  host: elspa-api
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 500
      http:
        http1MaxPendingRequests: 1000
        http2MaxRequests: 1000
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minRequestVolume: 5
      splitExternalLocalOriginErrors: true
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

---

## Scaling Strategy

### Vertical Scaling (Node Resizing)

```
Node Types:
  Development:    t3.large (2 CPU, 8 GB RAM)
  Staging:        t3.xlarge (4 CPU, 16 GB RAM)
  Production:     r5.2xlarge (8 CPU, 64 GB RAM) - memory optimized
  
Scaling Policy:
  ├─ Reserved instances: 70% (cost savings)
  ├─ Spot instances: 20% (for surge capacity)
  ├─ On-demand: 10% (for failover)
  
Cost Optimization:
  └─ Estimated: 40% savings with mixed strategy
```

### Horizontal Scaling

```
API Tier:
  ├─ Min: 6 pods (2 per AZ)
  ├─ Max: 50 pods (for traffic spikes)
  ├─ Target: 70% CPU utilization
  └─ Scale-up time: < 30 seconds
  
Worker Tier (Background Jobs):
  ├─ Min: 2 pods
  ├─ Max: 20 pods
  ├─ Queue depth target: < 100 items
  └─ Scale-up time: < 60 seconds
  
Scheduler (Cron Jobs):
  ├─ Run: 1 pod per scheduled task
  ├─ Cleanup: After 1 hour of inactivity
  └─ Parallelism: 4 concurrent tasks
```

### Database Scaling

```
Read Scaling:
  ├─ Primary (Write): r5.2xlarge
  ├─ Sync Replica (HA): r5.2xlarge
  ├─ Read Replica #1: r5.xlarge (ap-se-1)
  ├─ Read Replica #2: r5.xlarge (ap-se-2)
  └─ Read Replica #3: r5.large (ap-ne-1)
  
Query Optimization:
  ├─ Index tuning (quarterly)
  ├─ Query plan analysis (real-time)
  ├─ Partitioning (for large tables)
  └─ Materialized views (for reporting)
  
Sharding Strategy (Future):
  ├─ Shard by tenant_id
  ├─ 4-8 shards per region
  └─ Automatic shard routing via proxy
```

---

## Performance Optimization

### API Response Time Targets

```
┌─────────────────────────────────┬────────┬──────────────┐
│ Endpoint                        │ p50    │ p99          │
├─────────────────────────────────┼────────┼──────────────┤
│ GET /health                     │ 2ms    │ 5ms          │
│ GET /users/{id}                 │ 10ms   │ 50ms         │
│ POST /bookings                  │ 50ms   │ 200ms        │
│ GET /availability               │ 30ms   │ 100ms        │
│ GET /dashboard                  │ 200ms  │ 1000ms       │
│ POST /payroll/calculate         │ 2s     │ 5s (async)   │
│ GET /reports/export             │ 500ms  │ 2s (async)   │
└─────────────────────────────────┴────────┴──────────────┘
```

### Caching Strategy

```
Layer 1: Browser Cache (HTTP Headers)
  ├─ Static assets: Cache-Control: max-age=31536000 (1 year)
  ├─ API responses: Cache-Control: max-age=300 (5 min, vary by user)
  └─ HTML pages: Cache-Control: max-age=3600 (1 hour)

Layer 2: CDN Cache (Cloudflare)
  ├─ Pages: TTL 1 hour
  ├─ APIs: TTL 5 minutes
  ├─ Images: TTL 1 year (immutable)
  └─ Cache hit rate target: 85%+

Layer 3: Application Cache (Redis)
  ├─ Session: TTL 24 hours
  ├─ User profile: TTL 1 hour
  ├─ Therapist availability: TTL 5 minutes
  ├─ Booking slots: TTL 2 minutes
  ├─ Tax tables: TTL 7 days
  └─ Cache hit rate target: 90%+
```

### Database Query Optimization

```
Optimization Techniques:

1. Indexing Strategy
   ├─ B-tree indexes: Most columns
   ├─ Partial indexes: Filtered queries (status = 'active')
   ├─ BRIN indexes: Time-series data (large tables)
   └─ Covering indexes: Frequently accessed combinations

2. Query Optimization
   ├─ Use EXPLAIN ANALYZE for all queries
   ├─ Avoid N+1 queries (use JOINs)
   ├─ Batch operations (100 rows at a time)
   └─ Materialized views for aggregations

3. Connection Pooling
   ├─ PgBouncer: 1000 max connections
   ├─ Pool size: 25 per worker process
   ├─ Idle timeout: 10 minutes
   └─ Reserve pool: 5 connections

Benchmark Results (optimized):
  ├─ Simple SELECT: 5-10ms
  ├─ JOINs (3-table): 20-50ms
  ├─ Aggregations: 50-100ms
  └─ Full-text search: 200-500ms
```

### Content Delivery Optimization

```
Frontend Optimization:
  ├─ Code splitting: 50 KB average chunk
  ├─ Lazy loading: Components below fold
  ├─ Image optimization: WebP format, AVIF fallback
  ├─ JavaScript bundling: Terser compression
  ├─ CSS optimization: Tailwind purging
  └─ Critical CSS: Inlined in HTML

Page Load Performance:
  ├─ Time to First Byte (TTFB): < 200ms
  ├─ First Contentful Paint (FCP): < 1s
  ├─ Largest Contentful Paint (LCP): < 2.5s
  ├─ Cumulative Layout Shift (CLS): < 0.1
  ├─ First Input Delay (FID): < 100ms
  └─ Interaction to Next Paint (INP): < 200ms
```

---

## Monitoring & Alerting

### Prometheus Metrics

```yaml
# monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    region: 'ap-northeast-2'

scrape_configs:
  - job_name: 'kubernetes-api'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - production
          - monitoring
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_scrape]
        action: keep
        regex: true

  - job_name: 'database'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          instance: 'primary'
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'pg_stat_replication.*'
        action: keep

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Alert Rules

```yaml
# monitoring/alert-rules.yaml
groups:
  - name: application.rules
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: HighLatency
        expr: histogram_quantile(0.99, http_request_duration_seconds) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "p99 latency is {{ $value }}s"
      
      - alert: DatabaseReplicationLag
        expr: max(pg_replication_lag_seconds) > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database replication lag > 60s"
          description: "Lag is {{ $value }}s"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod crash looping"
          description: "{{ $labels.pod }} is crash looping"
```

### Logging Stack (ELK)

```yaml
# monitoring/logstash-config.conf
input {
  docker {
    host => "unix:///var/run/docker.sock"
  }
  syslog {
    port => 5000
  }
}

filter {
  if [container_name] =~ /^elspa/ {
    grok {
      match => {
        "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{DATA:level}\] %{DATA:logger}: %{GREEDYDATA:msg}"
      }
    }
    
    if [level] == "ERROR" or [level] == "WARN" {
      mutate {
        add_field => { "alert" => true }
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
    ilm_enabled => true
    ilm_policy => "logs"
  }
  
  if [alert] {
    email {
      to => "ops-team@elspa.app"
      subject => "Alert: %{level} from %{container_name}"
    }
  }
}
```

---

## Disaster Recovery

### RTO/RPO Targets

```
RTO (Recovery Time Objective): 15 minutes
RPO (Recovery Point Objective): 5 minutes

Failover Procedure:
  ├─ Detect: Automated (< 5 min)
  ├─ Notify: PagerDuty alert
  ├─ Assess: Manual review (< 5 min)
  ├─ Execute: DNS failover (< 2 min)
  ├─ Verify: Application health checks (< 3 min)
  └─ Document: Incident timeline logged
```

### Backup Strategy

```
Database Backups:
  ├─ Daily full: 02:00 UTC
  ├─ Hourly incremental: Every hour
  ├─ PITR: 35 days of WAL archives
  ├─ Retention: 90 days
  ├─ Storage: S3 + Glacier
  └─ Test: Weekly restore verification

Application State:
  ├─ Redis snapshots: Every 6 hours
  ├─ Kafka: 7-day retention
  ├─ Application logs: 30 days
  └─ Audit logs: 7 years (immutable)

Disaster Recovery Drill:
  ├─ Frequency: Quarterly
  ├─ Procedure: Full region failover simulation
  ├─ Validation: RPO/RTO verification
  └─ Documentation: Improvements documented
```

### Cross-Region Failover

```
Automatic Failover Sequence:

1. Health Check Failure (< 1 minute)
   └─ 3 consecutive failed health checks trigger failover

2. DNS Failover (< 2 minutes)
   ├─ Weighted routing policy
   ├─ 5-second TTL for rapid updates
   └─ Geo-location routing if applicable

3. Application Redirection (< 5 minutes)
   ├─ API clients receive 307 Temporary Redirect
   ├─ Clients connect to new region
   └─ Session restoration from distributed store

4. Data Verification (< 5 minutes)
   ├─ Check replication lag
   ├─ Validate data integrity
   └─ Confirm consistency across replicas

5. Monitoring (Continuous)
   ├─ Enhanced monitoring during failover
   ├─ Real-time alerts if secondary fails
   └─ Automatic rollback if issues detected
```

---

## Security Hardening

### Infrastructure Security

```
Network Security:
  ├─ Private VPC with public/private subnets
  ├─ Network ACLs: Deny by default, allow specific
  ├─ Security groups: Per-service firewall rules
  ├─ WAF: AWS WAF for OWASP Top 10 protection
  └─ DDoS: AWS Shield Standard (unlimited)

Pod Security:
  ├─ Network policies: Deny all ingress by default
  ├─ Pod security policies: Non-root, read-only fs
  ├─ RBAC: Least privilege access
  ├─ Service accounts: Per-workload identity
  └─ Container scanning: Trivy before deployment

Secrets Management:
  ├─ AWS Secrets Manager: Database passwords
  ├─ Vault: Application secrets
  ├─ Encryption: AES-256 at rest
  ├─ Rotation: Automatic monthly
  └─ Access logging: All secret access logged
```

### Application Security

```
Authentication:
  ├─ OAuth 2.0 / OpenID Connect
  ├─ MFA: TOTP-based (Google Authenticator)
  ├─ JWT: HS256 signing, 1-hour expiry
  └─ Session: Secure, HttpOnly, SameSite cookies

Authorization:
  ├─ RBAC: Role-based access control
  ├─ ABAC: Attribute-based (tenant-aware)
  ├─ Resource-level: Per-endpoint permissions
  └─ Scope checking: OAuth scopes validated

Input Validation:
  ├─ Type validation: Pydantic schemas
  ├─ Range checks: Numeric bounds
  ├─ Format validation: Email, phone, dates
  ├─ Length limits: String truncation
  └─ SQL injection: Parameterized queries
```

### Compliance & Audit

```
Compliance Frameworks:
  ├─ GDPR: EU data protection
  ├─ PDPA: Thailand privacy law
  ├─ DPA: Vietnam data protection
  ├─ SOC 2: Security audits
  └─ ISO 27001: Information security

Audit Logging:
  ├─ All API calls logged (request/response)
  ├─ Data access logged (for PII)
  ├─ Admin actions logged (modifications)
  ├─ Authentication events logged
  ├─ Authorization failures logged
  └─ Retention: 7 years (immutable storage)

Penetration Testing:
  ├─ Frequency: Quarterly
  ├─ Scope: Full infrastructure
  ├─ Third-party: Independent firm
  ├─ Remediation: 30-day SLA
  └─ Re-test: 100% coverage
```

---

## Cost Optimization

### Cost Breakdown (Monthly)

```
Compute (30%):
  ├─ EC2 instances: $8,000
  ├─ Fargate: $2,000
  ├─ Lambda: $500
  └─ Reserved instances (discount): -$3,000

Database (25%):
  ├─ RDS (multi-region): $8,000
  ├─ Data transfer: $2,000
  └─ Backups: $1,000

Networking (15%):
  ├─ CDN: $3,000
  ├─ Data transfer: $2,000
  └─ Load balancer: $500

Storage (12%):
  ├─ S3: $2,000
  ├─ Glacier archive: $500
  └─ EBS volumes: $1,000

Monitoring (10%):
  ├─ CloudWatch: $1,000
  ├─ DataDog / New Relic: $1,500
  ├─ Splunk: $1,000
  └─ Sentry (error tracking): $500

Misc (8%):
  ├─ VPN / Transit Gateway: $500
  ├─ Secrets Manager: $200
  ├─ KMS: $1,000
  └─ Support plan: $500

Total: ~$33,000/month (~$1.65M/year)
```

### Cost Optimization Strategies

```
1. Right-sizing (15% savings)
   ├─ Analyze CloudWatch metrics
   ├─ Reduce oversized instances
   ├─ Use Compute Optimizer recommendations
   └─ Review quarterly

2. Reserved/Savings Plans (40% savings)
   ├─ Buy 1-year commitments for baseline load
   ├─ Cover 70% of usage with reserved
   ├─ Spot instances for burst capacity
   └─ Estimated: $12,000/month savings

3. Auto-scaling (20% savings)
   ├─ Scale down during off-peak (nights, weekends)
   ├─ Regional load optimization
   ├─ Scheduled scaling for predictable patterns
   └─ Estimated: $6,600/month savings

4. Data Transfer Optimization (10% savings)
   ├─ CloudFront caching (reduce origin calls)
   ├─ VPC endpoints (avoid NAT Gateway costs)
   ├─ Regional data placement
   └─ Estimated: $3,300/month savings

5. Commitment-based Discounts (25% savings)
   ├─ AWS Compute Savings Plans
   ├─ AWS Infrastructure Savings Plans
   ├─ Enterprise discount agreement
   └─ Estimated: $8,250/month savings
```

---

## Deployment Checklist

### Pre-Deployment (48 hours before)

- [ ] Code review approved by 2+ senior engineers
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan complete (no critical issues)
- [ ] Database migration tested in staging
- [ ] Rollback plan documented
- [ ] On-call engineer confirmed
- [ ] Stakeholders notified

### Deployment Day

- [ ] Deploy to staging (verify for 24 hours)
- [ ] Smoke tests passing
- [ ] Monitoring dashboards loaded
- [ ] Alert channels verified
- [ ] Deploy to canary (5% traffic)
- [ ] Monitor for 30 minutes
- [ ] Full rollout (100% traffic)
- [ ] Monitor for 24 hours

### Post-Deployment

- [ ] Metrics reviewed (no anomalies)
- [ ] Error rate < 0.1%
- [ ] Latency p99 < target
- [ ] Stakeholders notified of success
- [ ] Retrospective scheduled (if issues)
- [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Next Review:** 2026-08-29  
**Maintainer:** DevOps & Infrastructure Team
