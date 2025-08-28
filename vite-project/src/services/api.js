// src/services/api.js

// ---- Base URL ----
// If you have a dev proxy in vite.config.js for '/api', keep BASE = ''.
// Otherwise set VITE_API_URL in .env (e.g., http://127.0.0.1:8000).
const RAW_BASE = import.meta.env.VITE_API_URL || '';
const BASE = RAW_BASE.replace(/\/$/, '');
const url = (path) => `${BASE}${path}`;

// ---- Response helper ----
async function handleResponse(res) {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            if (data?.detail) {
                msg = Array.isArray(data.detail)
                    ? data.detail.map((d) => d.msg || d).join(', ')
                    : data.detail;
            }
        } catch {
            const txt = await res.text().catch(() => '');
            if (txt) msg = txt;
        }
        throw new Error(msg);
    }
    return res.json();
}

// ---- Token helpers ----
export function getToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}
export function setToken(token, remember = true) {
    if (remember) {
        localStorage.setItem('auth_token', token);
        sessionStorage.removeItem('auth_token');
    } else {
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('auth_token');
    }
}
export function clearToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
}

// ---- Generic fetch wrapper ----
export async function apiFetch(path, init = {}) {
    const token = getToken();
    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const hasBody = init.body !== undefined && !(init.body instanceof FormData);
    const needsJson =
        hasBody &&
        !headers.has('Content-Type') &&
        typeof init.body === 'object' &&
        !(init.body instanceof URLSearchParams);

    const finalInit = { ...init, headers };
    if (needsJson) {
        headers.set('Content-Type', 'application/json');
        finalInit.body = JSON.stringify(init.body);
    }

    return fetch(url(path), finalInit);
}

// ---- Auth ----
export async function login(identifier, password, { remember = true } = {}) {
    const body = new URLSearchParams();
    body.set('username', identifier);
    body.set('password', password);

    const res = await fetch(url('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body,
    });

    const data = await handleResponse(res);
    if (!data?.access_token) throw new Error('No token in response');
    setToken(data.access_token, remember);
    return data;
}

// ---- Users ----
export async function fetchMe() {
    const res = await apiFetch('/api/users/me');
    return handleResponse(res);
}
export async function createUser(payload) {
    const res = await apiFetch('/api/users', { method: 'POST', body: payload });
    return handleResponse(res);
}
export async function listUsers() {
    const res = await apiFetch('/api/users');
    return handleResponse(res);
}

// ---- Tasks ----
export async function createTask(payload) {
    const res = await apiFetch('/api/tasks', { method: 'POST', body: payload });
    return handleResponse(res);
}
export async function listTasks() {
    const res = await apiFetch('/api/tasks');
    return handleResponse(res);
}

// ---- Default export (axios-like shim for convenience) ----
const api = {
    async get(path, init = {}) {
        const res = await apiFetch(`/api${path}`, { method: 'GET', ...init });
        return { data: await handleResponse(res) };
    },
    async post(path, body, init = {}) {
        const res = await apiFetch(`/api${path}`, { method: 'POST', body, ...init });
        return { data: await handleResponse(res) };
    },
    async patch(path, body, init = {}) {
        const res = await apiFetch(`/api${path}`, { method: 'PATCH', body, ...init });
        return { data: await handleResponse(res) };
    },
    async delete(path, init = {}) {
        const res = await apiFetch(`/api${path}`, { method: 'DELETE', ...init });
        return { data: await handleResponse(res) };
    },
};

export default api;
