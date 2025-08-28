// src/services/api.js

// If you have a proxy in vite.config.js, BASE can be "".
// Otherwise, set VITE_API_URL in .env (e.g., http://127.0.0.1:8000)
const BASE = import.meta.env.VITE_API_URL || "";

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

/** Create a new user */
export async function createUser(payload) {
    const res = await fetch(`${BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}

/** List all users */
export async function listUsers() {
    const res = await fetch(`${BASE}/api/users`, {
        headers: { Accept: "application/json" },
    });
    return handleResponse(res);
}
