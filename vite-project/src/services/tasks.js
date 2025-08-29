// src/services/tasks.js
// Minimal, stable client that always hits /api/* and attaches the token.
// Only the functions MyTasks/TeamTasks & update need.

const BASE = "/api";

function getToken() {
    try {
        // read from either storage & common keys
        return (
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token') ||
            localStorage.getItem('access_token') ||
            sessionStorage.getItem('access_token') ||
            null
        );
    } catch {
        return null;
    }
}


function toQuery(params = {}) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        sp.set(k, v);
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}

async function apiGet(path, params) {
    const url = `${BASE}${path}${toQuery(params)}`;
    const token = getToken();
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* leave as text */ }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || raw || `HTTP ${res.status}`;
        const err = new Error(typeof msg === "string" ? msg : "Request failed");
        err.status = res.status; err.data = data ?? raw; err.url = url;
        throw err;
    }
    return data ?? raw;
}

async function apiPut(path, body) {
    const url = `${BASE}${path}`;
    const token = getToken();
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body ?? {}),
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* leave as text */ }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || raw || `HTTP ${res.status}`;
        const err = new Error(typeof msg === "string" ? msg : "Request failed");
        err.status = res.status; err.data = data ?? raw; err.url = url;
        throw err;
    }
    return data ?? raw;
}

/* ---------- EXPORTS ---------- */

// GET /api/tasks/my  → expecting { items: [...] }
export async function listMyTasks(params = {}) {
    const env = await apiGet("/tasks/my", params);
    return Array.isArray(env?.items) ? env.items : (Array.isArray(env) ? env : []);
}

// GET /api/tasks/search  → expecting { items: [...] }
export async function listTeamTasks(params = {}) {
    const env = await apiGet("/tasks/search", params);
    return Array.isArray(env?.items) ? env.items : (Array.isArray(env) ? env : []);
}

// PUT /api/tasks/:id  (simple, stable update)
export async function updateTask(taskKey, patch) {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const url = `/api/tasks/${encodeURIComponent(String(taskKey))}`
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patch || {}),
    })
    const raw = await res.text()
    let data = null
    try { data = raw ? JSON.parse(raw) : null } catch { }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || raw || `HTTP ${res.status}`
        const err = new Error(typeof msg === 'string' ? msg : 'Request failed')
        err.status = res.status; err.url = url; err.data = data ?? raw
        throw err
    }
    return data ?? raw
}

