// ============================================================
// Networking — All Tiers (T1–T4)
// ============================================================

import type { LessonContent } from "./python-basics";

export const networkingLessons: Record<string, LessonContent> = {
  // ── T1 ──
  "networking:t1:osi": {
    nodeId: "networking:t1:osi", title: "OSI Model",
    sections: [
      { heading: "Seven Layers, Roughly", body: "Physical (cables, radio), Data Link (Ethernet, Wi-Fi MAC), Network (IP), Transport (TCP/UDP), Session, Presentation, Application (HTTP, DNS). Lower layers carry the upper. In practice TCP/IP collapses Session and Presentation into Application — the OSI model is more useful as a mental scaffold than as a literal architecture." },
      { heading: "Why The Layering Matters", body: "Each layer hides what's below. App code talks HTTP without knowing whether it rides Wi-Fi or fiber. TCP retransmits lost packets without the app knowing. Layering lets you swap pieces — IPv4 to IPv6, HTTP/1.1 to HTTP/3 — without rewriting everything above." },
      { heading: "Debug By Descending", body: "When the app's broken, walk down the layers. App: read the response or the logs. Transport: can you connect? (telnet, nc). Network: can you ping or traceroute? Link: is the cable plugged in / Wi-Fi up? Most debugging is realizing you guessed wrong about which layer the bug is at." },
    ],
    codeExamples: [
      { title: "Where things live", code: `# Layer 7 (App):       HTTP, DNS, SMTP, gRPC, MQTT
# Layer 4 (Transport): TCP, UDP, QUIC
# Layer 3 (Network):   IP, ICMP
# Layer 2 (Data Link): Ethernet, Wi-Fi 802.11
# Layer 1 (Physical):  cables, radio, fiber

# Knowing the layer points to the right tool.`, explanation: "The layer of a tool tells you what it can and can't see." },
      { title: "Tool by layer", code: `# L7 — curl, browser DevTools, app logs
# L4 — nc / telnet (does the port answer?)
# L3 — ping (host reachable?), traceroute (path?)
# L2 — arp -a, ip neighbor (MAC table)
# L1 — physical inspection, link lights, signal strength`, explanation: "Each layer has its own diagnostic tools. Skipping levels wastes time." },
      { title: "Debug walkthrough", code: `# 'API call returns 502'
# L7 — server logs say nothing? Maybe never reached app.
# L4 — curl works locally, fails from production. Port? TLS?
# L3 — traceroute shows packets dying at hop X. Routing/firewall.
# L2 — within the data center, MAC table corrupted? (rare)
# L1 — flaky cable? Almost never the answer in cloud, often
#      the answer in on-prem.`, explanation: "Real outages ladder down — and most of the time the bug is at L4 or L7. But knowing how to descend keeps you from guessing." },
    ],
    keyTakeaways: ["7 layers; TCP/IP collapses some — model is a mental scaffold", "Each layer hides the ones below — that's how the stack composes", "Debug by descending: app → transport → network → link", "Each layer has its own diagnostic tools (curl, nc, ping, traceroute)", "Most app bugs are at L4 or L7; physical issues are rarer in cloud"],
  },
  "networking:t1:tcp-ip": {
    nodeId: "networking:t1:tcp-ip", title: "TCP / IP",
    sections: [
      { heading: "TCP vs UDP", body: "TCP is reliable, ordered, connection-based. UDP is fire-and-forget. HTTP/1.1 and HTTP/2 ride TCP. HTTP/3 (QUIC) rides UDP — same reliability rebuilt on top, faster handshake, no head-of-line blocking. DNS uses UDP for small queries (TCP for large or AXFR), real-time games and WebRTC use UDP." },
      { heading: "TCP Handshake And Costs", body: "Three-way handshake: client SYN → server SYN-ACK → client ACK. One round-trip before data flows. TLS adds another (TLS 1.2: 2 RTTs; TLS 1.3: 1 RTT; QUIC fuses transport + TLS into one). Cold connection setup at ~30ms RTT means hundreds of milliseconds gone before any data moves. Reuse connections aggressively." },
      { heading: "Congestion Control", body: "TCP's main job after delivering bytes is being a good neighbor. It probes for available bandwidth (slow start), backs off on loss (AIMD — additive-increase, multiplicative-decrease). Modern algorithms like CUBIC (Linux default) and BBR (Google's) are smarter than the original Reno but solve the same problem: how fast can I send without driving everyone off the network?" },
    ],
    codeExamples: [
      { title: "Pick the protocol", code: `# Reliability + order required → TCP / HTTP
# Low latency, can lose packets → UDP / QUIC / RTP
# DNS small query → UDP (fits in one packet)
# Streaming a movie → typically TCP (HLS/DASH); WebRTC uses UDP
# Live game → UDP (a stale packet is worse than a missing one)`, explanation: "Match protocol to application requirements." },
      { title: "Handshake cost", code: `# Cold-connection RTT cost
# TCP only:                1 RTT
# TCP + TLS 1.2:           3 RTTs (1 for TCP + 2 for TLS)
# TCP + TLS 1.3:           2 RTTs (1 for TCP + 1 for TLS)
# QUIC + TLS 1.3:          1 RTT (transport + TLS combined)
# 0-RTT resumption:        0 RTTs (with replay risk)
#
# At 50ms RTT, that's the difference between 50ms and 150ms
# of pre-data delay. Connection reuse and HTTP/2/3 multiplexing
# pay this cost once across many requests.`, explanation: "RTTs add up across small requests. Reuse connections; prefer HTTP/2 or 3." },
      { title: "Watching congestion control", code: `# Linux (CUBIC by default; BBR available)
# sysctl net.ipv4.tcp_congestion_control
# echo bbr | sudo tee /proc/sys/net/ipv4/tcp_congestion_control
#
# Why care? On a lossy link or long-fat-pipe, BBR can sometimes
# get 2–10x throughput vs CUBIC by modeling bandwidth-delay
# product instead of reacting to loss alone.`, explanation: "Most workloads don't need to think about it; high-throughput pipes (CDN ↔ origin, big data transfer) sometimes do." },
    ],
    keyTakeaways: ["TCP: reliable, ordered. UDP: fast, unreliable", "QUIC = UDP-based reliable transport, basis of HTTP/3", "TCP handshake = 1 RTT; TLS adds another (less in 1.3)", "Reuse connections — handshakes are expensive", "Congestion control (CUBIC, BBR) shapes throughput on real links"],
  },

  // ── T2 ──
  "networking:t2:dns": {
    nodeId: "networking:t2:dns", title: "DNS",
    sections: [
      { heading: "Resolution Flow", body: "Browser asks resolver (your ISP, 1.1.1.1, 8.8.8.8) for example.com. Resolver checks its cache. On miss, recursively asks: root servers → .com servers → example.com's authoritative servers. Each step returns the next reference. The resolver caches the final answer for the TTL. Most queries you make are cache hits — the full recursion is rare." },
      { heading: "Record Types", body: "A (IPv4), AAAA (IPv6), CNAME (alias to another name), MX (mail server), TXT (arbitrary; SPF, DKIM, domain verification), NS (delegated nameservers), SOA (authority record). CAA restricts which CAs can issue certs for the domain. CNAME at the apex (root) is forbidden by RFC 1034 — use ALIAS / ANAME flattening (provider-specific) if you need a hostname mapping at the root." },
      { heading: "TTL And Propagation", body: "TTL controls how long resolvers cache. Short (60s): quick failover, more queries against your authoritative servers. Long (24h): fewer queries, slow to flip. Strategy: long TTLs normally; pre-stage by lowering TTL hours-to-days before a planned change, then raise it back after." },
    ],
    codeExamples: [
      { title: "dig the basics", code: `# Get an A record
dig +short example.com A
# 93.184.216.34   (example IP)

# Lookup chain — see who answered
dig example.com +trace

# Specific record types
dig example.com MX
dig example.com TXT
dig example.com NS
dig example.com CAA   # which CAs are allowed?`, explanation: "dig is the right tool for poking at DNS. +short for one-line output, +trace for the full lookup chain." },
      { title: "TTL trade-off", code: `# Long TTL (e.g. 86400 = 24 hours)
# - Pros: fewer queries against authoritative; cheap, fast.
# - Cons: a change takes up to 24h to propagate worldwide.
#
# Short TTL (e.g. 60 = 1 minute)
# - Pros: quick failover, fast cutovers.
# - Cons: ~1440x more queries; load on authoritative servers; cost.
#
# Compromise: long TTLs normally; lower to 60-300s a day before
# a planned change; restore after.`, explanation: "TTL = trade-off between query load and propagation speed." },
      { title: "Apex CNAME workaround", code: `# RFC 1034: a name with a CNAME can have NO other records.
# But the apex (example.com) MUST have SOA + NS records.
# So CNAME at the apex is forbidden.
#
# Solutions:
# 1. ALIAS / ANAME (Route 53, Cloudflare, etc.) — flattens at
#    resolution time to current A/AAAA records of the target.
# 2. Just put A/AAAA records directly at the apex — fine if the
#    target has stable IPs.
# 3. Redirect the apex to www via HTTP (good URL hygiene anyway).`, explanation: "ALIAS/ANAME is the practical answer. It's not standard DNS; it's a provider feature." },
    ],
    keyTakeaways: ["Resolution: resolver → root → TLD → authoritative", "TTLs control how long each level caches", "A/AAAA for IPs; CNAME for aliases; TXT for verification; CAA for cert restriction", "Long TTLs normally; shorten in advance of cutovers", "CNAME at the apex is forbidden — use ALIAS/ANAME or A/AAAA directly"],
  },
  "networking:t2:http": {
    nodeId: "networking:t2:http", title: "HTTP & HTTPS",
    sections: [
      { heading: "Versions", body: "HTTP/1.1 (1997): text-based, persistent connections, one request at a time per connection (pipelining never worked). HTTP/2 (2015): binary, multiplexed (many in-flight requests per connection), header compression (HPACK). HTTP/3 (standardized 2022): HTTP semantics over QUIC (over UDP) — eliminates TCP head-of-line blocking when packets are lost; faster handshake." },
      { heading: "Request / Response Anatomy", body: "Request: method (GET/POST/etc.) + path + version + headers + (optional) body. Response: status + headers + (optional) body. Headers carry caching (Cache-Control, ETag), auth (Authorization), content negotiation (Accept, Content-Type), and observability (X-Request-Id, traceparent)." },
      { heading: "Headers Worth Knowing", body: "Cache-Control (max-age, public/private, immutable). ETag + If-None-Match for conditional requests. Accept-Encoding: gzip, br for compression. Authorization: Bearer <token>. CORS: Access-Control-Allow-* family. Strict-Transport-Security (HSTS) forces HTTPS. Content-Security-Policy (CSP) limits what the page can do. Headers shape behavior more than most app code." },
    ],
    codeExamples: [
      { title: "Raw HTTP/1.1 (still useful to know)", code: `GET /api/users/1 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJ...
User-Agent: curl/8.0

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60, public
ETag: "v123"
Content-Length: 27

{"id":1,"name":"Ada"}`, explanation: "Text protocol — handy for understanding, useful for debugging. Modern wire formats (HTTP/2, /3) are binary but carry the same semantics." },
      { title: "Conditional GET (saves bandwidth)", code: `# First request
# GET /img.jpg
# 200 OK
# ETag: "abc123"
# (1 MB body)

# Next request (browser stored ETag)
# GET /img.jpg
# If-None-Match: "abc123"
# 304 Not Modified
# (no body — saves 1 MB)

# Servers and CDNs use this for cheap revalidation. Combined with
# max-age, you check freshness only after the local cache expires.`, explanation: "ETag + If-None-Match = revalidation without re-sending the body." },
      { title: "Useful production headers", code: `# Caching
Cache-Control: public, max-age=60, s-maxage=600
ETag: "v123"
Vary: Accept-Encoding         # different cached versions per encoding

# Auth
Authorization: Bearer <jwt>

# Tracing
X-Request-Id: abc123
Traceparent: 00-<trace_id>-<span_id>-01

# Security
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff`, explanation: "These show up in real production traffic. Worth knowing what each one does." },
    ],
    keyTakeaways: ["HTTP/1.1 text; HTTP/2 binary multiplexed; HTTP/3 over QUIC (UDP)", "Method + path + headers + body — both directions", "Cache-Control + ETag drive HTTP caching", "HSTS, CSP, X-Content-Type-Options harden the response", "Tracing headers (X-Request-Id, traceparent) are lifelines for debugging"],
  },

  // ── T3 ──
  "networking:t3:tls": {
    nodeId: "networking:t3:tls", title: "TLS & Certificates",
    sections: [
      { heading: "What TLS Provides", body: "Three guarantees: confidentiality (encryption), integrity (tamper detection via MACs), authentication (server identity, optionally client). TLS 1.2 and 1.3 are the modern versions; SSL 3.0 and TLS 1.0/1.1 are deprecated. The handshake negotiates a session key; data flows encrypted with symmetric crypto (AES-GCM, ChaCha20-Poly1305)." },
      { heading: "Handshake Steps (Simplified)", body: "TLS 1.3 (1-RTT): client sends ClientHello with key share. Server picks parameters, sends ServerHello + cert + signature, derives keys. Client verifies cert and signature, derives keys, sends Finished. Done — encrypted data flows. TLS 1.2 takes 2 RTTs because key exchange and authentication are split across more messages." },
      { heading: "Cert Chains And SNI", body: "Server presents a leaf cert + intermediate certs. Client trusts a root CA pre-installed in the OS/browser store. Trust flows leaf → intermediate → root. SNI (Server Name Indication): client sends the hostname in the TLS hello so a server hosting many sites picks the right cert. Mutual TLS (mTLS) requires the client to present a cert too — common for service-to-service auth." },
    ],
    codeExamples: [
      { title: "Inspect a cert chain", code: `# CLI
openssl s_client -showcerts -connect example.com:443 < /dev/null

# You'll see:
# Leaf:        CN = example.com, signed by an intermediate
# Intermediate: signed by a root CA
# Root:        self-signed, in the trust store

# Or fetch the full chain to a file
openssl s_client -showcerts -connect example.com:443 < /dev/null \\
  > chain.pem 2>/dev/null`, explanation: "Trust flows top-down. Browsers ship a list of root CAs; intermediates and leafs are presented by the server." },
      { title: "SNI in practice", code: `# One IP can host many TLS sites because SNI tells the server
# which hostname the client is connecting to BEFORE the cert
# is sent.
#
# curl (verbose) shows it
curl -v https://example.com 2>&1 | grep -i SNI
# * TLSv1.3 (OUT), Client hello (1):  ... server name: example.com

# Without SNI, the server would have to pick one cert per IP.
# SNI is what makes shared hosting and CDNs work over TLS.`, explanation: "Pre-SNI: one IP, one cert. SNI made cheap shared TLS hosting possible." },
      { title: "mTLS sketch", code: `# Both sides have certs. Client presents its cert during the
# handshake; server validates against its trusted CA bundle.
#
# Use cases:
# - Service-to-service auth inside a mesh (Istio, Linkerd auto-issue)
# - Banking / payment APIs requiring strong client identity
# - VPN / Zero Trust gateways
#
# Trade-offs: client cert lifecycle is hard. Rotation, revocation,
# bootstrap. Service meshes solve a lot of this automatically.`, explanation: "mTLS is great when the cert lifecycle is automated; painful when humans manage it." },
    ],
    keyTakeaways: ["TLS = confidentiality + integrity + authentication", "TLS 1.3 (1-RTT) is the modern default; 1.2 still common; older deprecated", "Cert chain: leaf → intermediate → trusted root in the client's store", "SNI lets one IP serve many TLS sites", "mTLS = both sides present certs; great with automated lifecycle"],
  },
  "networking:t3:websockets": {
    nodeId: "networking:t3:websockets", title: "WebSockets",
    sections: [
      { heading: "Upgrade Handshake", body: "Client sends HTTP request with `Connection: Upgrade` and `Upgrade: websocket` headers. Server returns `101 Switching Protocols`. From there, the same TCP connection carries framed binary or text messages full-duplex. Used for chat, real-time dashboards, collab tools, live notifications." },
      { heading: "Framing And Backpressure", body: "Messages are framed — small headers wrap each chunk. Both ends can send any time. Browsers expose simple onmessage / send APIs. Real-world concerns: backpressure (consumer can't keep up — message buffer grows), heartbeats (detect dead connections), and reconnection logic (with exponential backoff and jitter)." },
      { heading: "WebSockets vs SSE vs Polling", body: "Server-sent events (SSE): one-way server→client over plain HTTP, simpler, often enough. WebSockets: full-duplex, more setup. Long-polling: legacy fallback. HTTP/2 server-push exists but is largely deprecated. Pick WebSockets only when you need bidirectional; SSE handles 90% of 'live updates from server' cases more simply." },
    ],
    codeExamples: [
      { title: "Browser client", code: `const ws = new WebSocket("wss://example.com/chat");

ws.onopen    = () => ws.send(JSON.stringify({ type: "hello" }));
ws.onmessage = (e) => console.log("recv", e.data);
ws.onclose   = () => console.log("closed");
ws.onerror   = (e) => console.log("error", e);

// wss:// = TLS-encrypted; same origin rules as HTTPS.
// Always use wss:// in production.`, explanation: "Browser API is small. The server side does most of the heavy lifting (auth, routing, presence)." },
      { title: "Server upgrade (Node)", code: `import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws, req) => {
  ws.on("message", (data) => {
    // echo back; in real apps, route/persist
    ws.send(\`echo: \${data}\`);
  });

  // heartbeat
  const ping = setInterval(() => ws.ping(), 30_000);
  ws.on("close", () => clearInterval(ping));
});`, explanation: "ws library handles the upgrade handshake. Heartbeats catch dead TCP connections that look alive." },
      { title: "Pick by direction", code: `# Server → Client only (live tickers, log streams, notifications)
#   → Server-Sent Events (text/event-stream over HTTP)
#   → Auto-reconnect, very simple, plays nice with infrastructure
#
# Bidirectional (chat, collab cursor, multiplayer game)
#   → WebSocket
#
# Server → Server notifications
#   → Webhooks (HTTP POST callbacks)
#
# Polling on a timer
#   → Last-resort fallback; simple but wasteful`, explanation: "Bidirectional needs WebSockets; one-way often doesn't. Don't reach for the heavier tool by default." },
    ],
    keyTakeaways: ["WebSocket = HTTP Upgrade → full-duplex framed messages over TCP", "SSE is simpler for one-way server→client", "Always use wss:// in production", "Heartbeats catch silently-dead TCP connections", "Reconnect with exponential backoff + jitter"],
  },
  "networking:t3:sockets": {
    nodeId: "networking:t3:sockets", title: "Sockets",
    sections: [
      { heading: "BSD Sockets API", body: "The OS API for TCP/UDP. Server flow: socket → bind → listen → accept (returns a connected socket). Client flow: socket → connect. Read/write bytes. Higher-level libraries (asyncio, libuv, Netty, Tokio) wrap this — but understanding the underlying model helps when things go wrong (slow accept queues, half-closed connections, broken pipes)." },
      { heading: "Blocking vs Non-Blocking", body: "Blocking sockets pause the thread until data is ready. One thread per connection scales poorly past low thousands (the C10K problem). Non-blocking returns immediately if there's no data; you poll many sockets at once with select / poll / epoll (Linux) / kqueue (BSD/macOS). All async runtimes are built on this." },
      { heading: "Common Pitfalls", body: "TIME_WAIT: socket lingers after close to catch stray packets — usually fine, can starve ephemeral ports under heavy short-lived connections. SO_REUSEADDR / SO_REUSEPORT for restart and load distribution. Nagle's algorithm coalesces small writes — disable with TCP_NODELAY for latency-critical apps. Receive buffer overflow drops packets silently if the consumer is slow." },
    ],
    codeExamples: [
      { title: "Tiny TCP echo server", code: `import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(("127.0.0.1", 9000))
s.listen()

while True:
    conn, addr = s.accept()
    try:
        data = conn.recv(4096)
        conn.sendall(b"echo: " + data)
    finally:
        conn.close()`, explanation: "One connection at a time, blocking. Fine for demos; doesn't scale." },
      { title: "Async with asyncio", code: `import asyncio

async def handle(reader, writer):
    data = await reader.read(4096)
    writer.write(b"echo: " + data)
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle, "127.0.0.1", 9000)
    async with server:
        await server.serve_forever()

asyncio.run(main())`, explanation: "Same shape, but thousands of concurrent connections via the event loop. asyncio uses epoll under the hood." },
      { title: "TCP_NODELAY for latency", code: `# Nagle's algorithm batches small writes — bad for chatty
# request/response over short messages (gaming, RPC).
#
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# Most modern HTTP/RPC libraries set this for you.
# If you're writing raw socket code and seeing 40-200ms latency
# spikes, suspect Nagle.`, explanation: "Nagle is great for bulk file transfer, terrible for many tiny writes." },
    ],
    keyTakeaways: ["Sockets = OS API for TCP/UDP; servers do socket/bind/listen/accept", "One thread per connection doesn't scale (C10K)", "epoll/kqueue + non-blocking sockets is what async runtimes do", "TCP_NODELAY disables Nagle — needed for chatty low-latency apps", "TIME_WAIT can starve ephemeral ports under bursty short connections"],
  },

  // ── T4 ──
  "networking:t4:protocols": {
    nodeId: "networking:t4:protocols", title: "Application Protocols",
    sections: [
      { heading: "gRPC", body: "HTTP/2 + Protocol Buffers (protobuf). Strongly typed, polyglot, fast. Service definitions in .proto files generate client and server stubs in many languages. Streaming variants (server-streaming, client-streaming, bidi). Great for service-to-service in heterogeneous stacks; awkward for browsers (gRPC-Web is a translation layer)." },
      { heading: "GraphQL", body: "Single endpoint; clients send queries describing exactly the fields they want. Avoids over-fetching and under-fetching of REST. Trade: server-side complexity (resolvers, N+1 management, query depth limits) and harder caching (no URL-based caching). Good for heterogeneous clients (web + mobile + third-party); often overkill for a single-client app." },
      { heading: "MQTT (And Friends)", body: "MQTT: lightweight pub/sub for constrained devices and intermittent connectivity. Tiny binary messages, QoS levels (0/1/2). Used heavily in IoT. Other niche choices: AMQP for enterprise messaging, STOMP for simple text-based pub/sub, NATS for fast in-cluster pub/sub. CoAP is HTTP-shaped but for constrained devices. Pick based on workload — REST is fine until it isn't." },
    ],
    codeExamples: [
      { title: "gRPC service shape", code: `// hello.proto
syntax = "proto3";
package hello;

service Greeter {
  rpc SayHello (HelloReq) returns (HelloResp);
  rpc SayHelloStream (HelloReq) returns (stream HelloResp);
}
message HelloReq  { string name = 1; }
message HelloResp { string message = 1; }`, explanation: "Schema in protobuf; client + server stubs generated for many languages. Strong typing, smaller wire format, multiplexing on HTTP/2." },
      { title: "GraphQL query", code: `# Single endpoint POST /graphql
# Body:
{
  "query": "query GetUser($id: ID!) {
    user(id: $id) {
      name
      posts(limit: 5) { title }
    }
  }",
  "variables": { "id": "1" }
}

# Response: only the fields you asked for
{
  "data": {
    "user": {
      "name": "Ada",
      "posts": [
        { "title": "Hello" },
        { "title": "More" }
      ]
    }
  }
}`, explanation: "Client picks the shape. No over-fetching. Server resolvers do the work." },
      { title: "MQTT for IoT", code: `# Devices publish to topics; brokers fan out to subscribers
#
# Sensor:    publish "home/livingroom/temp" -> 21.5
# Dashboard: subscribe "home/+/temp" (single-level wildcard)
#
# QoS levels:
# 0 — at most once (fire-and-forget; can lose)
# 1 — at least once (may duplicate; need idempotent subscribers)
# 2 — exactly once (slow; rarely worth it)
#
# Tiny payloads + persistent connection + intermittent connectivity
# = MQTT's sweet spot. Mosquitto, EMQX are common brokers.`, explanation: "Each protocol fits a workload. Reach for the niche tool only when REST doesn't fit." },
    ],
    keyTakeaways: ["gRPC: HTTP/2 + protobuf; strong types, fast, polyglot", "GraphQL: client picks fields; one endpoint; harder caching", "MQTT: lightweight pub/sub for IoT; QoS levels 0/1/2", "REST is fine — only switch when you need the trade-offs", "Each protocol fits a workload; don't pick by hype"],
  },
  "networking:t4:cdn-routing": {
    nodeId: "networking:t4:cdn-routing", title: "Anycast & Routing",
    sections: [
      { heading: "Anycast", body: "Multiple geographically distributed servers share the same IP address. BGP routes each request to the topologically nearest one. CDNs and DNS roots use anycast — predictable single IP, automatic geo-locality, inherent redundancy. The same IP doesn't change when failover happens; routing handles it." },
      { heading: "BGP Basics", body: "Border Gateway Protocol distributes routing information between Autonomous Systems (ASes — networks owned by ISPs, cloud providers, big companies). Each AS announces which IP prefixes it can reach. Routers pick paths based on policy and shortest AS-path. The internet is held together by BGP." },
      { heading: "BGP Hijacks And RPKI", body: "BGP trusts announcements by default. Misconfigured (or malicious) ASes have announced prefixes they shouldn't — Pakistan Telecom famously took YouTube global offline in 2008 by leaking a route. RPKI (Resource Public Key Infrastructure) cryptographically validates that an AS is authorized to announce a prefix; routers reject invalid announcements. Adoption is slowly improving but uneven across networks." },
    ],
    codeExamples: [
      { title: "Anycast in practice", code: `# Cloudflare's 1.1.1.1 DNS resolver lives at one IP.
# Your packets to 1.1.1.1 hit whichever PoP is closest —
# possibly a different physical server in a different country
# from the next person's.
#
# Effects:
# - Lower latency (you reach the closest PoP)
# - Inherent redundancy (a PoP failing reroutes via BGP)
# - Same IP doesn't change on failover — clients don't care
#
# Same idea: most CDN public IPs, AWS Global Accelerator,
# DNS root servers (a.root-servers.net is many machines).`, explanation: "One IP, many locations, BGP picks the closest. Operationally simple from the client's view." },
      { title: "BGP hijack mechanics", code: `# Normal:
#   AS 15169 (Google) announces 8.8.8.0/24
#   Other ASes accept and route Google traffic correctly.
#
# Hijack:
#   A misconfigured/malicious AS announces 8.8.8.0/24
#   Some ASes accept it; their traffic for Google now goes to
#   the hijacker.
#
# More-specific prefix beats less-specific: announcing
# 8.8.8.0/25 (smaller, more specific) overrides 8.8.8.0/24
# in routers that accept both.
#
# Real incidents: 2008 Pakistan Telecom / YouTube;
# multiple repeats since.`, explanation: "BGP's trust model is fragile. RPKI is the cryptographic fix; adoption is incomplete." },
      { title: "RPKI sketch", code: `# Resource holders sign Route Origin Authorizations (ROAs):
# 'AS 15169 is authorized to originate 8.8.8.0/24'
#
# Routers (with RPKI validation enabled) reject announcements
# that don't have a matching ROA — invalid origin.
#
# Status: most large ASes now validate; smaller ASes don't all
# yet. RPKI has prevented several hijack incidents that used
# to take hours to mitigate.`, explanation: "Cryptographic validation of routing. Slow rollout but increasingly meaningful." },
    ],
    keyTakeaways: ["Anycast: same IP from many places; BGP picks the closest", "BGP distributes routing info between ASes — the internet's glue", "BGP hijacks are real — trust model is announcement-based", "RPKI cryptographically validates origin; adoption slowly improving", "CDNs and DNS roots heavily use anycast for resilience and locality"],
  },
};
