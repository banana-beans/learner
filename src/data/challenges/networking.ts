import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "predict_output", isBoss: false, starterCode: "", tags: ["networking"], lang: "manual", ...partial });

export const networkingChallenges: Challenge[] = [
  m({ id: "net-osi-1", nodeId: "networking:t1:osi", title: "Layer of HTTP", description: "Which OSI layer does HTTP live at?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Above transport.", xpPenalty: 0.9 },
      { tier: "guide", text: "Application layer.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Layer 7 — Application.`, xpPenalty: 0.5 },
    ], baseXP: 80 }),
  m({ id: "net-tcp-1", nodeId: "networking:t1:tcp-ip", title: "Pick the protocol", description: "DNS query: TCP or UDP?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "DNS queries fit in a packet.", xpPenalty: 0.9 },
      { tier: "guide", text: "Connection setup overhead matters.", xpPenalty: 0.75 },
      { tier: "reveal", text: `UDP — small, single-packet queries don't need TCP's reliability machinery (TCP is also used for large responses or AXFR).`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "net-dns-1", nodeId: "networking:t2:dns", title: "Apex CNAME problem", description: "Why can't you set a CNAME on example.com (the apex)?", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "DNS spec forbids CNAME alongside other records.", xpPenalty: 0.9 },
      { tier: "guide", text: "Apex needs SOA / NS records — CNAME would conflict.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Apex must have SOA + NS records; CNAME at apex would coexist with them, which RFC 1034 forbids.

Workaround: ALIAS / ANAME / flattened CNAME (provider-specific) — they resolve to A/AAAA records dynamically.`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "net-http-1", nodeId: "networking:t2:http", title: "304 Not Modified", description: "What's the request that gets a 304 back?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Conditional GET.", xpPenalty: 0.9 },
      { tier: "guide", text: "ETag + If-None-Match.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Client sends If-None-Match: "v123". Server responds 304 (no body) if the resource still has that ETag — saves bandwidth.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "net-tls-1", nodeId: "networking:t3:tls", title: "Cert chain order", description: "Server presents which certs in the TLS handshake?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Leaf and intermediates, but not the root.", xpPenalty: 0.9 },
      { tier: "guide", text: "Root is in the client's trust store.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Server sends leaf + intermediate(s). Client uses its pre-installed root CAs to verify the chain.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "net-ws-1", nodeId: "networking:t3:websockets", title: "Upgrade handshake", description: "What HTTP status does the server return to switch to WebSocket?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Switching protocols.", xpPenalty: 0.9 },
      { tier: "guide", text: "1xx informational range.", xpPenalty: 0.75 },
      { tier: "reveal", text: `101 Switching Protocols.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "net-sock-1", nodeId: "networking:t3:sockets", title: "Server socket sequence", description: "What's the call sequence to accept a TCP connection?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Four calls.", xpPenalty: 0.9 },
      { tier: "guide", text: "socket → bind → listen → accept.", xpPenalty: 0.75 },
      { tier: "reveal", text: `socket() → bind() → listen() → accept()`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "net-proto-1", nodeId: "networking:t4:protocols", title: "Pick the protocol — IoT", description: "Constrained device, intermittent network — pick gRPC, GraphQL, or MQTT.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Tiny payloads matter.", xpPenalty: 0.9 },
      { tier: "guide", text: "Pub/sub fits intermittent connectivity.", xpPenalty: 0.75 },
      { tier: "reveal", text: `MQTT — designed for low-bandwidth, intermittent connectivity. Pub/sub model + small overhead.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "net-bgp-1", nodeId: "networking:t4:cdn-routing", title: "Anycast benefit", description: "Why does Cloudflare 1.1.1.1 use anycast?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Same IP from many places.", xpPenalty: 0.9 },
      { tier: "guide", text: "Closer = lower latency.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Anycast routes each user's packets to the nearest PoP via BGP — lower latency, automatic failover, single advertised IP.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
];
