# NexGuard

**Cloud Deployment Security & Reliability Validator**

[![CI](https://github.com/YOUR_USERNAME/nexguard/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/nexguard/actions/workflows/ci.yml)

NexGuard validates cloud website deployments and produces repeatable, evidence-based reports covering availability, DNS, TLS/HTTPS, security headers, content freshness, and CDN behavior. It is a **read-only validation platform** — it never modifies the infrastructure being tested.

![NexGuard Architecture](docs/architecture.png)

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Target Registration** | ✅ P0 | Register HTTPS URLs with expected configuration |
| **Deployment Validation** | ✅ P0 | Run a suite of deterministic checks with timeouts |
| **DNS Check** | ✅ P0 | Resolution, record types, SSRF-safe IP validation |
| **HTTP Check** | ✅ P0 | Status, redirects, response time, redirect safety |
| **TLS/HTTPS Check** | ✅ P0 | Certificate validity, hostname match, expiry warnings |
| **Security Headers** | ✅ P0 | HSTS, CSP, X-Content-Type-Options, Referrer-Policy, etc. |
| **Content Freshness** | ✅ P0 | Version marker comparison across runs |
| **CDN Behavior** | ✅ P1 | Cache-Control, Age, Via, X-Cache header observation |
| **Health Score** | ✅ P0 | Transparent weighted formula with coverage display |
| **Report Export** | ✅ P0 | JSON and standalone HTML reports |
| **Run History** | ✅ P0 | Filterable history with score trends |
| **SSRF Protection** | ✅ P0 | Block loopback, private, link-local, multicast IPs |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                  │
│          React + TypeScript + Vite + Tailwind            │
│                 + shadcn/ui + Recharts                   │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI)                        │
│  ┌──────────┐ ┌────────────┐ ┌────────────────────────┐ │
│  │ API Layer│ │ Engine     │ │ Persistence            │ │
│  │ Routes   │ │ DNS Check  │ │ SQLite (local)         │ │
│  │ Auth     │ │ HTTP Check │ │ DynamoDB (deployed)    │ │
│  │ Schemas  │ │ TLS Check  │ │ S3 Reports (deployed)  │ │
│  │          │ │ Headers    │ │                        │ │
│  │          │ │ Freshness  │ │                        │ │
│  │          │ │ CDN        │ │                        │ │
│  │          │ │ Scoring    │ │                        │ │
│  └──────────┘ └────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| API | Python 3.12 + FastAPI + Pydantic v2 |
| Validation Engine | httpx + dnspython + cryptography |
| Local Persistence | SQLite via SQLAlchemy 2.x |
| Tests | pytest (backend) + Vitest (frontend) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/nexguard.git
cd nexguard
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8000

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health/readiness probe |
| `POST` | `/api/v1/targets` | Register a validation target |
| `GET` | `/api/v1/targets` | List targets (paginated) |
| `GET` | `/api/v1/targets/{id}` | Get target details |
| `DELETE` | `/api/v1/targets/{id}` | Soft-delete a target |
| `POST` | `/api/v1/targets/{id}/runs` | Start a validation run |
| `GET` | `/api/v1/targets/{id}/runs` | List runs for a target |
| `GET` | `/api/v1/runs/{id}` | Get run details with checks |
| `GET` | `/api/v1/runs/{id}/report` | Download report (JSON/HTML) |

Full OpenAPI documentation available at `/docs` when the API is running.

---

## Scoring Formula

```
Score = (Σ weight × credit for applicable checks) / (Σ weight for applicable checks) × 100
```

| Status | Credit | Notes |
|--------|--------|-------|
| PASS | 1.0 | Full weight credit |
| WARNING | 0.5 | Half credit (context-dependent) |
| FAIL | 0.0 | Zero credit |
| ERROR | 0.0 | Zero credit |
| SKIPPED | — | Excluded from denominator |

**Check Weights:**

| Check | Category | Weight |
|-------|----------|--------|
| DNS Resolution | dns | 10% |
| HTTP Availability | http | 15% |
| TLS/HTTPS | tls | 25% |
| Security Headers | headers | 20% |
| Content Freshness | freshness | 15% |
| CDN Behavior | cdn | 10% |
| **Origin Access** | origin | **5%** |

Coverage = applicable weight / total configured weight.

> **Note:** The score is a project-level operational indicator, not a security certification. Weight changes require a ruleset version bump.

---

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Test Coverage

| Test File | Coverage |
|-----------|----------|
| `test_safety.py` | URL/IP validation, SSRF blocking |
| `test_scoring.py` | Score calculation, coverage, edge cases |
| `test_dns_check.py` | Resolution, private IP detection, NXDOMAIN |
| `test_http_check.py` | Status codes, redirects, timeouts |
| `test_tls_check.py` | Cert validity, expiry, hostname match |
| `test_headers_check.py` | Header presence, missing critical headers |
| `test_freshness_check.py` | Marker matching, skipped checks |
| `test_cdn_check.py` | CDN detection, observation checks |
| `test_api_targets.py` | CRUD, validation errors |
| `test_api_runs.py` | Run lifecycle, report generation |

---

## Project Structure

```
nexguard/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routes
│   │   ├── core/            # Config, safety, scoring
│   │   ├── engine/          # Validation checks
│   │   ├── models/          # Domain & API models
│   │   ├── repositories/    # SQLite/DynamoDB adapters
│   │   └── reports/         # JSON/HTML report generation
│   ├── tests/               # pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Types, utils, constants
│   │   └── pages/           # Page components
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Safety & Security

- **Read-only validation** — NexGuard never modifies tested infrastructure
- **SSRF protection** — Blocks loopback, private, link-local, multicast, and reserved IP ranges
- **Redirect safety** — Validates every redirect hop against safety rules
- **Secret redaction** — Strips Set-Cookie, Authorization, tokens from stored evidence
- **No credentials in source** — AWS OIDC for CI/CD; no long-lived keys
- **Input validation** — Pydantic v2 schema validation on all API inputs
- **Ownership enforcement** — Every record includes owner_id; every read/write checks ownership

---

## Design Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Navy / brand-900 | `#102A43` | Headings, dark navigation |
| Blue / brand-700 | `#176B87` | Primary actions, links |
| Teal / accent-500 | `#20B8A6` | Secondary accent |
| Canvas / neutral-50 | `#F6F8FB` | Application background |
| Surface / neutral-0 | `#FFFFFF` | Cards, tables |
| PASS | `#18794E` | Success status |
| WARNING | `#9A6700` | Warning status |
| FAIL | `#B42318` | Failure status |

---

## Known Limitations

- Score is an operational indicator, not a security certification
- CDN checks observe headers but do not validate CDN configuration
- Origin access check requires explicitly supplied origin URL
- Fault-injection lab is Phase 2 (not yet implemented)
- Multi-cloud support is deferred beyond v1
- No AI-generated security verdicts; scoring is fully deterministic

---

## License

This project is for educational and portfolio purposes.

---

## Specification Documents

This project was built from the NexGuard Specification Pack v1.0:

1. **PRD** — Product scope and acceptance criteria
2. **TRD** — Fixed technical stack and architecture
3. **App Flow** — Page-by-page journey and click behavior
4. **Design Brief** — Brand, tokens, typography and UI rules
5. **Backend Schema** — Data model, storage, access and retention
6. **Implementation Plan** — Ordered build plan, test gates and priorities
