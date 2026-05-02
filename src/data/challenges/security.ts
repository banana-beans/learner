import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "design", isBoss: false, starterCode: "", tags: ["security"], lang: "manual", ...partial });

export const securityChallenges: Challenge[] = [
  m({ id: "sec-cia-1", nodeId: "security:t1:cia", title: "Map a threat to CIA", description: "Eavesdropping on network traffic — which CIA leg?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Reading without modifying.", xpPenalty: 0.9 },
      { tier: "guide", text: "First leg of CIA.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Confidentiality. Mitigation: TLS in transit; encryption at rest.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "sec-auth-1", nodeId: "security:t1:auth-basics", title: "AuthN vs AuthZ classify", description: "User logged in but accesses someone else's data — what failed?", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "They're authenticated.", xpPenalty: 0.9 },
      { tier: "guide", text: "What they were allowed to do.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Authorization (AuthZ). The user is authenticated but the system didn't enforce 'can this user access this resource?'.`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sec-owasp-1", nodeId: "security:t2:owasp", title: "Top of OWASP", description: "What's typically #1 on OWASP Top 10?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Often more dangerous than injection.", xpPenalty: 0.9 },
      { tier: "guide", text: "Authorization-related.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Broken Access Control — letting users do or see things they shouldn't.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "sec-xss-1", nodeId: "security:t2:xss", title: "Pick the XSS flavor", description: "Attacker submits a comment with <script>; victims see the page later — which flavor?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Persisted in the DB.", xpPenalty: 0.9 },
      { tier: "guide", text: "Other flavors are reflected and DOM-based.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Stored XSS. Defense: output-encode all user content; CSP as backstop; framework defaults (React) avoid it.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "sec-sqli-1", nodeId: "security:t2:sql-injection", title: "Identify the fix", description: "Vulnerable: f\"SELECT * FROM users WHERE name = '{name}'\". The fix?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Don't concatenate.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use placeholders.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Parameterized query: db.execute("SELECT * FROM users WHERE name = ?", (name,)). The driver binds 'name' as data, not SQL.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "sec-crypto-1", nodeId: "security:t3:crypto-basics", title: "Pick the right tool", description: "Storing user passwords — what algorithm?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "SHA is too fast.", xpPenalty: 0.9 },
      { tier: "guide", text: "Slow, salted, work-factor-tunable.", xpPenalty: 0.75 },
      { tier: "reveal", text: `bcrypt or argon2. Both slow and salted; argon2 is the modern recommendation.`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sec-tls-1", nodeId: "security:t3:tls-pki", title: "Cert chain order", description: "What does the server send during TLS handshake?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Not the root.", xpPenalty: 0.9 },
      { tier: "guide", text: "Leaf + intermediates.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Leaf cert + intermediate(s). Client uses pre-installed root CAs to verify.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "sec-secret-1", nodeId: "security:t4:secrets", title: "Where to keep API keys", description: "Where should production API keys live?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Not in code or repos.", xpPenalty: 0.9 },
      { tier: "guide", text: "Platform-managed.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Secret manager (AWS Secrets Manager, Vault, etc.) or env vars injected by the platform. Never in source.`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "sec-tm-1", nodeId: "security:t4:threat-modeling", title: "STRIDE for upload endpoint", description: "Pick mitigations for /api/upload — list one per STRIDE letter.", difficulty: 3, isBoss: true,
    hints: [
      { tier: "nudge", text: "Six categories.", xpPenalty: 0.9 },
      { tier: "guide", text: "S T R I D E — one mitigation per.", xpPenalty: 0.75 },
      { tier: "reveal", text: `S: AuthN (JWT/session)
T: TLS in transit; signed payloads
R: audit log of who uploaded what
I: strip EXIF, ACLs on stored files
D: size + rate limits
E: validate file type, scan for malware`, xpPenalty: 0.5 },
    ], baseXP: 250 }),
];
