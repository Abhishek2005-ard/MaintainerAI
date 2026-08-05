const BASE = import.meta.env.VITE_API_URL || '/api';

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

export const auth = {
  /**
   * Fetches the GitHub authentication URL for user sign in.
   */
  getLoginUrl: () => apiFetch('/github/auth/login'),

  /**
   * Exchanges the OAuth callback code for an authentication token and user profile.
   */
  handleCallback: (code) => apiFetch(`/github/auth/callback?code=${code}`),

  /**
   * Fetches the GitHub App installation setup URL.
   */
  getInstallUrl: () => apiFetch('/github/auth/install'),
};

export const repos = {
  /**
   * Retrieves all registered repositories for the current user.
   */
  list: () => apiFetch('/github/repos'),

  /**
   * Synchronizes repository records for a specific GitHub App installation.
   */
  sync: (installationId) =>
    apiFetch('/github/repos/sync', {
      method: 'POST',
      body: JSON.stringify({ installationId }),
    }),

  /**
   * Toggles active automated triage state for a specified repository.
   */
  toggleTriage: (fullName, active) =>
    apiFetch('/github/repos/triage', {
      method: 'POST',
      body: JSON.stringify({ fullName, active }),
    }),

  /**
   * Saves custom maintainer triage configuration rules for a repository.
   */
  updateTriageRules: (owner, repo, rules) =>
    apiFetch(`/github/repos/${owner}/${repo}/rules`, {
      method: 'PUT',
      body: JSON.stringify(rules),
    }),
};

export const issues = {
  /**
   * Fetches issues from a GitHub repository filtered by issue state.
   */
  list: (owner, repo, state = 'open') =>
    apiFetch(`/github/issues/${owner}/${repo}/issues?state=${state}`),

  /**
   * Creates a new issue in a targeted GitHub repository.
   */
  create: (owner, repo, title, body, labels = []) =>
    apiFetch(`/github/issues/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body, labels }),
    }),

  /**
   * Triggers automated AI triage evaluation directly for a target issue.
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

export const reports = {
  getDashboardStats: (owner, repoName) => {
    const params = new URLSearchParams();
    if (owner) params.set('owner', owner);
    if (repoName) params.set('repoName', repoName);
    const qs = params.toString();
    return apiFetch(`/reports/reports/dashboard${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetches triage reports with optional filters for repository owner or issue number.
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
   * Retrieves triage report information for a single specified issue.
   */
  getByIssue: (owner, repoName, number) =>
    reports.getAll({ owner, repoName, number }),

  /**
   * Fetches weekly aggregated summary statistics of triaged issues.
   */
  getWeeklyDigest: () => apiFetch('/reports/reports/digest'),
};

