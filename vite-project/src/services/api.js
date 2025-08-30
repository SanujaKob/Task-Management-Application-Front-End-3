// src/services/api.js

// ---- Base URL ----
// If you have a dev proxy for '/api', leave VITE_API_URL empty (BASE = '').
// If you call the backend directly, set VITE_API_URL (e.g., http://127.0.0.1:8000).
const RAW_BASE = import.meta.env.VITE_API_URL || "";
const BASE = RAW_BASE.replace(/\/$/, "");

// Default prefix used only when BASE is empty (dev proxy mode)
const DEFAULT_PREFIX = (import.meta.env.VITE_API_PREFIX || "/api").replace(/\/$/, "");

/** Build absolute URL (no double slashes) */
const toURL = (path, qs = "") => {
    if (!path.startsWith("/")) path = `/${path}`;
    const u = `${BASE}${path}`;
    return qs ? `${u}?${qs}` : u;
};

/** Resolve path for the axios-like shim */
function resolvePath(path) {
    if (!path.startsWith("/")) path = `/${path}`;
    if (!BASE && DEFAULT_PREFIX && !path.startsWith(`${DEFAULT_PREFIX}/`) && path !== DEFAULT_PREFIX) {
        return `${DEFAULT_PREFIX}${path}`;
    }
    return path;
}

/** Build query string from params */
function toQuery(params = {}) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        sp.set(k, v);
    }
    return sp.toString();
}

// ---- Response helper ----
async function handleResponse(res) {
    // ✅ Guard for 204 responses (no body)
    if (res.status === 204) return null;

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            if (data?.detail) {
                msg = Array.isArray(data.detail)
                    ? data.detail.map((d) => d.msg || d).join(", ")
                    : data.detail;
            }
        } catch {
            try {
                const txt = await res.text();
                if (txt) msg = txt;
            } catch { /* noop */ }
        }
        throw new Error(msg);
    }

    try {
        return await res.json();
    } catch {
        return await res.text();
    }
}

// ---- Token helpers ----
export function getToken() {
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}
export function setToken(token, remember = true) {
    if (remember) {
        localStorage.setItem("auth_token", token);
        sessionStorage.removeItem("auth_token");
    } else {
        sessionStorage.setItem("auth_token", token);
        localStorage.removeItem("auth_token");
    }
}
export function clearToken() {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
}

// ---- Generic fetch wrapper ----
export async function apiFetch(path, init = {}, params) {
    const token = getToken();
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const hasBody = init.body !== undefined && !(init.body instanceof FormData);
    const needsJson =
        hasBody &&
        !headers.has("Content-Type") &&
        typeof init.body === "object" &&
        !(init.body instanceof URLSearchParams);

    const finalInit = { ...init, headers };
    if (needsJson) {
        headers.set("Content-Type", "application/json");
        finalInit.body = JSON.stringify(init.body);
    }

    const qs = params ? toQuery(params) : "";
    return fetch(toURL(path, qs), finalInit);
}

// ---- Auth ----
export async function login(identifier, password, { remember = true } = {}) {
    const body = new URLSearchParams();
    body.set("username", identifier);
    body.set("password", password);

    const res = await fetch(toURL("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
    });

    const data = await handleResponse(res);
    if (!data?.access_token) throw new Error("No token in response");
    setToken(data.access_token, remember);
    return data;
}

// ---- Users ----
export async function fetchMe() {
    const res = await apiFetch("/api/users/me", { method: "GET" });
    return handleResponse(res);
}
export async function createUser(payload) {
    const res = await apiFetch("/api/users", { method: "POST", body: payload });
    return handleResponse(res);
}
export async function listUsers() {
    const res = await apiFetch("/api/users", { method: "GET" });
    return handleResponse(res);
}

// ---- Tasks ----
export async function createTask(payload) {
    const res = await apiFetch("/api/tasks", { method: "POST", body: payload });
    return handleResponse(res);
}
export async function listTasks() {
    const res = await apiFetch("/api/tasks", { method: "GET" });
    return handleResponse(res);
}

// ---- Default export: axios-like shim ----
const api = {
    async get(path, init = {}) {
        const p = resolvePath(path);
        const res = await apiFetch(p, { method: "GET", headers: init.headers }, init.params);
        const data = await handleResponse(res);
        return { data };
    },

    async post(path, body, init = {}) {
        const p = resolvePath(path);
        const res = await apiFetch(p, { method: "POST", body, headers: init.headers }, init.params);
        const data = await handleResponse(res);
        return { data };
    },

    async patch(path, body, init = {}) {
        const p = resolvePath(path);
        const res = await apiFetch(p, { method: "PATCH", body, headers: init.headers }, init.params);
        const data = await handleResponse(res);
        return { data };
    },

    async put(path, body, init = {}) {
        const p = resolvePath(path);
        const res = await apiFetch(p, { method: "PUT", body, headers: init.headers }, init.params);
        const data = await handleResponse(res);
        return { data };
    },

    async delete(path, init = {}) {
        const p = resolvePath(path);
        const res = await apiFetch(p, { method: "DELETE", headers: init.headers }, init.params);
        const data = await handleResponse(res);
        return { data };
    },
};

// ✅ Alias so you can call either api.delete(...) or api.del(...)
api.del = api.delete;

export default api;
