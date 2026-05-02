import type { LessonContent } from "./python-basics";

export const securityLessons: Record<string, LessonContent> = {
  "security:t1:cia": {
    nodeId: "security:t1:cia", title: "CIA Triad",
    sections: [
      { heading: "Three Properties", body: "Confidentiality: only authorized parties can read. Integrity: data wasn't tampered with. Availability: legitimate users can access when needed. Most security work optimizes one or two of these — sometimes at the expense of others." },
      { heading: "Threats By Property", body: "Confidentiality: eavesdropping, data leaks. Integrity: tampering, forgery, data corruption. Availability: DoS, accidental outages. Categorize a threat first; mitigations follow naturally." },
    ],
    codeExamples: [
      { title: "Mapping mitigations", code: `# Confidentiality
#   - TLS in transit
#   - Encryption at rest (AES-256)
#   - Access control (RBAC, IAM)

# Integrity
#   - HMAC / signatures (e.g. JWT)
#   - Hash chaining / Merkle trees
#   - Audit logs

# Availability
#   - Redundancy / replication
#   - Rate limiting
#   - DDoS protection at the edge`, explanation: "Each leg of CIA has a canonical set of tools." },
      { title: "Trade-offs", code: `# More C → less A: heavily restricted access can lock out legit users
# More I → more cost: signing every event isn't free
# More A → may weaken C: caching/replication multiplies leak surface`, explanation: "Security is engineering — pick the trade-offs deliberately." },
    ],
    keyTakeaways: ["CIA: Confidentiality, Integrity, Availability", "Threats target one or more legs of CIA", "TLS, encryption, RBAC = confidentiality", "Signatures, HMAC, audit = integrity"],
  },
  "security:t1:auth-basics": {
    nodeId: "security:t1:auth-basics", title: "AuthN vs AuthZ",
    sections: [
      { heading: "Different Questions", body: "Authentication (AuthN): who are you? (passwords, MFA, OAuth). Authorization (AuthZ): what are you allowed to do? (RBAC, ACLs, policies). Most bugs called 'auth' are really AuthZ — letting an authed user do something they shouldn't." },
      { heading: "Sessions vs Tokens", body: "Server-side session: server stores state, client holds an opaque cookie. Easy to revoke, harder to scale. Tokens (JWT): client holds signed claims, server stateless. Easy to scale, harder to revoke (use short TTL + refresh tokens)." },
    ],
    codeExamples: [
      { title: "JWT structure", code: `# header.payload.signature, base64url-encoded
# eg.
# eyJhbGciOiJIUzI1NiJ9
# .eyJzdWIiOiJ1XzEiLCJleHAiOjE3MDB9
# .signature_bytes
#
# Payload (decoded): { "sub": "u_1", "exp": 1700... }
# Signature is HMAC of header.payload with the server's secret`, explanation: "Self-contained credential. Verifying = recompute the HMAC." },
      { title: "AuthZ check", code: `def can_edit(user, post):
    return user.id == post.author_id or user.role == "admin"

@route.put("/posts/<id>")
def update_post(id):
    user = current_user()      # AuthN
    post = db.get(id)
    if not can_edit(user, post):
        abort(403)             # AuthZ
    ...`, explanation: "AuthN identifies; AuthZ decides what's allowed. They're separate steps." },
    ],
    keyTakeaways: ["AuthN: who are you? AuthZ: what can you do?", "Most 'auth bugs' are AuthZ bugs", "Sessions: easy revoke, server state. Tokens: easy scale, short TTL", "Always check authorization at every privileged operation"],
  },
  "security:t2:owasp": {
    nodeId: "security:t2:owasp", title: "OWASP Top 10",
    sections: [
      { heading: "The List", body: "Updated periodically. Recent top items: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Identification + AuthN Failures, Software + Data Integrity Failures, Logging + Monitoring Failures, SSRF." },
      { heading: "How To Use It", body: "Checklist for review and threat modeling. Not exhaustive — you can ace OWASP and still get owned. Pair with secure-by-default frameworks, code review, dependency scanning, and a bug bounty program." },
    ],
    codeExamples: [
      { title: "Broken access control", code: `# BAD — checks ownership in JS only
@route.get("/api/orders/<id>")
def order(id):
    return db.orders.find(id)   # any authed user can read any order

# RIGHT — check on the server
@route.get("/api/orders/<id>")
def order(id):
    o = db.orders.find(id)
    if o.user_id != current_user().id and not is_admin():
        abort(403)
    return o`, explanation: "Never trust the client to enforce authorization." },
      { title: "Misconfiguration trap", code: `# Default admin/admin credentials in production
# Debug endpoints exposed (/_debug, /admin)
# Verbose error pages leaking stack traces
# CORS Access-Control-Allow-Origin: * for sensitive APIs
# All real, all common.`, explanation: "Misconfiguration is in the top 5 every year. Secure defaults > checklists." },
    ],
    keyTakeaways: ["OWASP Top 10 = checklist of common web flaws", "Broken Access Control routinely tops the list", "Use it as a baseline, not the ceiling", "Pair with secure-by-default frameworks and reviews"],
  },
  "security:t2:xss": {
    nodeId: "security:t2:xss", title: "Cross-Site Scripting (XSS)",
    sections: [
      { heading: "Three Flavors", body: "Stored: attacker injects into DB, victims fetch it. Reflected: payload in URL/form, executed on render. DOM-based: payload acts on client-side JS without ever touching the server." },
      { heading: "Defenses", body: "Output encoding (the framework should do this — React does by default). Content Security Policy (CSP) limits script sources. HttpOnly cookies prevent JS from reading the session. Avoid innerHTML / dangerouslySetInnerHTML with untrusted input." },
    ],
    codeExamples: [
      { title: "Reflected XSS pattern", code: `# Bad endpoint
@route.get("/search")
def search():
    q = request.args["q"]
    return f"<h1>Results for {q}</h1>"   # injection!

# /search?q=<script>fetch('/leak?c='+document.cookie)</script>
# → script runs in victim's browser`, explanation: "User input dropped raw into HTML = XSS." },
      { title: "CSP example", code: `# Strong CSP
# Content-Security-Policy:
#   default-src 'self';
#   script-src 'self' https://cdn.example.com;
#   style-src 'self' 'unsafe-inline';
#   img-src 'self' data: https:;
#   frame-ancestors 'none';
#
# - default-src 'self' kills inline & external by default
# - script-src whitelists allowed origins
# - frame-ancestors prevents clickjacking`, explanation: "Defense in depth — even if XSS slips through, CSP limits damage." },
    ],
    keyTakeaways: ["Stored, reflected, DOM-based — three flavors", "Output encode user content (frameworks default to this)", "CSP limits script sources — even if injection happens", "HttpOnly cookies block JS-stolen sessions"],
  },
  "security:t2:sql-injection": {
    nodeId: "security:t2:sql-injection", title: "SQL Injection",
    sections: [
      { heading: "How It Happens", body: "User input concatenated into SQL string. Attacker breaks out of the string, appends arbitrary SQL. Causes: extraction, modification, deletion, privilege escalation. Decades old, still common." },
      { heading: "The Fix", body: "Parameterized queries (placeholders). The DB never confuses data with code. ORMs make this the default. Don't sanitize-by-stripping — escape rules are version-specific and easy to get wrong." },
    ],
    codeExamples: [
      { title: "Vulnerable", code: `# BAD — concatenated SQL
def find_user(name):
    sql = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(sql).fetchall()

# Attacker passes: ' OR 1=1 --
# Final SQL: SELECT * FROM users WHERE name = '' OR 1=1 --'
# → returns every user`, explanation: "Classic injection. Auth bypass, dump, drop." },
      { title: "Parameterized", code: `# RIGHT — parameterized
def find_user(name):
    return db.execute(
        "SELECT * FROM users WHERE name = ?", (name,)
    ).fetchall()

# Driver binds 'name' as data, never as SQL.
# Attacker's payload is treated as a literal string.`, explanation: "Placeholder syntax depends on driver: ? in SQLite, %s in psycopg2, $1 in asyncpg." },
    ],
    keyTakeaways: ["SQL injection = user input becoming SQL code", "Parameterized queries are the only safe answer", "ORMs default to safe; raw SQL needs care", "Don't sanitize-by-stripping — escape rules are version-fragile"],
  },
  "security:t3:crypto-basics": {
    nodeId: "security:t3:crypto-basics", title: "Cryptography Basics",
    sections: [
      { heading: "Symmetric, Asymmetric, Hashing", body: "Symmetric (AES): same key encrypts and decrypts; fast. Asymmetric (RSA, ECC): public key encrypts / verifies; private key decrypts / signs. Slower, used for key exchange and signatures. Hashing (SHA-256, BLAKE3): one-way, fixed-length digest." },
      { heading: "Don't Roll Your Own", body: "Cryptographers have been cataloguing pitfalls for 50 years. Use vetted libraries (libsodium, Python's cryptography). Never invent your own scheme; the bugs are subtle and devastating. AES-CBC without HMAC = padding oracle attacks. ECB mode reveals patterns." },
    ],
    codeExamples: [
      { title: "Symmetric encryption (Python cryptography)", code: `from cryptography.fernet import Fernet
key = Fernet.generate_key()
f = Fernet(key)
token = f.encrypt(b"hello")
print(f.decrypt(token))  # b"hello"
# Fernet = AES-128-CBC + HMAC-SHA256 + URL-safe base64
# Use it instead of hand-rolling AES.`, explanation: "Fernet bundles encryption + auth — fewer footguns." },
      { title: "Hashing for storage (passwords)", code: `# WRONG — fast hash, no salt → rainbow table fodder
import hashlib
hashlib.sha256(b"hunter2").hexdigest()

# RIGHT — slow, salted, parameterized
import bcrypt
hashed = bcrypt.hashpw(b"hunter2", bcrypt.gensalt(12))
bcrypt.checkpw(b"hunter2", hashed)`, explanation: "Passwords need bcrypt / argon2 / scrypt — not SHA." },
    ],
    keyTakeaways: ["Symmetric (AES) fast; asymmetric (RSA/ECC) for key exchange + signing", "Hashing is one-way; SHA for integrity, bcrypt/argon2 for passwords", "Never roll your own crypto — use vetted libraries", "Authenticated encryption (AEAD) > raw encrypt-then-MAC"],
  },
  "security:t3:tls-pki": {
    nodeId: "security:t3:tls-pki", title: "TLS & PKI",
    sections: [
      { heading: "Public Key Infrastructure", body: "CAs issue certificates. Browsers/OSes trust a list of root CAs. Intermediate CAs are signed by roots. Trust flows downward through the chain. Let's Encrypt issues free 90-day certs; anyone can be a CA in principle." },
      { heading: "Revocation", body: "OCSP and CRLs report revoked certs. Both are flaky in practice — short cert lifetimes (90 days) trumped revocation as the operational answer. Browsers ship hardcoded revocation lists for the most critical issues." },
    ],
    codeExamples: [
      { title: "Cert info", code: `# CLI: openssl x509 -in cert.pem -text -noout
#
# Subject: CN=example.com
# Issuer:  CN=Let's Encrypt R3
# Validity: Not Before / Not After
# SAN: DNS:example.com, DNS:www.example.com
# Public Key Algorithm: ECDSA prime256v1`, explanation: "Subject = who, Issuer = signed by, SAN = additional names." },
      { title: "Pinning trade-offs", code: `# Pinning = client only trusts a specific cert/key, not all CAs
# Pros: defends against rogue CAs
# Cons: brick the app if cert rotation goes wrong
#
# Mobile apps used to pin aggressively; now mostly avoided
# in favor of CT logs + reasonable trust stores.`, explanation: "Pinning is powerful but operationally risky." },
    ],
    keyTakeaways: ["PKI: roots → intermediates → leaf certs", "Trust = pre-installed root CAs", "Short TTLs (90 days) replaced practical revocation", "Pinning trades attack reduction for operational risk"],
  },
  "security:t4:secrets": {
    nodeId: "security:t4:secrets", title: "Secrets Management",
    sections: [
      { heading: "Where NOT To Put Them", body: "Not in source control. Not in client-side code. Not in logs. Not in error pages. Not in shared docs. The most common breach root cause is a leaked secret in a public repo or paste." },
      { heading: "Where To Put Them", body: "Environment variables for app config. A secret manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) for rotation and audit. KMS for envelope encryption. Service identity (IAM roles) for cloud-to-cloud — eliminates long-lived credentials entirely." },
    ],
    codeExamples: [
      { title: "Env var pattern", code: `# In code
import os
api_key = os.environ["STRIPE_API_KEY"]

# In dev: .env file (gitignored), loaded via dotenv
# In prod: injected by the platform (Vercel, Kubernetes secrets, ...)
# Never: hardcoded`, explanation: "Process env vars are the standard injection point." },
      { title: "Rotation strategy", code: `# 1. Generate new secret
# 2. Distribute to consumers (push or pull)
# 3. Wait for full propagation
# 4. Revoke old secret
# 5. Verify nothing broke
#
# Automate everything via your secret manager.`, explanation: "Rotate predictably, not reactively." },
    ],
    keyTakeaways: ["Never commit secrets — scan repos for them too", "Env vars + secret manager for production", "Use IAM roles for cloud-to-cloud — no long-lived creds", "Rotate periodically, automate the process"],
  },
  "security:t4:threat-modeling": {
    nodeId: "security:t4:threat-modeling", title: "Threat Modeling",
    sections: [
      { heading: "STRIDE", body: "Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. For each component, walk through which STRIDE categories apply and what mitigations exist. Cheap, surprisingly effective at finding gaps." },
      { heading: "Drawing The Diagram", body: "Boxes for components. Arrows for data flow. Trust boundaries (where untrusted meets trusted) are key. Most vulnerabilities live at trust boundaries — that's where input validation, authn/authz, and rate limiting belong." },
    ],
    codeExamples: [
      { title: "Mini STRIDE table", code: `# Component: /api/upload (file upload endpoint)
# Spoofing       — require AuthN (JWT, session)
# Tampering      — TLS in transit; signed payloads
# Repudiation    — audit log who uploaded what
# Info disclosure — strip EXIF; access control on stored files
# DoS            — size limit, rate limit
# EoP            — verify file type, scan for malware`, explanation: "Walk every STRIDE letter for the component." },
      { title: "Trust boundaries", code: `# Public internet → Edge LB → App → DB
#                  ^               ^
#                  trust boundary  trust boundary
#
# At each boundary:
# - input validation
# - rate limiting
# - authn / authz
# - logging`, explanation: "Concentrate defenses at the boundaries." },
    ],
    keyTakeaways: ["STRIDE: Spoofing, Tampering, Repudiation, Info, DoS, EoP", "Walk each category for each component", "Trust boundaries are where vulnerabilities concentrate", "Threat model early — cheaper than fixing later"],
  },
};
