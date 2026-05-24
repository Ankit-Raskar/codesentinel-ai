// Realistic preloaded demo data so recruiters / visitors can explore
// CodeSentinel without connecting GitHub.

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface DemoIssue {
  id: string;
  severity: Severity;
  category: "security" | "performance" | "bug" | "style" | "architecture";
  title: string;
  file: string;
  line: number;
  snippet: string;
  fix: string;
  explanation: string;
  confidence: number; // 0-100
}

export interface DemoPR {
  id: string;
  number: number;
  title: string;
  author: string;
  branch: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  openedAt: string;
  status: "reviewing" | "ready" | "risky" | "approved";
  mergeSafety: number;
  securityScore: number;
  performanceScore: number;
  qualityScore: number;
  aiConfidence: number;
  summary: string;
  issues: DemoIssue[];
}

export interface DemoRepo {
  id: string;
  name: string;
  owner: string;
  language: string;
  stars: number;
  riskScore: number; // 0-100
  health: number; // 0-100
  openPRs: number;
  vulnerabilities: number;
  lastScan: string;
  prs: DemoPR[];
}

export const DEMO_REPOS: DemoRepo[] = [
  {
    id: "r1",
    name: "vulnerable-auth-api",
    owner: "acme",
    language: "TypeScript",
    stars: 1843,
    riskScore: 82,
    health: 34,
    openPRs: 5,
    vulnerabilities: 12,
    lastScan: "2m ago",
    prs: [
      {
        id: "pr-101",
        number: 248,
        title: "feat(auth): add password reset flow",
        author: "marina.k",
        branch: "feat/password-reset",
        additions: 312,
        deletions: 47,
        filesChanged: 9,
        openedAt: "12m ago",
        status: "risky",
        mergeSafety: 41,
        securityScore: 38,
        performanceScore: 78,
        qualityScore: 64,
        aiConfidence: 94,
        summary:
          "Introduces password-reset endpoint and token storage. Two critical security issues block merge: an unparameterized SQL query in token lookup, and the reset token is stored as plaintext. Recommend rotating to argon2id and parameterized queries before merge.",
        issues: [
          {
            id: "i-1",
            severity: "critical",
            category: "security",
            title: "SQL injection in token lookup",
            file: "src/routes/auth/reset.ts",
            line: 42,
            snippet: `const q = \`SELECT * FROM tokens WHERE token='\${req.body.token}'\`;\nconst r = await db.query(q);`,
            fix: `const r = await db.query(\n  "SELECT * FROM tokens WHERE token = $1",\n  [req.body.token]\n);`,
            explanation:
              "User-controlled input is interpolated directly into the SQL string. An attacker can pass `' OR 1=1 --` to bypass the lookup. Use parameterized queries.",
            confidence: 99,
          },
          {
            id: "i-2",
            severity: "critical",
            category: "security",
            title: "Reset token stored in plaintext",
            file: "src/services/tokens.ts",
            line: 18,
            snippet: `await db.tokens.insert({ user_id, token: rawToken });`,
            fix: `const hash = await argon2.hash(rawToken);\nawait db.tokens.insert({ user_id, token_hash: hash });`,
            explanation:
              "Storing tokens in plaintext means any DB read (backup, log, breach) leaks live reset codes. Hash with argon2id and compare on verification.",
            confidence: 97,
          },
          {
            id: "i-3",
            severity: "high",
            category: "security",
            title: "Missing rate limit on /reset",
            file: "src/routes/auth/reset.ts",
            line: 12,
            snippet: `router.post('/reset', resetHandler);`,
            fix: `router.post('/reset', rateLimit({ windowMs: 60_000, max: 5 }), resetHandler);`,
            explanation:
              "Reset endpoints are a common enumeration and brute-force surface. Apply a per-IP and per-account rate limit.",
            confidence: 92,
          },
          {
            id: "i-4",
            severity: "medium",
            category: "performance",
            title: "N+1 query loading user sessions",
            file: "src/services/sessions.ts",
            line: 67,
            snippet: `for (const u of users) {\n  u.sessions = await db.sessions.where({ user_id: u.id });\n}`,
            fix: `const ids = users.map(u => u.id);\nconst sessions = await db.sessions.whereIn('user_id', ids);\n// then group in memory`,
            explanation:
              "Each user triggers a separate query. At 200 users this is 201 round trips. Batch with whereIn and group in memory.",
            confidence: 90,
          },
        ],
      },
      {
        id: "pr-102",
        number: 249,
        title: "chore(deps): bump jsonwebtoken to 9.x",
        author: "dev.bot",
        branch: "chore/jwt-bump",
        additions: 14,
        deletions: 12,
        filesChanged: 2,
        openedAt: "1h ago",
        status: "approved",
        mergeSafety: 96,
        securityScore: 98,
        performanceScore: 92,
        qualityScore: 88,
        aiConfidence: 99,
        summary:
          "Patches CVE-2022-23541 by upgrading jsonwebtoken. No breaking API changes detected in current call sites. Safe to merge.",
        issues: [],
      },
    ],
  },
  {
    id: "r2",
    name: "legacy-payment-service",
    owner: "acme",
    language: "Go",
    stars: 412,
    riskScore: 67,
    health: 58,
    openPRs: 3,
    vulnerabilities: 6,
    lastScan: "8m ago",
    prs: [
      {
        id: "pr-201",
        number: 1184,
        title: "refactor: extract Stripe webhook handler",
        author: "jules.t",
        branch: "refactor/webhook",
        additions: 421,
        deletions: 388,
        filesChanged: 14,
        openedAt: "3h ago",
        status: "reviewing",
        mergeSafety: 72,
        securityScore: 81,
        performanceScore: 88,
        qualityScore: 76,
        aiConfidence: 91,
        summary:
          "Large refactor reducing duplication across three webhook entry points. Logic preserved per behavioral diff. One high-severity issue: signature verification is skipped on the test path and reachable in production.",
        issues: [
          {
            id: "i-5",
            severity: "high",
            category: "security",
            title: "Stripe signature verification can be bypassed",
            file: "internal/webhook/stripe.go",
            line: 88,
            snippet: `if os.Getenv("ENV") == "test" {\n    return handle(payload)\n}`,
            fix: `if os.Getenv("ENV") == "test" && os.Getenv("ALLOW_UNSIGNED") == "1" {\n    return handle(payload)\n}`,
            explanation:
              "The ENV value is also `test` in staging which is internet-reachable. Gate the bypass behind a second explicit env var.",
            confidence: 95,
          },
        ],
      },
    ],
  },
  {
    id: "r3",
    name: "ai-dashboard-client",
    owner: "acme",
    language: "TypeScript",
    stars: 2890,
    riskScore: 22,
    health: 89,
    openPRs: 7,
    vulnerabilities: 1,
    lastScan: "just now",
    prs: [
      {
        id: "pr-301",
        number: 612,
        title: "perf: virtualize repository list",
        author: "kenji.m",
        branch: "perf/virtual-list",
        additions: 184,
        deletions: 92,
        filesChanged: 4,
        openedAt: "30m ago",
        status: "ready",
        mergeSafety: 94,
        securityScore: 97,
        performanceScore: 99,
        qualityScore: 91,
        aiConfidence: 96,
        summary:
          "Replaces full list render with @tanstack/react-virtual. Measured 12x reduction in scroll jank at 5k rows. No behavior changes detected.",
        issues: [
          {
            id: "i-6",
            severity: "low",
            category: "style",
            title: "Magic number for row height",
            file: "src/components/RepoList.tsx",
            line: 24,
            snippet: `estimateSize: () => 64,`,
            fix: `const ROW_HEIGHT = 64;\n// ...\nestimateSize: () => ROW_HEIGHT,`,
            explanation: "Hoist to a named constant for clarity and reuse.",
            confidence: 80,
          },
        ],
      },
    ],
  },
  {
    id: "r4",
    name: "ecommerce-backend",
    owner: "acme",
    language: "Python",
    stars: 967,
    riskScore: 48,
    health: 71,
    openPRs: 4,
    vulnerabilities: 3,
    lastScan: "14m ago",
    prs: [
      {
        id: "pr-401",
        number: 882,
        title: "feat(checkout): apply promo codes server-side",
        author: "sara.l",
        branch: "feat/promo-server",
        additions: 256,
        deletions: 101,
        filesChanged: 7,
        openedAt: "2h ago",
        status: "reviewing",
        mergeSafety: 78,
        securityScore: 84,
        performanceScore: 86,
        qualityScore: 82,
        aiConfidence: 93,
        summary:
          "Moves promo-code validation from client to server. Closes a price-tampering vector. One medium issue: discount stacking is not rate-limited per cart.",
        issues: [
          {
            id: "i-7",
            severity: "medium",
            category: "bug",
            title: "Promo codes can be stacked without limit",
            file: "checkout/promos.py",
            line: 53,
            snippet: `for code in codes:\n    cart.apply(code)`,
            fix: `MAX_STACK = 3\nfor code in codes[:MAX_STACK]:\n    cart.apply(code)`,
            explanation:
              "Without a cap, a malicious client can submit thousands of valid codes and zero out the cart total.",
            confidence: 89,
          },
        ],
      },
    ],
  },
  {
    id: "r5",
    name: "internal-analytics-engine",
    owner: "acme",
    language: "Rust",
    stars: 318,
    riskScore: 54,
    health: 73,
    openPRs: 2,
    vulnerabilities: 4,
    lastScan: "5m ago",
    prs: [
      {
        id: "pr-501",
        number: 77,
        title: "feat(ingest): parallelize event sharding",
        author: "ravi.p",
        branch: "feat/shard-parallel",
        additions: 348,
        deletions: 124,
        filesChanged: 11,
        openedAt: "47m ago",
        status: "reviewing",
        mergeSafety: 68,
        securityScore: 89,
        performanceScore: 94,
        qualityScore: 81,
        aiConfidence: 92,
        summary:
          "Parallel sharding lifts ingest throughput from 42k to 138k events/s on a 16-core node. One high-severity race in the offset commit path requires an atomic CAS before merge.",
        issues: [
          {
            id: "i-8",
            severity: "high",
            category: "bug",
            title: "Race condition on shard offset commit",
            file: "src/ingest/shard.rs",
            line: 214,
            snippet: `let cur = offsets.get(&shard_id).copied().unwrap_or(0);\nif new > cur {\n    offsets.insert(shard_id, new);\n}`,
            fix: `offsets\n    .entry(shard_id)\n    .and_modify(|v| { if new > *v { *v = new; } })\n    .or_insert(new);`,
            explanation:
              "Read-then-write on a shared map is non-atomic. Under contention two workers can stomp each other and rewind the offset. Use the entry API for a single atomic op.",
            confidence: 96,
          },
          {
            id: "i-9",
            severity: "medium",
            category: "performance",
            title: "Unbounded channel can OOM under backpressure",
            file: "src/ingest/pipeline.rs",
            line: 58,
            snippet: `let (tx, rx) = mpsc::unbounded_channel();`,
            fix: `let (tx, rx) = mpsc::channel(8_192);`,
            explanation:
              "Unbounded channels grow without limit if consumers stall. A bounded channel applies backpressure and protects memory.",
            confidence: 88,
          },
        ],
      },
    ],
  },
  {
    id: "r6",
    name: "mobile-api-gateway",
    owner: "acme",
    language: "TypeScript",
    stars: 1124,
    riskScore: 71,
    health: 49,
    openPRs: 6,
    vulnerabilities: 9,
    lastScan: "3m ago",
    prs: [
      {
        id: "pr-601",
        number: 1402,
        title: "feat(gateway): JWT rotation + refresh flow",
        author: "alex.w",
        branch: "feat/jwt-rotation",
        additions: 287,
        deletions: 96,
        filesChanged: 8,
        openedAt: "22m ago",
        status: "risky",
        mergeSafety: 52,
        securityScore: 47,
        performanceScore: 84,
        qualityScore: 71,
        aiConfidence: 95,
        summary:
          "Implements refresh-token rotation but introduces a critical secret exposure: the signing key is logged in development middleware that is reachable in staging. Also missing audience validation on verify.",
        issues: [
          {
            id: "i-10",
            severity: "critical",
            category: "security",
            title: "JWT signing secret logged at startup",
            file: "src/gateway/jwt.ts",
            line: 19,
            snippet: `console.log('jwt secret loaded:', process.env.JWT_SECRET);`,
            fix: `console.log('jwt secret loaded:', process.env.JWT_SECRET ? '[redacted]' : 'MISSING');`,
            explanation:
              "Secrets in stdout flow to log aggregators, crash reporters, and CI artifacts. Never log the raw value — log only presence.",
            confidence: 99,
          },
          {
            id: "i-11",
            severity: "high",
            category: "security",
            title: "JWT verify skips audience claim",
            file: "src/gateway/jwt.ts",
            line: 71,
            snippet: `jwt.verify(token, secret, { algorithms: ['HS256'] });`,
            fix: `jwt.verify(token, secret, {\n  algorithms: ['HS256'],\n  audience: 'mobile-app',\n  issuer: 'auth.acme.io',\n});`,
            explanation:
              "Without audience/issuer checks, a token issued for any other service signed with the same key is accepted. Pin both.",
            confidence: 94,
          },
          {
            id: "i-12",
            severity: "medium",
            category: "bug",
            title: "Refresh token reuse not detected",
            file: "src/gateway/refresh.ts",
            line: 44,
            snippet: `const session = await db.sessions.find({ refresh: incoming });\nreturn issue(session.user_id);`,
            fix: `const session = await db.sessions.find({ refresh: incoming });\nif (session.used_at) { await revokeFamily(session.family_id); throw 401; }\nawait db.sessions.update(session.id, { used_at: now() });\nreturn issue(session.user_id);`,
            explanation:
              "Refresh tokens should be single-use. Detecting reuse is how you catch a stolen token and revoke the whole chain.",
            confidence: 91,
          },
        ],
      },
    ],
  },
];

export const DEMO_FEED_TEMPLATES = [
  { kind: "vuln", icon: "shield", text: "SQL injection blocked in {repo}/auth.ts" },
  { kind: "warn", icon: "alert", text: "Unsafe dependency lodash@4.17.20 flagged in {repo}" },
  { kind: "ok", icon: "check", text: "Merge safety raised to {n}% on {repo}#{pr}" },
  { kind: "perf", icon: "zap", text: "N+1 query collapsed in {repo}/orders.ts (-180ms)" },
  { kind: "shield", icon: "shield", text: "XSS sink sanitized in {repo}/render.tsx" },
  { kind: "ai", icon: "sparkles", text: "AI suggested 4 refactors on {repo}#{pr}" },
  { kind: "warn", icon: "alert", text: "Hardcoded secret detected in {repo}/.env.staging" },
  { kind: "ok", icon: "check", text: "PR {repo}#{pr} approved · 0 blocking issues" },
];

export const SCAN_STAGES = [
  { label: "Fetching pull request", detail: "git fetch origin pr/248/head", ms: 800 },
  { label: "Parsing changed files", detail: "9 files · 312 + / 47 −", ms: 700 },
  { label: "Running security analysis", detail: "OWASP top 10 · secret scan", ms: 1200 },
  { label: "Detecting performance bottlenecks", detail: "n+1 · blocking IO · re-renders", ms: 1000 },
  { label: "Reviewing architecture", detail: "module boundaries · coupling", ms: 900 },
  { label: "Checking dependencies", detail: "248 packages · 3 CVEs", ms: 800 },
  { label: "Calculating merge safety", detail: "weighted by severity · diff size", ms: 700 },
  { label: "Generating AI suggestions", detail: "Llama 3.3 70B · streamed", ms: 1100 },
  { label: "Review ready", detail: "12 findings · 2 critical", ms: 0 },
];

export function severityColor(s: Severity) {
  switch (s) {
    case "critical":
      return "text-rose-300 bg-rose-500/10 border-rose-500/25";
    case "high":
      return "text-amber-200 bg-amber-500/10 border-amber-500/25";
    case "medium":
      return "text-amber-100/90 bg-amber-500/[0.06] border-amber-500/20";
    case "low":
      return "text-emerald-200/90 bg-emerald-500/[0.06] border-emerald-500/20";
    default:
      return "text-muted-foreground bg-muted/20 border-border";
  }
}

// ───────────────────────────────────────────────────────────
// Additional repositories for "Load another demo repo"
// ───────────────────────────────────────────────────────────
DEMO_REPOS.push(
  {
    id: "r7",
    name: "realtime-chat-service",
    owner: "acme",
    language: "TypeScript",
    stars: 2104,
    riskScore: 58,
    health: 64,
    openPRs: 4,
    vulnerabilities: 5,
    lastScan: "1m ago",
    prs: [
      {
        id: "pr-701",
        number: 318,
        title: "perf(ws): backpressure on broadcast fanout",
        author: "emma.r",
        branch: "perf/ws-backpressure",
        additions: 198,
        deletions: 74,
        filesChanged: 6,
        openedAt: "9m ago",
        status: "reviewing",
        mergeSafety: 74,
        securityScore: 81,
        performanceScore: 93,
        qualityScore: 86,
        aiConfidence: 92,
        summary:
          "Adds bounded queue + drop-oldest policy to websocket broadcast. Reduces p99 fan-out latency by 62%. One high-severity issue: heartbeat token is reused across reconnects.",
        issues: [
          {
            id: "i-13",
            severity: "high",
            category: "security",
            title: "Heartbeat token reused across reconnects",
            file: "src/ws/heartbeat.ts",
            line: 56,
            snippet: `socket.on('reconnect', () => socket.emit('ping', cachedToken));`,
            fix: `socket.on('reconnect', async () => {\n  cachedToken = await mintToken(userId);\n  socket.emit('ping', cachedToken);\n});`,
            explanation:
              "Reusing the heartbeat token lets a hijacked session stay alive after revocation. Mint a fresh short-lived token on every reconnect.",
            confidence: 93,
          },
          {
            id: "i-14",
            severity: "medium",
            category: "performance",
            title: "Broadcast loop allocates per-frame",
            file: "src/ws/broadcast.ts",
            line: 88,
            snippet: `for (const c of clients) c.send(JSON.stringify(payload));`,
            fix: `const frame = JSON.stringify(payload);\nfor (const c of clients) c.send(frame);`,
            explanation:
              "Serializing inside the loop allocates O(n) buffers per broadcast. Hoist the frame.",
            confidence: 88,
          },
        ],
      },
    ],
  },
  {
    id: "r8",
    name: "fintech-transactions-api",
    owner: "acme",
    language: "Java",
    stars: 678,
    riskScore: 76,
    health: 41,
    openPRs: 5,
    vulnerabilities: 11,
    lastScan: "4m ago",
    prs: [
      {
        id: "pr-801",
        number: 992,
        title: "feat(ledger): idempotent transfer endpoint",
        author: "noah.s",
        branch: "feat/idempotent-transfer",
        additions: 384,
        deletions: 162,
        filesChanged: 10,
        openedAt: "18m ago",
        status: "risky",
        mergeSafety: 48,
        securityScore: 52,
        performanceScore: 79,
        qualityScore: 70,
        aiConfidence: 96,
        summary:
          "Adds idempotency keys to /transfer. Closes a double-charge vector but introduces a TOCTOU on balance check and a missing scope on the idempotency key.",
        issues: [
          {
            id: "i-15",
            severity: "critical",
            category: "bug",
            title: "TOCTOU on balance check before debit",
            file: "src/main/java/ledger/Transfer.java",
            line: 121,
            snippet: `if (account.balance >= amount) {\n  account.debit(amount);\n}`,
            fix: `int updated = db.update(\n  "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",\n  amount, account.id, amount);\nif (updated == 0) throw new InsufficientFunds();`,
            explanation:
              "Read-then-write on balance is racy under concurrent transfers. Use a conditional UPDATE so the DB enforces the invariant atomically.",
            confidence: 98,
          },
          {
            id: "i-16",
            severity: "high",
            category: "security",
            title: "Idempotency key not scoped to user",
            file: "src/main/java/ledger/Idempotency.java",
            line: 33,
            snippet: `cache.get("idem:" + key)`,
            fix: `cache.get("idem:" + userId + ":" + key)`,
            explanation:
              "Global idempotency keyspace lets a malicious caller replay another user's transfer outcome. Scope the key per user.",
            confidence: 95,
          },
        ],
      },
    ],
  },
);

// ───────────────────────────────────────────────────────────
// Randomized vulnerability pool — used on every Replay
// ───────────────────────────────────────────────────────────
export interface VulnTemplate {
  severity: Severity;
  category: DemoIssue["category"];
  title: string;
  file: string;
  snippet: string;
  fix: string;
  explanation: string;
}

export const VULN_TEMPLATES: VulnTemplate[] = [
  {
    severity: "critical",
    category: "security",
    title: "SQL injection in dynamic query",
    file: "src/db/query.ts",
    snippet: `db.query(\`SELECT * FROM users WHERE email='\${email}'\`)`,
    fix: `db.query("SELECT * FROM users WHERE email = $1", [email])`,
    explanation: "User input is concatenated into SQL. Use parameterized queries.",
  },
  {
    severity: "high",
    category: "security",
    title: "XSS sink renders unsanitized HTML",
    file: "src/components/Markdown.tsx",
    snippet: `<div dangerouslySetInnerHTML={{ __html: input }} />`,
    fix: `<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(input) }} />`,
    explanation: "Untrusted input flows into innerHTML. Sanitize with DOMPurify or render as text.",
  },
  {
    severity: "critical",
    category: "security",
    title: "API secret committed to repository",
    file: ".env.staging",
    snippet: `STRIPE_SECRET=sk_live_51N...redacted`,
    fix: `# move to vault / 1Password and rotate the leaked key immediately`,
    explanation: "Live secret committed to the repo. Rotate and move to a secret store.",
  },
  {
    severity: "high",
    category: "security",
    title: "Unsafe dependency with known CVE",
    file: "package.json",
    snippet: `"lodash": "4.17.20"`,
    fix: `"lodash": "^4.17.21"  // patches CVE-2021-23337`,
    explanation: "Pinned to a version with a known prototype-pollution CVE. Upgrade.",
  },
  {
    severity: "high",
    category: "bug",
    title: "Race condition on shared counter",
    file: "src/metrics/counter.ts",
    snippet: `const v = await store.get(k);\nawait store.set(k, v + 1);`,
    fix: `await store.increment(k, 1);`,
    explanation: "Read-then-write races under concurrency. Use an atomic increment.",
  },
  {
    severity: "medium",
    category: "performance",
    title: "Memory leak — listener never removed",
    file: "src/hooks/useSocket.ts",
    snippet: `useEffect(() => { socket.on('msg', handler); }, []);`,
    fix: `useEffect(() => {\n  socket.on('msg', handler);\n  return () => socket.off('msg', handler);\n}, []);`,
    explanation: "Listener accumulates on every mount. Return a cleanup.",
  },
  {
    severity: "medium",
    category: "bug",
    title: "Missing null check on optional field",
    file: "src/render/profile.tsx",
    snippet: `return <span>{user.profile.name.toUpperCase()}</span>;`,
    fix: `return <span>{user.profile?.name?.toUpperCase() ?? '—'}</span>;`,
    explanation: "Chain can throw when profile is absent. Guard with optional chaining.",
  },
  {
    severity: "medium",
    category: "performance",
    title: "Inefficient re-render on every keystroke",
    file: "src/components/SearchBar.tsx",
    snippet: `<List items={items.filter(matches)} />`,
    fix: `const visible = useMemo(() => items.filter(matches), [items, query]);\n<List items={visible} />`,
    explanation: "Filter runs on every render. Memoize.",
  },
  {
    severity: "high",
    category: "security",
    title: "Weak authentication — no rate limit on login",
    file: "src/routes/auth/login.ts",
    snippet: `router.post('/login', loginHandler);`,
    fix: `router.post('/login', rateLimit({ windowMs: 60_000, max: 5 }), loginHandler);`,
    explanation: "Login is brute-forceable without a per-IP rate limit.",
  },
  {
    severity: "medium",
    category: "performance",
    title: "Unoptimized query — missing index",
    file: "src/db/orders.ts",
    snippet: `db.query("SELECT * FROM orders WHERE user_id = $1", [id])`,
    fix: `-- add: CREATE INDEX idx_orders_user_id ON orders(user_id);\ndb.query("SELECT * FROM orders WHERE user_id = $1", [id])`,
    explanation: "Sequential scan on a hot path. Add an index on user_id.",
  },
  {
    severity: "high",
    category: "performance",
    title: "Blocking IO on request thread",
    file: "src/routes/report.ts",
    snippet: `const buf = fs.readFileSync('/tmp/report.csv');`,
    fix: `const buf = await fs.promises.readFile('/tmp/report.csv');`,
    explanation: "Sync IO stalls the event loop for every concurrent request.",
  },
  {
    severity: "high",
    category: "security",
    title: "Catastrophic backtracking in regex (ReDoS)",
    file: "src/validate/email.ts",
    snippet: `/^([a-zA-Z0-9]+)+@example\\.com$/`,
    fix: `/^[a-zA-Z0-9]+@example\\.com$/`,
    explanation: "Nested quantifier causes exponential backtracking on crafted input.",
  },
];

// Extra rotating vulnerability pool — every replay pulls from these too
VULN_TEMPLATES.push(
  {
    severity: "critical",
    category: "security",
    title: "Unsafe deserialization of user payload",
    file: "src/api/jobs/handler.ts",
    snippet: `const job = JSON.parse(req.body.payload);\nexec(job.command);`,
    fix: `const schema = z.object({ kind: z.enum(["resize", "thumbnail"]), src: z.string().url() });\nconst job = schema.parse(JSON.parse(req.body.payload));\nrun(job.kind, job.src);`,
    explanation:
      "Parsing then executing a command from the request body lets a caller pop a shell. Validate the shape, then dispatch to a fixed handler — never run a string the client sent.",
  },
  {
    severity: "high",
    category: "bug",
    title: "Infinite re-render loop in effect dependency",
    file: "src/hooks/useFilters.ts",
    snippet: `useEffect(() => {\n  setFilters({ ...filters, q });\n}, [filters, q]);`,
    fix: `useEffect(() => {\n  setFilters(prev => ({ ...prev, q }));\n}, [q]);`,
    explanation:
      "The effect both reads and writes \`filters\`, so every run re-triggers itself. Drop the dependency and use the functional setter.",
  },
  {
    severity: "high",
    category: "performance",
    title: "N+1 query loading order items",
    file: "src/services/orders.ts",
    snippet: `for (const o of orders) {\n  o.items = await db.items.where({ order_id: o.id });\n}`,
    fix: `const ids = orders.map(o => o.id);\nconst items = await db.items.whereIn("order_id", ids);\nconst grouped = groupBy(items, "order_id");\norders.forEach(o => (o.items = grouped[o.id] ?? []));`,
    explanation:
      "One query per order means a 50-order page fires 51 round trips. Batch with whereIn and group in memory — usually drops p95 by an order of magnitude.",
  },
  {
    severity: "critical",
    category: "security",
    title: "JWT verified with `none` algorithm accepted",
    file: "src/auth/verify.ts",
    snippet: `jwt.verify(token, secret); // no algorithms whitelist`,
    fix: `jwt.verify(token, secret, { algorithms: ["HS256"] });`,
    explanation:
      "Without an explicit algorithm list, an attacker can craft a token with `alg: none` and skip verification entirely.",
  },
  {
    severity: "medium",
    category: "architecture",
    title: "Direct DB access from a UI component",
    file: "src/components/UserCard.tsx",
    snippet: `const { data } = await supabase.from("users").select("*").eq("id", id);`,
    fix: `// move to src/lib/users.functions.ts and call via useServerFn\nconst { data } = await getUserById({ data: { id } });`,
    explanation:
      "Querying the database from a render component leaks schema into the UI and bypasses caching. Push the read into a server function.",
  },
  {
    severity: "high",
    category: "security",
    title: "CORS reflects arbitrary origin",
    file: "src/server/cors.ts",
    snippet: `res.setHeader("Access-Control-Allow-Origin", req.headers.origin);\nres.setHeader("Access-Control-Allow-Credentials", "true");`,
    fix: `const allow = new Set(["https://app.acme.com", "https://staging.acme.com"]);\nif (allow.has(req.headers.origin)) {\n  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);\n  res.setHeader("Access-Control-Allow-Credentials", "true");\n}`,
    explanation:
      "Reflecting `Origin` while sending credentials means any site can read authenticated responses on behalf of the user. Pin to an allowlist.",
  },
  {
    severity: "medium",
    category: "bug",
    title: "Missing await on async operation",
    file: "src/services/audit.ts",
    snippet: `function log(event) {\n  db.audit.insert(event); // no await\n  return ok();\n}`,
    fix: `async function log(event) {\n  await db.audit.insert(event);\n  return ok();\n}`,
    explanation:
      "The insert promise is dropped, so audit rows silently disappear under load and unhandled rejections crash the worker.",
  },
  {
    severity: "low",
    category: "style",
    title: "Magic number in retry policy",
    file: "src/queue/retry.ts",
    snippet: `if (attempt > 7) throw err;`,
    fix: `const MAX_RETRIES = 7;\nif (attempt > MAX_RETRIES) throw err;`,
    explanation:
      "Pulling the threshold to a named constant makes the retry budget tunable and self-documenting.",
  },
  {
    severity: "high",
    category: "performance",
    title: "Bundle blown up by full lodash import",
    file: "src/utils/group.ts",
    snippet: `import _ from "lodash";\nexport const group = _.groupBy;`,
    fix: `import groupBy from "lodash/groupBy";\nexport const group = groupBy;`,
    explanation:
      "Importing the whole library pulls ~70KB gzipped into the client bundle. Use the per-module import or `lodash-es` with tree-shaking.",
  },
  {
    severity: "critical",
    category: "security",
    title: "Server-side request forgery in image proxy",
    file: "src/api/proxy/image.ts",
    snippet: `const r = await fetch(req.query.url);\nres.send(await r.arrayBuffer());`,
    fix: `const url = new URL(req.query.url);\nif (!ALLOWED_HOSTS.has(url.hostname)) throw 403;\nif (isPrivateIP(await dns.lookup(url.hostname))) throw 403;\nconst r = await fetch(url);\nres.send(await r.arrayBuffer());`,
    explanation:
      "The proxy will happily fetch internal metadata endpoints (169.254.169.254) on behalf of any caller. Validate the host and refuse private ranges.",
  },
);

// Seeded PRNG so each replay feels different but is reproducible for QA.
function seeded(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateRandomIssues(seed: number, prId: string, count = 4): DemoIssue[] {
  const rng = seeded(seed);
  const picked = shuffle(VULN_TEMPLATES, rng).slice(0, count);
  return picked.map((t, i) => ({
    id: `${prId}-rng-${seed}-${i}`,
    severity: t.severity,
    category: t.category,
    title: t.title,
    file: t.file,
    line: 12 + Math.floor(rng() * 240),
    snippet: t.snippet,
    fix: t.fix,
    explanation: t.explanation,
    confidence: 78 + Math.floor(rng() * 22),
  }));
}

export interface DynamicScores {
  mergeSafety: number;
  securityScore: number;
  performanceScore: number;
  qualityScore: number;
  aiConfidence: number;
}

export function generateScores(seed: number, base: DynamicScores): DynamicScores {
  const rng = seeded(seed + 7);
  const jitter = (b: number, range = 14) =>
    Math.max(28, Math.min(99, b + Math.floor((rng() - 0.5) * range * 2)));
  return {
    mergeSafety: jitter(base.mergeSafety),
    securityScore: jitter(base.securityScore),
    performanceScore: jitter(base.performanceScore),
    qualityScore: jitter(base.qualityScore),
    aiConfidence: jitter(base.aiConfidence, 8),
  };
}

const STAGE_POOL: { label: string; detail: string }[] = [
  { label: "Fetching pull request", detail: "git fetch origin pr/HEAD" },
  { label: "Parsing changed files", detail: "AST · tree-sitter · 9 langs" },
  { label: "Loading dependency graph", detail: "248 packages · resolving imports" },
  { label: "Running security analysis", detail: "OWASP top 10 · secret scan" },
  { label: "Reviewing authentication flow", detail: "session · jwt · oauth scopes" },
  { label: "Detecting performance bottlenecks", detail: "n+1 · blocking IO · re-renders" },
  { label: "Analyzing async behavior", detail: "await chains · unresolved promises" },
  { label: "Reviewing architecture", detail: "module boundaries · coupling" },
  { label: "Checking dependencies", detail: "lockfile diff · CVE feed" },
  { label: "Calculating architectural complexity", detail: "cyclomatic · cognitive" },
  { label: "Scanning for injection risks", detail: "sql · xss · ssrf · cmd" },
  { label: "Inspecting API serialization", detail: "json schemas · type drift" },
  { label: "Evaluating merge safety", detail: "weighted by severity · diff size" },
  { label: "Generating AI suggestions", detail: "Llama 3.3 70B · streamed" },
];

export function generateScanStages(seed: number) {
  const rng = seeded(seed + 31);
  const head = STAGE_POOL.slice(0, 2);
  const middle = shuffle(STAGE_POOL.slice(2), rng).slice(0, 5);
  const stages = [...head, ...middle].map((s) => ({
    ...s,
    ms: 600 + Math.floor(rng() * 1100),
  }));
  stages.push({ label: "Review ready", detail: "findings streamed", ms: 0 });
  return stages;
}

export interface TeamEvent {
  kind: "merge" | "vuln" | "ok" | "push" | "perf" | "shield" | "ai";
  who?: string;
  text: string;
}

const TEAM_AUTHORS = ["alex", "emma", "marina", "noah", "ravi", "sara", "jules", "kenji", "kai", "lin", "theo", "amir"];

const TEAM_TEMPLATES: ((rng: () => number, who: string) => TeamEvent)[] = [
  (_r, w) => ({ kind: "merge", who: w, text: `${w} merged feature/auth-rewrite` }),
  (_r) => ({ kind: "vuln", text: `Caught an unsafe serialization path in dashboard.tsx` }),
  (r) => ({ kind: "ok", text: `Merge safety lifted to ${80 + Math.floor(r() * 19)}% on payments-api` }),
  () => ({ kind: "shield", text: `Security pass complete · 0 criticals on staging` }),
  (r, w) => ({ kind: "push", who: w, text: `${w} pushed ${2 + Math.floor(r() * 18)} new commits` }),
  () => ({ kind: "vuln", text: `Looks like useSocket leaks a listener on remount` }),
  () => ({ kind: "ai", text: `AI refactor accepted — extracted hot path into worker` }),
  (r) => ({ kind: "perf", text: `Collapsed an N+1 in orders.ts (-${80 + Math.floor(r() * 220)}ms p95)` }),
  (_r, w) => ({ kind: "vuln", text: `Found a hardcoded secret in ${w}/.env.local — rotated` }),
  (r) => ({ kind: "ok", text: `PR #${100 + Math.floor(r() * 900)} approved · nothing blocks merge` }),
  () => ({ kind: "shield", text: `Blocked an SQL injection on /login` }),
  () => ({ kind: "ai", text: `Reviewed 14 files in 2.8s · 3 high-confidence findings` }),
];

export function nextTeamEvent(seed: number): TeamEvent {
  const rng = seeded(seed);
  const who = TEAM_AUTHORS[Math.floor(rng() * TEAM_AUTHORS.length)];
  const tmpl = TEAM_TEMPLATES[Math.floor(rng() * TEAM_TEMPLATES.length)];
  return tmpl(rng, who);
}

// ───────────────────────────────────────────────────────────
// Randomized PR metadata pool — every Replay feels different
// ───────────────────────────────────────────────────────────

const PR_TITLE_POOL: string[] = [
  "feat(auth): rotate session tokens on privilege change",
  "perf(api): cache lookup table on cold start",
  "fix(ws): drop oldest frame under backpressure",
  "feat(billing): idempotent refund endpoint",
  "refactor(orders): extract pricing into pure function",
  "fix(ui): debounce search input on filters panel",
  "feat(observability): structured logs for every job",
  "fix(db): wrap balance debit in atomic update",
  "feat(rate-limit): per-user limiter on /reset",
  "perf(render): memoize heavy table rows",
  "fix(serialization): tighten payload schema with zod",
  "feat(workers): bounded queue for fanout broadcast",
  "refactor(auth): pull magic numbers into config",
  "fix(deps): pin lodash to 4.17.21 (CVE-2021-23337)",
  "feat(reviews): stream AI summary as it arrives",
];

const PR_AUTHORS = ["marina.k", "emma.r", "noah.s", "ravi.p", "alex.c", "lin.w", "amir.h", "theo.b"];

const PR_SUMMARIES: string[] = [
  "Tightens a hot auth path and removes one race in the session store. Two medium findings around input validation, otherwise low blast radius.",
  "Trims the request handler down to a single round-trip and adds an index on the lookup key. One high finding worth triaging before merge.",
  "Adds idempotency keys to the transfer flow. Closes a double-charge vector but introduces a TOCTOU on balance check that should land before merge.",
  "Mostly a cleanup pass — extracts a shared utility, removes dead code, and pushes a few inline constants to config. Safe to merge once tests land.",
  "Reworks the fanout broadcast with a bounded queue and a drop-oldest policy. Drops p99 fanout latency by 62%. Worth a quick scan of the heartbeat path.",
  "Patches an unsafe deserialization path the fuzzer hit last week. Adds schema validation on every job kind. Low diff, high impact.",
];

export interface PRMetaOverride {
  title: string;
  author: string;
  branch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  openedAt: string;
  summary: string;
  scanDurationMs: number;
  issueCount: number;
}

export function generatePRMeta(seed: number): PRMetaOverride {
  const rng = seeded(seed + 991);
  const title = PR_TITLE_POOL[Math.floor(rng() * PR_TITLE_POOL.length)];
  const author = PR_AUTHORS[Math.floor(rng() * PR_AUTHORS.length)];
  const summary = PR_SUMMARIES[Math.floor(rng() * PR_SUMMARIES.length)];
  const filesChanged = 3 + Math.floor(rng() * 18);
  const additions = 40 + Math.floor(rng() * 480);
  const deletions = 10 + Math.floor(rng() * 220);
  const branchStem = title.split(":")[0].replace(/[()]/g, "").trim();
  const branch = `${branchStem}/${["feat", "fix", "perf"][Math.floor(rng() * 3)]}-${Math.floor(rng() * 9999)}`;
  const openedAt = `${1 + Math.floor(rng() * 58)}m ago`;
  // 2.4–6.2s — feels organic, never instant, never tediously long
  const scanDurationMs = 2400 + Math.floor(rng() * 3800);
  const issueCount = 2 + Math.floor(rng() * 5);
  return { title, author, branch, filesChanged, additions, deletions, openedAt, summary, scanDurationMs, issueCount };
}

// Streaming AI commentary — narration that plays during a scan
export const AI_NARRATION: string[] = [
  "Reading the diff against main…",
  "Walking the dependency graph for changed modules…",
  "Cross-checking imports against the CVE feed…",
  "Looking at the auth boundary — anything new touching session state?",
  "Checking how the new code handles untrusted input…",
  "Re-running the type-flow analysis through the changed files…",
  "Inspecting async boundaries for dropped awaits…",
  "Sampling the hottest call sites for regressions…",
  "Comparing patterns against your team's past reviews…",
  "Weighing severity — three findings look worth flagging.",
];

export function pickNarration(seed: number, n = 5): string[] {
  const rng = seeded(seed + 73);
  return shuffle(AI_NARRATION, rng).slice(0, n);
}

