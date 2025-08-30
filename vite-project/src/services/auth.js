// src/services/auth.js
// Robust auth helper: handles login, token+role storage, JWT decode fallback,
// and an optional /users/me fetch to learn the role after login.

const RAW = (import.meta.env?.VITE_API_URL || "").toString();
const BASE = RAW ? RAW.replace(/\/$/, "") : "/api";

// -----------------------------
// Storage keys & role handling
// -----------------------------
const TOKEN_KEY = "auth_token";
const ROLE_KEY = "user_role"; // "admin" | "manager" | "employee" (string)
const ROLE_CLAIM_KEYS = ["role", "roles", "user_role"]; // checked inside JWT or responses

function saveToken(token, remember = true) {
    if (!token) return;
    if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}

function saveRole(role, remember = true) {
    if (!role) return;
    if (remember) {
        localStorage.setItem(ROLE_KEY, role);
        sessionStorage.removeItem(ROLE_KEY);
    } else {
        sessionStorage.setItem(ROLE_KEY, role);
    }
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export function getRole() {
    return localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY) || null;
}

export function isAuthed() {
    return !!getToken();
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY); sessionStorage.removeItem(ROLE_KEY);
}

// -----------------------------
// Low-level fetch helpers
// -----------------------------
async function req(url, opts) {
    const res = await fetch(url, opts);
    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = txt || null; }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        const err = new Error(typeof msg === "string" ? msg : "Request failed");
        err.status = res.status; err.data = data; err.url = url;
        throw err;
    }
    return data;
}

// Reusable authenticated fetch (adds Authorization automatically)
export async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", token.startsWith("Bearer ") ? token : `Bearer ${token}`);
    }
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    const bodyIsJson = options.body && typeof options.body === "object" && !(options.body instanceof FormData);
    if (bodyIsJson && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const url = path.startsWith("http") ? path : `${BASE}${path}`;
    return req(url, { ...options, headers });
}

// -----------------------------
// JWT parse helpers
// -----------------------------
function base64UrlToUtf8(b64url) {
    // pad and replace URL-safe chars
    let s = b64url.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    // decode base64 -> utf8
    try {
        const decoded = atob(s);
        // convert binary string to UTF-8
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    } catch {
        return null;
    }
}

function decodeJwt(token) {
    if (!token) return null;
    const bare = token.startsWith("Bearer ") ? token.slice(7) : token;
    const parts = bare.split(".");
    if (parts.length < 2) return null;
    const payload = base64UrlToUtf8(parts[1]);
    if (!payload) return null;
    try { return JSON.parse(payload); } catch { return null; }
}

function roleFromJwt(token) {
    const payload = decodeJwt(token);
    if (!payload) return null;
    for (const key of ROLE_CLAIM_KEYS) {
        if (payload[key]) {
            // If claim is an array, take first string; if object, ignore
            if (Array.isArray(payload[key])) {
                const firstStr = payload[key].find(v => typeof v === "string");
                if (firstStr) return firstStr;
            } else if (typeof payload[key] === "string") {
                return payload[key];
            }
        }
    }
    return null;
}

// -----------------------------
// Endpoints tried in order
// -----------------------------
const CANDIDATE_LOGIN_PATHS = ["/auth/login", "/login", "/auth/token", "/token"];
const CANDIDATE_ME_PATHS = ["/users/me", "/auth/me", "/me"];

// Try login once with a given payload type
async function tryLoginOnce(path, payloadType, username, password) {
    const url = `${BASE}${path}`;
    if (payloadType === "json") {
        return req(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ username, password })
        });
    } else {
        const body = new URLSearchParams({ username, password, grant_type: "password" });
        return req(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
            body
        });
    }
}

// Attempt to fetch /me to learn role (optional)
async function tryFetchMe(token) {
    for (const p of CANDIDATE_ME_PATHS) {
        try {
            const me = await apiFetch(p, { headers: { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } });
            // Look for a role-ish field
            for (const key of ROLE_CLAIM_KEYS.concat(["role_label", "userRole"])) {
                if (me && typeof me[key] === "string") return me[key];
            }
            // Sometimes role nested: me.role.name
            if (me?.role && typeof me.role === "string") return me.role;
            if (me?.role?.name && typeof me.role.name === "string") return me.role.name;
        } catch {
            // try next
        }
    }
    return null;
}

// Extract role from direct login response if present
function roleFromLoginResponse(data) {
    if (!data || typeof data !== "object") return null;
    for (const key of ROLE_CLAIM_KEYS.concat(["role_label", "userRole"])) {
        if (typeof data[key] === "string") return data[key];
    }
    if (data.user && typeof data.user === "object") {
        for (const key of ROLE_CLAIM_KEYS.concat(["role_label", "userRole"])) {
            if (typeof data.user[key] === "string") return data.user[key];
        }
        if (typeof data.user.role === "string") return data.user.role;
        if (typeof data.user.role?.name === "string") return data.user.role.name;
    }
    return null;
}

// -----------------------------
// Public: login()
// -----------------------------
export async function login(username, password, remember = true) {
    let lastErr;

    // 1) Try BASE + paths (json + form)
    for (const path of CANDIDATE_LOGIN_PATHS) {
        for (const kind of ["json", "form"]) {
            try {
                const data = await tryLoginOnce(path, kind, username, password);

                // Token can be field or string
                const token =
                    data?.access_token ||
                    data?.token ||
                    (typeof data === "string" ? data : null);
                if (!token) throw new Error("No token in login response");

                // Persist token
                saveToken(token, remember);

                // Determine role: login response -> JWT -> /me
                let role =
                    roleFromLoginResponse(data) ||
                    roleFromJwt(token) ||
                    (await tryFetchMe(token));

                if (role) saveRole(role, remember);

                return { token, role: role || null };
            } catch (e) {
                lastErr = e;
                // Try next combination
            }
        }
    }

    // 2) Final hail-mary: same paths WITHOUT BASE as absolute (proxy-less)
    for (const path of CANDIDATE_LOGIN_PATHS) {
        try {
            const url = path; // relative
            const data = await req(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ username, password })
            });

            const token = data?.access_token || data?.token || null;
            if (!token) throw new Error("No token in login response");

            saveToken(token, remember);

            let role =
                roleFromLoginResponse(data) ||
                roleFromJwt(token) ||
                (await tryFetchMe(token));

            if (role) saveRole(role, remember);

            return { token, role: role || null };
        } catch (e) {
            lastErr = e;
        }
    }

    throw lastErr || new Error("Login failed");
}
