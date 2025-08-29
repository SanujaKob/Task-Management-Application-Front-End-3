// src/services/auth.js
const RAW = (import.meta.env?.VITE_API_URL || "").toString();
const BASE = RAW ? RAW.replace(/\/$/, "") : "/api";

function saveToken(token, remember = true) {
    if (remember) {
        localStorage.setItem("auth_token", token);
        sessionStorage.removeItem("auth_token");
    } else {
        sessionStorage.setItem("auth_token", token);
    }
}
export function getToken() {
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
}
export function logout() {
    localStorage.removeItem("auth_token"); sessionStorage.removeItem("auth_token");
}

async function req(url, opts) {
    const res = await fetch(url, opts);
    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = txt || null; }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        const err = new Error(typeof msg === "string" ? msg : "Login failed");
        err.status = res.status; err.data = data; err.url = url;
        throw err;
    }
    return data;
}

const CANDIDATE_PATHS = ["/auth/login", "/login", "/auth/token", "/token"];

async function tryOnce(path, payloadType, username, password) {
    const url = `${BASE}${path}`;
    if (payloadType === "json") {
        return req(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ username, password }),
        });
    } else {
        const body = new URLSearchParams({ username, password, grant_type: "password" });
        return req(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
            body,
        });
    }
}

export async function login(username, password, remember = true) {
    let lastErr;
    for (const path of CANDIDATE_PATHS) {
        for (const kind of ["json", "form"]) {
            try {
                const data = await tryOnce(path, kind, username, password);
                const token = data?.access_token || data?.token || (typeof data === "string" ? data : null);
                if (!token) throw new Error("No token in login response");
                saveToken(token, remember);
                return token;
            } catch (e) {
                lastErr = e;
                // Try next combination; keep going on 404/422 etc.
            }
        }
    }
    // As a final hail-mary, try without BASE (in case proxy not set up)
    for (const path of CANDIDATE_PATHS) {
        try {
            const data = await req(path, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const token = data?.access_token || data?.token || null;
            if (!token) throw new Error("No token in login response");
            saveToken(token, remember);
            return token;
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("Login failed");
}
