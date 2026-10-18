# NexGuard Backend

> **Cloud Deployment Security & Reliability Validator**  
> Non-intrusive, read-only automated assurance engine for cloud infrastructure and web deployments.

---

## Overview

NexGuard evaluates public-facing cloud deployments across critical security, networking, and reliability vectors without modifying target infrastructure. It features deterministic scoring, transparent weights, comprehensive SSRF protection, and structured forensic evidence collection.

## Core Capabilities

1. **SSRF Protection & Safety Rules**
   - Strictly enforces `https://` schemes.
   - Forbids raw IP literals in target configurations.
   - Blocks loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.0.0/16`), carrier-grade NAT, multicast, and documentation IP blocks.
   - Intercepts and validates every hop in redirect chains.

2. **Validation Engine Checks**
   | Category | Check ID | Weight | Purpose |
   | :--- | :--- | :--- | :--- |
   | **DNS** | `dns_resolution` | `0.10` | Resolves A, AAAA, and CNAME records; validates safe public routability. |
   | **HTTP** | `http_availability` | `0.15` | Validates HTTP 200 OK, latency, server headers, and redirect chains (max 5). |
   | **TLS** | `tls_certificate` | `0.25` | Inspects x509 certs, expiration (>30 days), SANs/CN matching, and TLS protocols. |
   | **Headers** | `security_headers` | `0.20` | Verifies HSTS, X-Content-Type-Options, CSP, X-Frame-Options, Referrer, and Permissions policies. |
   | **Freshness**| `content_freshness` | `0.15` | Verifies expected release hashes/markers in bounded (first 10KB) body. |
   | **CDN** | `cdn_behavior` | `0.10` | Identifies edge CDNs (Cloudflare, CloudFront, Fastly) and caching behaviors. |

3. **Deterministic Scoring Algorithm**
   - **PASS**: 1.0 credit
   - **WARNING**: 0.5 credit
   - **FAIL / ERROR**: 0.0 credit
   - **SKIPPED**: Dynamically excluded from denominator
   $$\text{Score} = \left(\frac{\sum \text{Credit} \times \text{Weight}}{\sum \text{Applicable Weights}}\right) \times 100$$
   $$\text{Coverage} = \left(\frac{\sum \text{Applicable Weights}}{\sum \text{Total Configured Weights}}\right) \times 100$$

4. **Persistence & Reporting**
   - Local persistence via SQLAlchemy 2.x async engine with SQLite (`aiosqlite`).
   - JSON report serialization and styled standalone HTML report generation.

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # FastAPI dependency injections
│   │   ├── health.py            # Health probe endpoint
│   │   ├── router.py            # V1 API router
│   │   ├── runs.py              # Run execution & reporting endpoints
│   │   └── targets.py           # Target CRUD endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings
│   │   ├── safety.py            # URL validation & SSRF blocker
│   │   └── scoring.py           # Deterministic scoring engine
│   ├── engine/
│   │   ├── cdn_check.py         # CDN & edge caching inspection
│   │   ├── dns_check.py         # DNS resolution & IP safety check
│   │   ├── freshness_check.py   # Bounded version marker search
│   │   ├── headers_check.py     # HTTP security headers validator
│   │   ├── http_check.py        # HTTP availability & redirect tracker
│   │   ├── runner.py            # Asynchronous check orchestrator
│   │   └── tls_check.py         # x509 certificate & TLS handshake check
│   ├── models/
│   │   ├── domain.py            # Core Pydantic domain models
│   │   └── schemas.py           # Request & response schemas
│   ├── reports/
│   │   ├── serializer.py        # JSON & HTML report builders
│   │   └── templates/
│   │       └── report.html      # Styled Jinja2 HTML report template
│   ├── repositories/
│   │   ├── base.py              # Abstract repository contract
│   │   └── sqlite_repo.py       # Async SQLAlchemy SQLite repository
│   └── main.py                  # FastAPI application entrypoint
├── tests/                       # Unit & integration test suite
├── Dockerfile                   # Hardened container definition
├── pyproject.toml               # Package and linter configurations
└── requirements.txt             # Production & test dependencies
```

---

## API Endpoints

- `GET /health` - Service health status & backend version
- `POST /api/v1/targets` - Register a validation target (validates HTTPS & SSRF rules)
- `GET /api/v1/targets` - List registered targets (paginated)
- `GET /api/v1/targets/{target_id}` - Retrieve single target configuration
- `DELETE /api/v1/targets/{target_id}` - Soft delete target (sets `deleted_at`)
- `POST /api/v1/targets/{target_id}/runs` - Trigger a validation run
- `GET /api/v1/runs/{run_id}` - Retrieve run details, check results, and score
- `GET /api/v1/targets/{target_id}/runs` - History of validation runs for a target
- `GET /api/v1/runs/{run_id}/report?format=json|html` - Downloadable JSON/HTML reports

---

## Quickstart

### Local Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run Tests

```bash
pytest
```

### Docker

```bash
docker build -t nexguard-backend .
docker run -p 8000:8000 nexguard-backend
```
