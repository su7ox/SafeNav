# SafeNav – Web & Link Safety Analysis Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge&logo=git" alt="Status: In Development"/>
  <img src="https://img.shields.io/badge/Phase-1%20Static%20Analysis-blue?style=for-the-badge" alt="Phase 1"/>
</p>

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript"/>
  <!-- Backend -->
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" alt="scikit-learn"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white" alt="Celery"/>
  <!-- Infra -->
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
</p>

---
SafeNav is an web and link analysis platform designed to evaluate the safety of URLs, websites, and application links.  
It performs multi-layer analysis using static inspection, reputation checks, and machine-learning–based scoring to identify potentially malicious or unsafe links.
The project is structured as a full-stack system with a React frontend and a Python-based backend, focusing on real-world web security use cases such as phishing detection, suspicious domain analysis, and unsafe content identification.
---
---

## 🚀 Key Features

### URL Normalization & Parsing
Handles different types of links including shortened URLs, redirects, and malformed URLs. Applies RFC 3986-compliant sanitization, percent-decoding (including double-encoded attacks), Punycode (IDN) conversion, and scheme/host standardization before any analysis begins.

### Static & Lexical Analysis
Detects suspicious patterns such as abnormal URL length, special characters, and domain structure anomalies. Includes typosquatting detection via Levenshtein/Jaro-Winkler distance, keyword analysis, and Shannon entropy scoring for DGA (Domain Generation Algorithm) detection.

### Redirect Chain Tracing
Follows HTTP redirect chains (301, 302, 307) without executing JavaScript, detecting cross-domain hops, redirect loops, and excessive hop counts that indicate cloaking or obfuscation. Flags client-side redirects (meta-refresh, `window.location`) for deeper analysis.

### SSL/TLS Certificate Inspection
Analyzes certificate type (DV/OV/EV), issuer, age (newly issued certs under 48 hours are high-risk), and cipher suite strength. Over 80% of phishing sites now use HTTPS — the padlock alone is not a safety signal.

### Reputation & Domain Intelligence
Evaluates domain age via WHOIS/RDAP, suspicious TLD detection, and registrar reputation. Domains registered under one week are flagged as critical risk. Caches results via Redis to handle rate limits efficiently.

### Machine Learning–Based Risk Scoring
Uses a Random Forest classifier trained on lexical, host-based, and statistical URL features to compute a probabilistic malice score. Feature importances make the model's verdict explainable (e.g., "70% contribution from Domain Age").

### Weighted Risk Fusion Engine
Combines the ML score with additive heuristic penalties into a single 0–100 Risk Score. Critical indicators (e.g., insecure login form, blacklist hit) immediately override to 100. Every verdict includes a human-readable reasoning list.

### Modular Detection Pipeline
Designed with separable components for easy extension, testing, and experimentation. Each of the eight analysis modules operates independently and feeds into a central score aggregator.

---

## 🧱 Project Architecture

SafeNav is organized as a full-stack application:

- **frontend/** – React-based user interface  
- **backend/** – Python backend responsible for API handling and the eight-module static analysis pipeline

---

## ⚙️ Backend – Phase 1: Static Analysis Engine

The backend implements a **"Fail-Fast"** architecture: all Phase 1 checks run within milliseconds to a few seconds using only the URL string, DNS records, SSL handshake, and HTTP response headers — no browser rendering, no JavaScript execution.

> **Why Fail-Fast?** Approximately 90% of malicious links can be caught through surface-level inspection alone. By filtering these at Phase 1, expensive dynamic sandboxing (Phase 2) is reserved only for ambiguous or heavily obfuscated targets.

### Module I – Link Intake, Sanitization & Normalization

Before any security check runs, the raw URL is cleaned and converted to a canonical form to defeat common obfuscation tricks.

| Step | What Happens | Why It Matters |
|---|---|---|
| Percent-decode (recursive) | Decodes `%xx` escapes repeatedly until stable | Defeats double-encoding attacks like `%2520` |
| Control character stripping | Removes ASCII 0–31 and surrounding whitespace | Prevents parser-breaking invisible characters |
| Scheme & host lowercasing | `HTTP://` → `http://`, domain to lowercase | Ensures consistent, case-insensitive matching |
| Punycode (IDN) conversion | Converts Unicode domains to `xn--...` ASCII | Defeats homograph attacks (Cyrillic 'а' vs Latin 'a') |
| Length guard | Rejects inputs over 2048 characters | Prevents regex backtracking / DoS |

**Plain English:** Think of this step as spell-checking and standardizing the URL before the real analysis starts — the same way a browser normalizes what you type before making a request.

---

### Module II – Link Type Identification & Taxonomy

Once normalized, the URL is fingerprinted to classify its intent. Categories are non-mutually exclusive.

| Type | Detection Method | Risk Signal |
|---|---|---|
| Standard Website | `http`/`https` scheme, valid domain | Baseline |
| IP-Based Link | `ipaddress` library validates raw IPs in netloc | High — phishing kits avoid domain blocklists this way |
| Shortened URL | Domain matched against shortener database (bit.ly, t.co, etc.) | Medium — destination is hidden |
| Direct Download | Path extension checked against `.exe .apk .zip .bat .ps1` blacklist | High — immediate malware risk |
| App Deep Link | Non-http scheme detected (e.g., `whatsapp://`, `tg://`) | Medium — may trigger unauthorized app actions |
| Android Intent | `intent://` scheme parsed for package and target app | High — reveals exactly which app is targeted |

Query parameter values are also scanned for suspicious extensions (e.g., `?file=malware.exe`) to prevent false negatives from indirect download links.

---

### Module III – Lightweight Redirect Tracing

Phishers use redirect chains to bounce through legitimate-looking domains before reaching the malicious page. This module traces the full path without executing any client-side code.

- **User-Agent masquerading** – requests mimic a real browser to bypass basic bot detection
- **Stream mode** – headers and redirects are followed without downloading the full response body
- **Chain analysis** – each hop's domain is compared; cross-domain transitions (e.g., `google.com → attacker.xyz`) increase the risk score
- **Loop guard** – redirect chains capped at 10 hops to prevent infinite loops
- **Client-side redirect detection** – response body is scanned via regex for `meta http-equiv="refresh"` and `window.location`, flagged for Phase 2 deep scan

> **Plain English:** Like following every "click here" button automatically and reporting each stop on the journey, without actually loading the pages in a browser.

---

### Module IV – SSL/TLS Certificate Inspection

HTTPS no longer implies safety. This module inspects the *quality* of the certificate, not just its presence.

| Check | Logic | Risk Implication |
|---|---|---|
| Certificate type | DV (domain-only) vs OV/EV (organization verified) | DV certs are free, automated — standard for phishing |
| Issuer | Flags Let's Encrypt, cPanel issuers on login pages | High-risk combination |
| Certificate age | `Current Time − notBefore` | Under 48 hours → critical "burn domain" signal |
| Cipher suite | Checks for deprecated TLS 1.0, SSLv3, RC4, NULL | Indicates neglected or compromised server |
| SNI compatibility | `server_hostname` included in socket handshake | Required for multi-tenant hosts |
| Self-signed certs | Handshake errors caught, flagged as "Invalid/Untrusted" | Never crash — always report |

---

### Module V – Domain Reputation & History

A domain's registration history is one of the strongest predictors of malicious intent.

| Signal | Threshold | Risk Level |
|---|---|---|
| Domain age | < 7 days since registration | Critical |
| Domain age | < 30 days since registration | High |
| Suspicious TLD | `.xyz`, `.top`, `.tk`, `.gq`, `.zip` | Medium (amplified by other signals) |
| WHOIS privacy/redaction | Creation date missing | Indeterminate (confidence-adjusted) |
| Rate limiting | Handled via Redis cache (24-hour TTL) + rotating proxies | Operational |

Data is fetched via WHOIS (port 43) or the modern RDAP JSON API. The `tldextract` library isolates the effective second-level domain before lookup.

---

### Module VI – Advanced Lexical Analysis & Phishing Detection

This module analyzes the *text* of the URL for visual and semantic deception patterns.

**Typosquatting Detection**  
Levenshtein distance is calculated between the analyzed domain and a reference list of high-value phishing targets (Google, PayPal, Amazon, Microsoft, etc.). A distance of 1–2 flags the domain as a potential typosquat (e.g., `gooogle.com`). Jaro-Winkler distance is used additionally for subdomain spoofing detection. Checks are limited to the top 50–100 most-phished brands using the optimized `python-Levenshtein` C library for performance.

**Keyword Analysis**  
The URL is scanned for trust-inducing keywords in subdomains and paths: `login`, `secure`, `account`, `verify`, `update`, `support`, `billing`. A URL like `paypal-secure.com` or `apple.verify-id.com` triggers a Suspicious Keyword flag.

**Shannon Entropy (DGA Detection)**  
$$H(X) = - \sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

High entropy in a domain name indicates random character distribution — a hallmark of Domain Generation Algorithms used by malware C2 servers (e.g., `xkzj194.com`). Known CDN providers (AWS, Akamai) are whitelisted to prevent false positives.

---

### Module VII – Machine Learning Risk Prediction

Heuristic rules catch known patterns. The ML module catches novel attacks through probabilistic pattern matching.

**Feature Vector**

| Feature Category | Features |
|---|---|
| Lexical | URL length, domain length, dot/hyphen/digit count, `@` presence, path depth |
| Statistical | Shannon entropy of domain and path |
| Host-Based | Domain age (days), SSL validity (binary), redirect count, is_HTTPS (binary) |

**Model: Random Forest Classifier**  
Trained on balanced datasets from PhishTank/OpenPhish (malicious) and Alexa/Tranco Top 1M (benign). Random Forest is chosen over deep learning for three reasons: it performs better on tabular URL feature data, it is resistant to overfitting with smaller datasets, and it produces **feature importance scores** — making its verdicts explainable rather than a black box.

Inference uses `model.predict_proba()` to output a 0.0–1.0 probability that feeds directly into the Risk Score formula. An MLOps feedback loop retrains the model periodically on false positives/negatives reported by users and Phase 2 scans to counter model drift.

---

### Module VIII – Static Content Inspection

A lightweight HTML parser that looks for gross security violations in the page source without rendering it.

**Insecure Login Form Detection**  
Using BeautifulSoup (`bs4`):
1. Parse the HTML body
2. Find `<input type="password">` elements
3. Check the parent `<form action="...">` attribute
4. **Violation:** If the page URL or form action uses `http://` → immediately flagged as "Insecure Login Form" (credential theft risk)

If `<script>` tags are prevalent but no forms are found, the system notes "Dynamic Content Detected" and recommends Phase 2 analysis — covering React/Angular apps where forms are JS-generated.

---

## 🧮 Risk Scoring & Fusion

All eight module outputs are synthesized into a single **Risk Score (0–100)** using a Weighted Risk Fusion model:

$$\text{Risk Score} = \min\left(100,\; (\alpha \cdot S_{ML}) + \sum (P_i \times W_i)\right)$$

If a **Critical Indicator** is detected (e.g., phishing blacklist hit, insecure login form), the score is immediately forced to **100**.

| Detected Signal | Severity | Penalty |
|---|---|---|
| Typosquatting Match | High | +50 |
| Domain Age < 7 Days | High | +40 |
| ML Probability > 80% | High | +30 |
| Cross-Domain Redirect | Low | +15 |
| Suspicious Keyword | Medium | +20 |
| DV SSL Certificate | Low | +10 |
| Insecure Login Form (HTTP) | **Critical** | **+100 (Override)** |

If a check fails (e.g., WHOIS timeout), it is marked **Indeterminate** and the remaining weights are normalized — the score reflects only verified data without artificially deflating the result.

---

## 🚦 Result Tiers & Explainability

| Score | Verdict | UI |
|---|---|---|
| 0 – 30 | Safe | 🟢 Green Shield — "Safe to Visit" |
| 31 – 69 | Caution | 🟡 Warning — "Proceed with Caution" (Phase 2 suggested) |
| 70 – 100 | High Risk | 🔴 Red Alert — "Dangerous Link Detected" |

Every verdict includes a **Reasoning** section — a plain-English list of exactly why the score was assigned:
- *"Domain registered only 3 days ago."*
- *"Contains login keywords but uses a low-trust DV certificate."*
- *"Redirects through 3 different domains."*

This transparency builds user trust and turns SafeNav into an educational tool, not just a black-box filter.

---

## 🎨 Frontend

- Built with **React (Vite)**
- Responsible for user interaction and result visualization
- Communicates with backend APIs to request URL analysis and display safety reports

---

## 🛠 Tech Stack

### 🎨 Frontend

| Technology | Role |
|---|---|
| ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | UI framework — component-based result dashboard |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build tool — fast hot-module reload in development |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Primary frontend language |
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Markup & styling |

### ⚙️ Backend

| Technology | Role |
|---|---|
| ![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=flat-square&logo=python&logoColor=white) | Core language — analysis pipeline, ML, networking |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) | ASGI web framework — async-first, handles concurrent module calls |
| ![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white) | Random Forest classifier — ML risk prediction engine |
| ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) | WHOIS result caching (24h TTL) + Celery message broker |
| ![Celery](https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white) | Parallel task dispatch — runs modules concurrently |
| `BeautifulSoup (bs4)` | Static HTML parsing — insecure form detection |
| `tldextract` | Accurate domain/subdomain/TLD isolation |
| `dnspython` · `ssl` · `socket` | DNS resolution, TLS handshake, certificate retrieval |
| `python-Levenshtein` | C-optimized edit distance — typosquatting detection |
| `httpx` / `requests` | HTTP client — redirect tracing, User-Agent masquerading |

### 🚀 Infrastructure & Tooling

| Technology | Role |
|---|---|
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Containerization — encapsulates runtime, OpenSSL, ML models |
| ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white) | Orchestrates frontend + backend + Redis as a unified stack |
| ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) | Version control & repository hosting |
| ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white) | Primary development environment |

---

## 📌 Use Cases

- Phishing link detection  
- Unsafe website analysis  
- Educational research on web security and threat detection  
- Full-stack development practice with a security focus

---

## 📈 Project Status

> **Current Phase:** Phase 1 – Static Analysis Engine (In Development)

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Static Analysis Engine — 8-module URL inspection pipeline | 🔄 In Development |
| **Phase 2** | Dynamic Analysis — full browser sandboxing & JS execution | 🔜 Planned |
| **Phase 3** | MLOps Pipeline — automated model retraining on new threat data | 🔜 Planned |
| **Phase 4** | Scale & Deploy — Kubernetes horizontal scaling, extended reporting | 🔜 Planned |

**What's done in Phase 1:**
- ✅ Architecture fully designed and documented
- ✅ All 8 analysis modules specified (normalization → ML → risk fusion)
- ✅ Weighted Risk Scoring algorithm defined
- ✅ Docker Compose full-stack setup
- 🔄 Module implementation in progress

**Coming next:**
- Phase 2 dynamic sandboxing (headless browser, JS execution, behavioral fingerprinting)
- MLOps feedback loop for continuous model improvement
- Kubernetes-based horizontal scaling for production workloads

---

## ▶️ How to Run SafeNav

SafeNav can be executed in **two different modes** depending on the use case:

- **Docker Mode** – Recommended for demo, evaluation, and deployment  
- **Development Mode** – Recommended while coding and debugging  

---

## 🐳 Running with Docker (Recommended)

This mode runs the **frontend, backend, and database together** using Docker Compose.

### Prerequisites
- Docker Desktop installed  
- Docker Compose enabled  

### Steps

1. Clone the repository:
```bash
git clone https://github.com/su7ox/SafeNav.git
cd SafeNav
```

2. Build and start all services:
```bash
docker-compose up -d
```

3. Verify running containers:
```bash
docker ps
```

### Access the Application

* **Frontend UI:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Stop the Application

```bash
docker-compose down
```

### Apply Code Changes

Docker does not automatically reflect code changes.

```bash
docker-compose build
docker-compose up -d
```

---

## 🧑‍💻 Running in Development Mode (Without Docker)

This mode supports **hot reload** and is recommended during development.

---

### 🔹 Backend (FastAPI)

#### Prerequisites

* Python 3.10 or higher

#### Steps

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (one-time):
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run backend server:
```bash
uvicorn app.main:app --reload
```

Backend will be available at:

* [http://localhost:8000](http://localhost:8000)
* [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🔹 Frontend (React + Vite)

#### Prerequisites

* Node.js (LTS version recommended)

#### Steps

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend development server:
```bash
npm run dev
```

Frontend will be available at:

* [http://localhost:5173](http://localhost:5173)



## 👤 Author

**su7ox**

GitHub: [@su7ox](https://github.com/su7ox)