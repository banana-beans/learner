import type { LessonContent } from "./python-basics";

export const networkingLessons: Record<string, LessonContent> = {
  "networking:t1:osi": {
    nodeId: "networking:t1:osi", title: "OSI Model",
    sections: [
      { heading: "Seven Layers", body: "Physical (cables, radio), Data Link (Ethernet, Wi-Fi MAC), Network (IP), Transport (TCP/UDP), Session, Presentation, Application (HTTP, DNS). The lower layers carry the upper. In practice TCP/IP collapses some — but the layering mental model is useful." },
      { heading: "Why Layers Help", body: "Each layer hides the layers below. App code uses HTTP without knowing TCP details; TCP works without knowing whether it's over Ethernet or Wi-Fi. Debug by descending: app → transport → network → link." },
    ],
    codeExamples: [
      { title: "Where things live", code: `# Layer 7 (App): HTTP, DNS, SMTP, gRPC
# Layer 4 (Transport): TCP, UDP, QUIC
# Layer 3 (Network): IP, ICMP
# Layer 2 (Data Link): Ethernet, Wi-Fi 802.11
# Layer 1 (Physical): cables, radio, fiber`, explanation: "Knowing which layer something lives at points to which tool to debug it." },
      { title: "Debug by descending", code: `# Can't reach the API?
# 1. App: HTTP returns 5xx? Look at app logs.
# 2. Transport: connect timeout? Check listener, port, firewall.
# 3. Network: can you ping the host? Routing/IP issue.
# 4. Link: is the cable plugged in / wifi up?`, explanation: "Walk down the layers — the bug is at one of them." },
    ],
    keyTakeaways: ["7 layers, but TCP/IP often collapses some", "Each layer hides the ones below", "Debug by descending: app → transport → network → link", "Layer numbers help find the right tool: ping is L3, traceroute too"],
  },
  "networking:t1:tcp-ip": {
    nodeId: "networking:t1:tcp-ip", title: "TCP / IP",
    sections: [
      { heading: "TCP vs UDP", body: "TCP is reliable, ordered, connection-based. UDP is fire-and-forget. HTTP/1.1, HTTP/2 ride TCP. HTTP/3 (QUIC) rides UDP — same reliability, faster handshake, no head-of-line blocking. DNS, video calls, gaming use UDP." },
      { heading: "Three-Way Handshake", body: "Client → SYN → Server → SYN-ACK → Client → ACK → connected. Adds 1 round-trip before data flows. TLS adds another — TLS 1.3 cuts it by combining steps. QUIC fuses TCP handshake + TLS into one." },
    ],
    codeExamples: [
      { title: "Pick the protocol", code: `# Reliability + order required: TCP / HTTP
# Low latency, can lose packets: UDP / QUIC / RTP
# DNS query: UDP (fits in one packet)
# Streaming a movie: usually TCP (HLS/DASH); WebRTC uses UDP`, explanation: "Match protocol to application requirements." },
      { title: "Handshake cost", code: `# Cold connection cost
# TCP: 1 RTT
# TCP + TLS 1.2: 3 RTTs total
# TCP + TLS 1.3: 2 RTTs total
# QUIC + TLS 1.3: 1 RTT total
# 0-RTT resumption: 0 RTT (with replay risk)`, explanation: "RTTs add up across many small requests. Connection reuse and HTTP/2/3 help." },
    ],
    keyTakeaways: ["TCP: reliable, ordered. UDP: fast, unreliable", "QUIC = UDP-based reliable transport, basis of HTTP/3", "TCP handshake = 1 RTT; TLS adds another (less in 1.3)", "Reuse connections — handshakes are expensive"],
  },
  "networking:t2:dns": {
    nodeId: "networking:t2:dns", title: "DNS",
    sections: [
      { heading: "Resolution", body: "Browser asks resolver for example.com → resolver asks root → .com → example.com authoritative server. Each level returns the next. Cached at every level. TTLs control how long each cache holds." },
      { heading: "Record Types", body: "A (IPv4), AAAA (IPv6), CNAME (alias to another name), MX (mail server), TXT (arbitrary, often SPF/DKIM/verification), NS (delegated nameservers). Use ALIAS / ANAME at apex to fake CNAME at root." },
    ],
    codeExamples: [
      { title: "dig examples", code: `# CLI: dig +short example.com A
# 93.184.216.34

# dig example.com MX
# 0 .

# dig example.com TXT
# "v=spf1 -all"`, explanation: "dig is the right tool for poking at DNS records." },
      { title: "TTL trade-off", code: `# Short TTL (60s)   = quick failover, but more queries
# Long TTL (24h)    = fewer queries, but slow to flip
# Strategy: long TTLs normally; pre-stage shorten before changes`, explanation: "TTL is the trade between query load and propagation speed." },
    ],
    keyTakeaways: ["Resolution: resolver → root → TLD → authoritative", "TTLs control how long each level caches", "A/AAAA for IPs; CNAME for aliases; TXT for verification", "Long TTLs normally; shorten in advance of cutovers"],
  },
  "networking:t2:http": {
    nodeId: "networking:t2:http", title: "HTTP & HTTPS",
    sections: [
      { heading: "Versions", body: "HTTP/1.1: text-based, one request per connection. HTTP/2: binary, multiplexed (many requests per connection), header compression. HTTP/3: HTTP/2 over QUIC (UDP) — eliminates head-of-line blocking when packets are lost." },
      { heading: "Anatomy", body: "Request: method + path + headers + (optional) body. Response: status + headers + (optional) body. Headers carry caching (Cache-Control), auth (Authorization), content (Content-Type), correlation (X-Request-Id)." },
    ],
    codeExamples: [
      { title: "Raw HTTP/1.1", code: `GET /api/users/1 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer xyz

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{"id":1,"name":"Ada"}`, explanation: "Text protocol — handy for understanding, not what you read in production." },
      { title: "Useful headers", code: `# Caching
# Cache-Control: public, max-age=60
# ETag: "v123"
# If-None-Match: "v123"   → 304 Not Modified

# Auth
# Authorization: Bearer <jwt>

# Tracing
# X-Request-Id: abc123
# Traceparent: 00-trace-span-01`, explanation: "Headers shape caching, auth, observability. Worth memorizing the basics." },
    ],
    keyTakeaways: ["HTTP/1.1 text; HTTP/2 binary multiplexed; HTTP/3 over QUIC", "Method + path + headers + body — both directions", "Cache-Control, ETag drive HTTP caching", "Authorization, X-Request-Id are lifelines for debugging"],
  },
  "networking:t3:tls": {
    nodeId: "networking:t3:tls", title: "TLS & Certificates",
    sections: [
      { heading: "What TLS Provides", body: "Confidentiality (encryption), integrity (tamper detection), authentication (server identity, optionally client). The handshake negotiates a session key; data flows encrypted with symmetric crypto." },
      { heading: "Cert Chains", body: "Server presents a leaf cert + intermediate certs. Client trusts a root CA pre-installed in the OS/browser. The chain links leaf → intermediate → root. mTLS (mutual TLS) adds client cert presentation — common in service-to-service auth." },
    ],
    codeExamples: [
      { title: "Cert chain", code: `# Inspect a cert chain
# openssl s_client -showcerts -connect example.com:443

# Leaf:        CN=example.com, signed by Let's Encrypt R3
# Intermediate: CN=R3, signed by ISRG Root X1
# Root:         CN=ISRG Root X1, self-signed (in trust store)`, explanation: "Trust flows top-down through the chain." },
      { title: "SNI", code: `# One IP can host many sites with different certs.
# Client sends Server Name Indication (SNI) in TLS hello;
# server picks the right cert based on hostname.
# Required for shared hosting / CDNs.`, explanation: "SNI is what makes virtual hosting work over TLS." },
    ],
    keyTakeaways: ["TLS = confidentiality + integrity + auth", "Cert chain: leaf → intermediate → trusted root", "SNI lets one IP serve many TLS sites", "mTLS = both sides present certs (service auth)"],
  },
  "networking:t3:websockets": {
    nodeId: "networking:t3:websockets", title: "WebSockets",
    sections: [
      { heading: "Upgrade Handshake", body: "Client sends HTTP request with Upgrade: websocket. Server returns 101 Switching Protocols. From there, both sides send framed messages full-duplex. Used for chat, real-time dashboards, collab." },
      { heading: "WebSockets vs SSE vs Polling", body: "Server-sent events (SSE): one-way server→client over HTTP, simpler, often enough. WebSockets: full-duplex, more setup. Long-polling: legacy fallback. Pick the simplest that works." },
    ],
    codeExamples: [
      { title: "Browser client", code: `const ws = new WebSocket("wss://example.com/chat");
ws.onopen = () => ws.send(JSON.stringify({ type: "hello" }));
ws.onmessage = (e) => console.log("msg:", e.data);
ws.onclose = () => console.log("closed");`, explanation: "wss:// = TLS-encrypted WebSocket. Same origin rules as HTTPS." },
      { title: "Pick by direction", code: `# Server → Client only (live tickers, log streams)
#   → Server-Sent Events (text/event-stream over HTTP)
#
# Bidirectional (chat, collab cursor):
#   → WebSocket
#
# Already RESTful, just want notification?
#   → Webhook (server → server)`, explanation: "Bidirectional needs WebSockets; one-way often doesn't." },
    ],
    keyTakeaways: ["WebSocket = HTTP Upgrade → full-duplex framed messages", "SSE is simpler for one-way server→client", "Long-polling is fallback only", "wss:// for production (TLS)"],
  },
  "networking:t3:sockets": {
    nodeId: "networking:t3:sockets", title: "Sockets",
    sections: [
      { heading: "BSD Sockets", body: "The OS API for TCP/UDP. Server: socket → bind → listen → accept. Client: socket → connect. Read/write bytes. Higher-level libraries (asyncio, libuv) wrap this — but knowing the model helps when things go wrong." },
      { heading: "Blocking vs Non-Blocking", body: "Blocking sockets pause the thread until data arrives. Non-blocking return immediately, requiring polling (select, epoll, kqueue) or async I/O. The whole 'C10K problem' is about scaling past blocking-per-connection." },
    ],
    codeExamples: [
      { title: "Tiny TCP echo server", code: `import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(("127.0.0.1", 9000))
s.listen()
conn, addr = s.accept()
data = conn.recv(1024)
conn.sendall(b"echo: " + data)
conn.close()
s.close()`, explanation: "Classic socket server. One connection at a time — blocking." },
      { title: "Async with asyncio", code: `import asyncio

async def handle(reader, writer):
    data = await reader.read(1024)
    writer.write(b"echo: " + data)
    await writer.drain()
    writer.close()

async def main():
    server = await asyncio.start_server(handle, "127.0.0.1", 9000)
    async with server: await server.serve_forever()

# asyncio.run(main())`, explanation: "Same shape, but thousands of concurrent connections via the event loop." },
    ],
    keyTakeaways: ["Sockets = OS API for TCP/UDP", "Server: socket/bind/listen/accept; Client: socket/connect", "Blocking sockets don't scale — use async or thread pools", "asyncio / libuv / Netty wrap the polling for you"],
  },
  "networking:t4:protocols": {
    nodeId: "networking:t4:protocols", title: "Application Protocols",
    sections: [
      { heading: "gRPC, GraphQL, MQTT", body: "gRPC: HTTP/2 + protobuf, fast and strongly typed, polyglot. GraphQL: client picks fields, single endpoint, great for heterogeneous clients. MQTT: tiny pub/sub for IoT and constrained devices." },
      { heading: "When To Pick What", body: "Service-to-service in a polyglot stack: gRPC. Public API for many client types: GraphQL or REST. Constrained/embedded: MQTT. Internal admin tools: REST is usually plenty." },
    ],
    codeExamples: [
      { title: "gRPC service shape", code: `// hello.proto
syntax = "proto3";
service Greeter {
  rpc SayHello (HelloReq) returns (HelloResp);
}
message HelloReq { string name = 1; }
message HelloResp { string message = 1; }`, explanation: "Schema in protobuf; client + server stubs generated for many languages." },
      { title: "GraphQL query", code: `query {
  user(id: "1") {
    name
    posts(limit: 5) {
      title
    }
  }
}`, explanation: "Single endpoint; client picks the shape. No over-fetching." },
    ],
    keyTakeaways: ["gRPC: HTTP/2 + protobuf, fast, strongly typed", "GraphQL: client picks fields, one endpoint", "MQTT: tiny pub/sub for IoT", "REST is fine — only switch when you need the trade-offs"],
  },
  "networking:t4:cdn-routing": {
    nodeId: "networking:t4:cdn-routing", title: "Anycast & Routing",
    sections: [
      { heading: "Anycast", body: "Multiple geographically distributed nodes share the same IP. BGP routing sends each request to the nearest node. CDNs and DNS roots use anycast — predictable single IP, automatic geo-locality." },
      { heading: "BGP Basics", body: "Border Gateway Protocol distributes routing info between autonomous systems. Each AS announces which IP prefixes it can reach. Hijacks happen when a malicious AS announces prefixes it shouldn't — RPKI mitigates." },
    ],
    codeExamples: [
      { title: "Anycast in practice", code: `# Cloudflare's 1.1.1.1 DNS resolver lives at one IP — but your packets
# hit whichever PoP is closest. The same IP, served from many locations.
#
# Effects:
# - Lower latency
# - Inherent redundancy
# - Same IP doesn't change when failover happens`, explanation: "One IP, many locations, BGP picks the closest." },
      { title: "BGP hijack", code: `# A misconfigured (or malicious) AS announces 8.8.8.0/24
# Other ASes accept the announcement, route Google traffic to the hijacker
# 2008 YouTube/Pakistan Telecom incident is the canonical example
# Mitigation: RPKI signs announcements; routers reject unsigned/invalid`, explanation: "BGP trusts announcements by default. RPKI cryptographically validates them." },
    ],
    keyTakeaways: ["Anycast = same IP from many places", "BGP distributes routing info between ASes", "BGP hijacks are a real risk — RPKI reduces them", "CDNs and DNS heavily use anycast"],
  },
};
