const BASE = 'http://localhost:8000/api';

// ── Auth-aware fetch ──────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('maintainerai_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody?.message || errBody?.error || `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  /**
   * GET /api/github/auth/login
   * Returns { url } — the GitHub OAuth redirect URL. Open in browser.
   */
  getLoginUrl: () => apiFetch('/github/auth/login'),

  /**
   * GET /api/github/auth/callback?code=...
   * Returns { token, user } after GitHub redirects back.
   */
  handleCallback: (code) => apiFetch(`/github/auth/callback?code=${code}`),

  /**
   * GET /api/github/auth/install
   * Returns { url } — the GitHub App installation URL.
   */
  getInstallUrl: () => apiFetch('/github/auth/install'),
};

// ── Repositories ──────────────────────────────────────────────────────────────

export const repos = {
  /**
   * GET /api/github/repos
   * Returns { repositories: [...] }
   */
  list: () => apiFetch('/github/repos'),

  /**
   * POST /api/github/repos/sync  body: { installationId }
   * Returns { repositories: [...] }
   */
  sync: (installationId) =>
    apiFetch('/github/repos/sync', {
      method: 'POST',
      body: JSON.stringify({ installationId }),
    }),

  /**
   * POST /api/github/repos/triage  body: { fullName, active }
   * Returns { repository: { ... } }
   */
  toggleTriage: (fullName, active) =>
    apiFetch('/github/repos/triage', {
      method: 'POST',
      body: JSON.stringify({ fullName, active }),
    }),

  /**
   * PUT /api/github/repos/:owner/:repo/rules  body: { customLabels, customPriorities, customPromptHints }
   * Saves maintainer-defined triage rules for this repository.
   */
  updateTriageRules: (owner, repo, rules) =>
    apiFetch(`/github/repos/${owner}/${repo}/rules`, {
      method: 'PUT',
      body: JSON.stringify(rules),
    }),
};

// ── Issues ────────────────────────────────────────────────────────────────────

export const issues = {
  /**
   * GET /api/github/issues/:owner/:repo/issues?state=open|closed|all
   * Returns { issues: [...] }
   */
  list: (owner, repo, state = 'open') =>
    apiFetch(`/github/issues/${owner}/${repo}/issues?state=${state}`),

  /**
   * POST /api/github/issues/:owner/:repo/issues  body: { title, body, labels }
   * Returns { issue: { ... } }
   */
  create: (owner, repo, title, body, labels = []) =>
    apiFetch(`/github/issues/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body, labels }),
    }),

  /**
   * POST /api/triage/webhook — manually triggers triage for a specific issue
   * Sends the issue payload directly to the AI service, bypassing the tunnel.
   */
  triggerTriage: (issue, repository) =>
    apiFetch('/triage/webhook', {
      method: 'POST',
      body: JSON.stringify({
        action: 'opened',
        issue,
        repository,
      }),
    }),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reports = {
  getDashboardStats: (owner, repoName) => {
    const params = new URLSearchParams();
    if (owner) params.set('owner', owner);
    if (repoName) params.set('repoName', repoName);
    const qs = params.toString();
    return apiFetch(`/reports/reports/dashboard${qs ? `?${qs}` : ''}`);
  },

  /**
   * GET /api/reports/reports?owner=&repoName=&isDuplicate=&number=
   * Returns { reports: [...] }
   */
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.repoName) params.set('repoName', filters.repoName);
    if (filters.isDuplicate !== undefined) params.set('isDuplicate', filters.isDuplicate);
    if (filters.number !== undefined) params.set('number', filters.number);
    const qs = params.toString();
    return apiFetch(`/reports/reports${qs ? `?${qs}` : ''}`);
  },

  /**
   * Helper to retrieve a single report for an issue.
   * Returns { reports: [ ... ] } where the first element is the target report.
   */
  getByIssue: (owner, repoName, number) =>
    reports.getAll({ owner, repoName, number }),

  /**
   * GET /api/reports/reports/digest
   * Returns { digest: { totalTriaged, duplicates, burnoutRisk, categoryBreakdown, priorityBreakdown } }
   */
  getWeeklyDigest: () => apiFetch('/reports/reports/digest'),
};
