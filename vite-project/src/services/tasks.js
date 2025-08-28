// src/services/tasks.js
// Robust client that works with axios OR falls back to fetch if ./api is missing/misconfigured.

let api; // optional axios instance
try {
    const mod = await import("./api");
    api = mod?.default;
} catch (_) {
    api = null;
}

/** tiny guard */
function hasAxiosAPI(a) {
    return a && typeof a.get === "function" && typeof a.post === "function";
}

/** baseURL inference for fetch fallback */
const BASE = (import.meta.env?.VITE_API_URL || "").toString().replace(/\/$/, "");

/** get auth token if your api.js usually injects it */
function getToken() {
    try {
        return (
            localStorage.getItem("auth_token") ||
            sessionStorage.getItem("auth_token") ||
            null
        );
    } catch {
        return null;
    }
}

/** helpers */
function toQuery(params = {}) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        sp.set(k, v);
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}

function normalizeError(err) {
    const res = err?.response;
    if (res?.data?.detail) {
        const d = res.data.detail;
        if (Array.isArray(d)) return d.map((x) => x.msg || String(x)).join(", ");
        if (typeof d === "string") return d;
        try { return JSON.stringify(d); } catch { return "Request failed"; }
    }
    if (typeof err?.message === "string" && err.message) return err.message;
    return "Request failed";
}

/** fetch wrapper that mimics axios { data } */
async function fetchLike(method, path, body, params) {
    const url = path.startsWith("http") ? path : `${BASE}${path.replace(/^\//, "/")}`;
    const sp = new URLSearchParams();
    if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === "") continue;
            sp.set(k, v);
        }
    }
    const finalURL = sp.toString() ? `${url}?${sp.toString()}` : url;

    const token = getToken();
    const res = await fetch(finalURL, {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    const text = await res.text();
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text || null;
    }

    if (!res.ok) {
        const detail =
            (data && (data.detail || data.message)) ||
            `HTTP ${res.status} ${res.statusText}`;
        const err = new Error(typeof detail === "string" ? detail : "Request failed");
        err.response = { status: res.status, data };
        throw err;
    }
    return { data };
}

/** client that prefers axios, falls back to fetch */
const client = hasAxiosAPI(api)
    ? {
        get: (p, cfg = {}) => api.get(p + toQuery(cfg.params || {})),
        post: (p, body, cfg = {}) => api.post(p, body, cfg),
        patch: (p, body, cfg = {}) => api.patch(p, body, cfg),
        put: (p, body, cfg = {}) => api.put(p, body, cfg),
        delete: (p, cfg = {}) => api.delete(p, cfg),
    }
    : {
        get: (p, cfg = {}) => fetchLike("GET", p, null, cfg.params || {}),
        post: (p, body, cfg = {}) => fetchLike("POST", p, body, cfg.params || {}),
        patch: (p, body, cfg = {}) => fetchLike("PATCH", p, body, cfg.params || {}),
        put: (p, body, cfg = {}) => fetchLike("PUT", p, body, cfg.params || {}),
        delete: (p, cfg = {}) => fetchLike("DELETE", p, null, cfg.params || {}),
    };

/** -------- core retry helpers -------- */
const is404 = (e) => Number(e?.response?.status) === 404;
const is405 = (e) => Number(e?.response?.status) === 405;

async function tryMethodsAndPaths({ methods, paths, body = undefined, params = undefined, stopOn = (e) => false }) {
    let lastErr;
    for (const m of methods) {
        for (const p of paths) {
            try {
                const fn = client[m.toLowerCase()];
                const res = m === "GET" || m === "DELETE"
                    ? await fn(p, { params })
                    : await fn(p, body, { params });
                return res.data;
            } catch (e) {
                lastErr = e;
                // if this error should stop further retries, throw
                if (stopOn(e)) throw e;
                // otherwise continue to next path/method
            }
        }
    }
    // all attempts failed
    throw lastErr || new Error("Request failed");
}

/** Build common path variants */
function taskPaths(pathSuffix) {
    // supports both /tasks/... and /api/tasks/...
    const clean = pathSuffix.replace(/^\/+/, "");
    return [`/tasks/${clean}`, `/api/tasks/${clean}`];
}

/** ---------- API (resilient) ---------- */
export async function createTask(payload) {
    try {
        return await tryMethodsAndPaths({
            methods: ["POST"],
            paths: taskPaths(""),
            body: payload,
            stopOn: (e) => !is404(e), // if not 404 (e.g., 400/401/500), stop & throw
        });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function listTasks(params = {}) {
    try {
        return await tryMethodsAndPaths({
            methods: ["GET"],
            paths: taskPaths(""),
            params,
            stopOn: (e) => !is404(e),
        });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function listMyTasks(params = {}) {
    // Try /my, then /mine, then query param ?assignee=me, then fallback listTasks
    try {
        return await tryMethodsAndPaths({
            methods: ["GET"],
            paths: [...taskPaths("my"), ...taskPaths("mine")],
            params,
            stopOn: (e) => !is404(e),
        });
    } catch (_) {
        // try ?assignee=me
        try {
            return await listTasks({ ...params, assignee: "me" });
        } catch (err) {
            throw new Error(normalizeError(err));
        }
    }
}

export async function listTasksForUser(userId, params = {}) {
    const id = encodeURIComponent(String(userId));
    try {
        return await tryMethodsAndPaths({
            methods: ["GET"],
            paths: taskPaths(`by-user/${id}`),
            params,
            // If a user has no tasks, some backends may 404; treat 404 as []
            stopOn: (e) => !is404(e),
        });
    } catch (err) {
        if (is404(err)) return [];
        throw new Error(normalizeError(err));
    }
}

export async function getTask(id) {
    const encoded = encodeURIComponent(String(id));
    try {
        return await tryMethodsAndPaths({
            methods: ["GET"],
            paths: taskPaths(encoded),
            stopOn: (e) => !is404(e),
        });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function updateTask(id, patch) {
    const encoded = encodeURIComponent(String(id));
    try {
        // 1) Try PATCH /tasks/:id and /api/tasks/:id
        return await tryMethodsAndPaths({
            methods: ["PATCH"],
            paths: taskPaths(encoded),
            body: patch,
            // If PATCH not allowed (405) or route missing (404), keep trying; otherwise stop.
            stopOn: (e) => !(is404(e) || is405(e)),
        });
    } catch (_) {
        // 2) Fallback to PUT on same paths
        try {
            return await tryMethodsAndPaths({
                methods: ["PUT"],
                paths: taskPaths(encoded),
                body: patch,
                stopOn: (e) => !is404(e),
            });
        } catch (err) {
            throw new Error(normalizeError(err));
        }
    }
}

export async function deleteTask(id) {
    const encoded = encodeURIComponent(String(id));
    try {
        return await tryMethodsAndPaths({
            methods: ["DELETE"],
            paths: taskPaths(encoded),
            stopOn: (e) => !is404(e),
        });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function setTaskStatus(id, status) {
    return updateTask(id, { status });
}

export async function setTaskProgress(id, percent_complete) {
    return updateTask(id, { percent_complete });
}

/** Users (for assignee dropdown / labels) */
export async function listAssignees(params = {}) {
    // Try /users and /api/users
    const paths = ["/users", "/api/users"];
    let lastErr;
    for (const p of paths) {
        try {
            const data = await tryMethodsAndPaths({
                methods: ["GET"],
                paths: [p],
                params,
                stopOn: (e) => !is404(e),
            });
            return data;
        } catch (e) {
            lastErr = e;
            if (!is404(e)) break;
        }
    }
    throw new Error(normalizeError(lastErr));
}
