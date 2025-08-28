// src/services/api.js

// If you have a dev proxy in vite.config.js, keep BASE = "".
// Otherwise set VITE_API_URL in .env (e.g. http://127.0.0.1:8000)
const BASE = import.meta.env.VITE_API_URL || "";
const url = (path) => `${BASE}${path}`;

// ---- response helper (unchanged) ----
async function handleResponse(res) {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            if (data?.detail) {
                msg = Array.isArray(data.detail)
                    ? data.detail.map(d => d.msg || d).join(", ")
                    : data.detail;
            }
        } catch {
            const txt = await res.text().catch(() => "");
            if (txt) msg = txt;
        }
        throw new Error(msg);
    }
    return res.json();
}

// ---- token helpers ----
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

// ---- generic fetch that adds Authorization automatically ----
export async function apiFetch(path, init = {}) {
    const token = getToken();
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // If body is a plain object and no content-type set, send JSON by default
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

    return fetch(url(path), finalInit);
}

// ---- AUTH ----
// Backend expects x-www-form-urlencoded with 'username' (can be username OR email) and 'password'
export async function login(identifier, password, { remember = true } = {}) {
    const body = new URLSearchParams();
    body.set("username", identifier);
    body.set("password", password);

    const res = await fetch(url("/api/auth/login"), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body,
    });

    const data = await handleResponse(res); // { access_token, token_type }
    if (!data?.access_token) throw new Error("No token in response");
    setToken(data.access_token, remember);
    return data;
}

// Optional: if you added a /api/me endpoint (protected) to read current user
export async function fetchMe() {
    const res = await apiFetch("/api/me");
    return handleResponse(res);
}

// ---- USERS (updated to use apiFetch so token is sent) ----
/** Create a new user */
export async function createUser(payload) {
    const res = await apiFetch("/api/users", {
        method: "POST",
        body: payload, // apiFetch will JSON.stringify and set header
    });
    return handleResponse(res);
}

/** List all users */
export async function listUsers() {
    const res = await apiFetch("/api/users");
    return handleResponse(res);
}
