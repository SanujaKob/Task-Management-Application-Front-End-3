// src/services/api.js
const BASE = import.meta.env.VITE_API_URL;

export async function createUser(payload) {
    const res = await fetch(`${BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Create failed (${res.status})`);
    }
    return res.json();
}
