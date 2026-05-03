import type { Snippet } from "./types";

export const networkingSnippets: Snippet[] = [
  {
    id: "net-tcp-handshake",
    language: "networking",
    title: "TCP three-way handshake",
    tag: "tcp",
    code: `// Cold-connection setup before any data flows:
//
//   Client                 Server
//      |    SYN  ─────────>  |     "I want to connect"
//      |    <───── SYN-ACK   |     "OK, I see you"
//      |    ACK  ─────────>  |     "Great, ready"
//
// One round-trip total. TLS adds another (TLS 1.3) or two (TLS 1.2).
//
// Costs at 30ms RTT:
//   TCP only:        30ms
//   TCP + TLS 1.3:   60ms
//   TCP + TLS 1.2:   90ms
//   QUIC + TLS 1.3:  30ms (transport + TLS combined)
//
// Reuse connections aggressively — handshakes add up.`,
    explanation:
      "Every cold connection eats round-trips. HTTP/2 multiplexing and connection reuse pay this cost once across many requests.",
  },
  {
    id: "net-tcp-vs-udp",
    language: "networking",
    title: "TCP vs UDP — pick the protocol",
    tag: "tcp",
    code: `// TCP — reliable, ordered, connection-based.
//   - Retransmits lost packets, preserves order, controls congestion.
//   - Used by: HTTP/1.1, HTTP/2, SSH, most DB protocols.
//
// UDP — fire-and-forget. No reliability, no ordering, no congestion control.
//   - Used by: DNS (small queries), video calls, gaming, QUIC.
//
// QUIC — UDP-based but rebuilds reliability + ordering on top.
//   - Foundation of HTTP/3. Faster handshake; no head-of-line blocking
//     when packets are lost.
//
// Rule of thumb:
//   reliability + order required -> TCP
//   low latency, can lose packets -> UDP/QUIC`,
    explanation:
      "Match the protocol to your application. Lossy real-time streams want UDP; correct-once delivery wants TCP. QUIC bridges the two.",
  },
  {
    id: "net-dns-records",
    language: "networking",
    title: "DNS record types",
    tag: "dns",
    code: `# Most-used record types:
#
#   A      example.com -> 93.184.216.34       (IPv4)
#   AAAA   example.com -> 2606:2800:220::abcd  (IPv6)
#   CNAME  www.example.com -> example.com      (alias to another name)
#   MX     example.com -> 10 mail.example.com  (mail server)
#   TXT    example.com -> "v=spf1 -all"        (arbitrary text)
#   NS     example.com -> ns1.dns-host.com    (delegated nameservers)
#   CAA    example.com -> 0 issue "letsencrypt.org"  (which CAs may issue)
#
# CNAME at the apex (root) is forbidden by RFC 1034 — use ALIAS / ANAME
# (provider-specific) or A/AAAA records directly.

# Inspect with dig:
# dig +short example.com A
# dig example.com MX`,
    explanation:
      "Each record type answers a different question. TXT is overloaded for verification (SPF, DKIM, DMARC, domain ownership).",
  },
  {
    id: "net-http-status",
    language: "networking",
    title: "HTTP status code cheat sheet",
    tag: "http",
    code: `// 2xx — success
// 200 OK            success with body
// 201 Created       POST that created a resource (include Location header)
// 204 No Content    success with no body (DELETE, sometimes PUT)

// 3xx — redirect
// 301 Moved Perm.   permanent (cacheable!)
// 302 Found         temporary
// 304 Not Modified  conditional GET hit (no body)

// 4xx — client error
// 400 Bad Request    malformed request
// 401 Unauthorized   missing/invalid auth
// 403 Forbidden      authed but not allowed
// 404 Not Found
// 409 Conflict       duplicate or version conflict
// 422 Unprocessable  validation failed
// 429 Too Many Req.  rate limited (include Retry-After)

// 5xx — server error
// 500 Server Error   unexpected
// 502 Bad Gateway    upstream failed
// 503 Unavailable    overloaded / maintenance`,
    explanation:
      "Pick the most specific. Clients act on the class — 4xx don't retry; 5xx + 503 retry with backoff.",
  },
  {
    id: "net-http-versions",
    language: "networking",
    title: "HTTP/1.1 vs /2 vs /3",
    tag: "http",
    code: `// HTTP/1.1 (1997)
//   - Text-based, persistent connections, ONE request at a time per connection.
//   - Pipelining was specified but never reliable in browsers.
//
// HTTP/2 (2015)
//   - Binary, MULTIPLEXED — many in-flight requests on a single connection.
//   - Header compression (HPACK).
//   - Still over TCP -> head-of-line blocking when packets are lost.
//
// HTTP/3 (standardized 2022)
//   - HTTP semantics over QUIC (UDP-based).
//   - No TCP head-of-line blocking — each stream is independent.
//   - Faster connection setup (1 RTT cold; 0 RTT for resumption).
//
// Browsers and CDNs negotiate the highest version both support.`,
    explanation:
      "Modern web traffic is HTTP/2 or /3. Connection reuse + multiplexing make page loads dramatically faster than HTTP/1.1.",
  },
  {
    id: "net-tls-handshake",
    language: "networking",
    title: "TLS 1.3 handshake (1 RTT)",
    tag: "tls",
    code: `// TLS 1.3 in one round-trip:
//
//   Client                       Server
//     |  ClientHello (key share)  ─>  |
//     |  <─ ServerHello (key share)   |
//     |     + cert + signature        |
//     |     + Finished                |
//     |  Finished ─>                  |
//     |  <─── encrypted data ───>     |
//
// TLS 1.2 took 2 round-trips (key exchange and authentication separated).
// TLS 1.3 fuses them and dropped legacy cipher suites.
// 0-RTT resumption skips the handshake entirely (with replay risk).
//
// TLS 1.0/1.1 are deprecated (RFC 8996, 2021).`,
    explanation:
      "TLS 1.3 cut the cold-handshake cost in half by combining key exchange and auth. Always prefer 1.3 in modern systems.",
  },
  {
    id: "net-cert-chain",
    language: "networking",
    title: "Certificate chain",
    tag: "tls",
    code: `# Trust flows top-down:
#
#   Root CA  (in browser/OS trust store)
#      ↓ signs
#   Intermediate CA
#      ↓ signs
#   Leaf cert  (your example.com, presented by your server)
#
# Server presents leaf + intermediates. Client verifies the chain
# back to a root it already trusts.
#
# Inspect:
# openssl s_client -showcerts -connect example.com:443 < /dev/null
#
# Subject:    CN = example.com
# Issuer:     CN = R3, O = Let's Encrypt
# Validity:   90 days (Let's Encrypt default)
# SAN:        DNS:example.com, DNS:www.example.com`,
    explanation:
      "Roots ship with the OS/browser. Intermediates rotate more often. Short cert lifetimes (90 days, soon shorter) replaced practical revocation.",
  },
  {
    id: "net-cors",
    language: "networking",
    title: "CORS — cross-origin requests",
    tag: "http",
    code: `// Browsers block JS from reading responses from a different origin
// (protocol + host + port) UNLESS the server opts in via CORS headers.
//
// Simple GET response from api.example.com to a request from app.example.com:
//
//   HTTP/1.1 200 OK
//   Access-Control-Allow-Origin: https://app.example.com
//   Access-Control-Allow-Credentials: true   // if you need cookies
//
// For non-simple methods (PUT, DELETE) or custom headers, the browser sends
// a PREFLIGHT OPTIONS request first:
//
//   OPTIONS /api/users HTTP/1.1
//   Origin: https://app.example.com
//   Access-Control-Request-Method: PUT
//
//   HTTP/1.1 204 No Content
//   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
//   Access-Control-Allow-Headers: Content-Type, Authorization
//
// Server says yes -> browser sends the real request.`,
    explanation:
      "CORS protects users, not the server. * is fine for public read-only APIs; pin to specific origins when credentials are involved.",
  },
  {
    id: "net-websocket-upgrade",
    language: "networking",
    title: "WebSocket upgrade",
    tag: "websocket",
    code: `// Client opens an HTTP connection with Upgrade: websocket headers.
// Server agrees by returning 101 Switching Protocols.
// From there, the same TCP connection carries framed bidi messages.

// Client request:
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: <base64-random>
Sec-WebSocket-Version: 13

// Server response:
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: <derived from key>

// After 101: full-duplex framed messages, both directions.

// Browser API:
const ws = new WebSocket("wss://example.com/chat");
ws.onmessage = (e) => console.log(e.data);
ws.send("hello");`,
    explanation:
      "WebSockets reuse the HTTP/TLS handshake, then switch to a framed binary protocol. Use wss:// in production.",
  },
  {
    id: "net-cdn-cache-control",
    language: "networking",
    title: "Cache-Control for CDN",
    tag: "http",
    code: `// Static asset (hashed filename like app.abc123.js):
Cache-Control: public, max-age=31536000, immutable
// 1 year, browser doesn't even revalidate.
// Safe because the filename hashes the content — change content -> new URL.

// Public dynamic content:
Cache-Control: public, max-age=60, s-maxage=600
ETag: "v123"
// Browser caches 60s, CDN caches 10 min, ETag enables 304 Not Modified.

// Private (per-user) content:
Cache-Control: private, no-store
// Don't let CDN or proxies cache it at all.

// Stale-while-revalidate — serves stale instantly while refreshing in bg:
Cache-Control: public, max-age=60, stale-while-revalidate=300`,
    explanation:
      "Cache-Control directives shape how shared caches and browsers behave. immutable + content-hashed filenames is the gold standard for static assets.",
  },
  {
    id: "net-anycast",
    language: "networking",
    title: "Anycast — same IP, many places",
    tag: "routing",
    code: `// Multiple geographically distributed servers share the SAME IP.
// BGP routes each user's packets to the topologically nearest one.
//
// Cloudflare's 1.1.1.1 DNS resolver lives at one IP, but your packets
// hit whichever PoP is closest — possibly a different physical server
// in a different country from another user's.
//
// Effects:
//   - Lower latency (closer PoP)
//   - Inherent redundancy (a PoP failing reroutes via BGP)
//   - Same IP doesn't change on failover — clients don't care
//
// CDNs and DNS root servers heavily use anycast.
// AWS Global Accelerator and Cloudflare Spectrum offer it as a service.`,
    explanation:
      "One IP, many locations. The internet's routing protocol picks the closest. Used everywhere you want global low-latency single-IP entry points.",
  },
  {
    id: "net-bgp-hijack",
    language: "networking",
    title: "BGP hijack risk",
    tag: "routing",
    code: `# BGP (Border Gateway Protocol) is how Autonomous Systems (ASes —
# ISPs, clouds, big networks) tell each other which IP prefixes
# they can reach.
#
# BGP TRUSTS announcements by default. A misconfigured (or malicious)
# AS can announce someone else's prefix.
#
# 2008 — Pakistan Telecom announced 8.8.8.0/24 (Google's), and other
# ASes accepted it. Google traffic worldwide briefly went to Pakistan.
#
# Mitigation: RPKI (Resource Public Key Infrastructure) cryptographically
# signs which AS is authorized to announce which prefix. Routers with
# RPKI enabled reject invalid announcements.
#
# Adoption is steadily increasing but uneven.`,
    explanation:
      "Internet routing's trust model is announcement-based. RPKI is the cryptographic fix; deploy + validate it on your network.",
  },
  {
    id: "net-grpc-vs-rest",
    language: "networking",
    title: "gRPC vs REST",
    tag: "protocols",
    code: `// gRPC — HTTP/2 + Protocol Buffers (protobuf).
//   - Strongly typed schemas (.proto file).
//   - Multiplexed streams over one connection.
//   - Polyglot client + server stubs auto-generated.
//   - Binary wire format (smaller, faster).
//   - Awkward for browsers (gRPC-Web is a translation).
//
// REST — HTTP/JSON.
//   - No schema enforcement (use OpenAPI to bolt one on).
//   - Caching is easy (HTTP-native).
//   - Universal — every client, every language, every tool.
//
// Pick:
//   - Service-to-service in polyglot stack -> gRPC
//   - Public APIs / browser-facing -> REST (or GraphQL)
//   - Real-time streaming -> gRPC streams or WebSockets`,
    explanation:
      "gRPC wins for internal microservices: types, perf, codegen. REST wins for public APIs: caching, tooling, browser support.",
  },
  {
    id: "net-sni",
    language: "networking",
    title: "SNI — many sites, one IP",
    tag: "tls",
    code: `// Server Name Indication: client tells the server WHICH hostname
// it wants in the TLS hello — BEFORE the cert is sent.
//
// Without SNI: one cert per IP. Shared TLS hosting was impossible.
// With SNI:    server picks the right cert based on the hostname.
//
// curl -v https://example.com 2>&1 | grep -i SNI
// * TLSv1.3 (OUT), Client hello (1):  ... server name: example.com
//
// Encrypted Client Hello (ECH) — newer extension that ENCRYPTS the SNI itself,
// hiding which site you're connecting to from network observers.`,
    explanation:
      "SNI is what makes shared HTTPS hosting and CDNs work. Without it, the entire HTTPS web's economics would be very different.",
  },
];
