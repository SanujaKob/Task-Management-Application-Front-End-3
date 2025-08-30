// src/services/tasks.js
// Minimal, explicit task API client using fetch (string or numeric IDs supported)

function getToken() {
    try {
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

function okOrThrow(res, text, url) {
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
        const err = new Error(typeof msg === 'string' ? msg : 'Request failed');
        err.status = res.status; err.data = data; err.url = url;
        throw err;
    }
    return data;
}

export async function listMyTasks(params = {}) {
    const u = new URL('/api/tasks/my', window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
    });

    const url = u.pathname + u.search;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
    });
    const text = await res.text();
    return okOrThrow(res, text, url);
}

export async function updateTask(taskKey, body) {
    const url = `/api/tasks/${encodeURIComponent(String(taskKey))}`;
    console.log('[API] PUT', url, 'payload=', body);

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(body || {}),
    });
    const text = await res.text();
    return okOrThrow(res, text, url);
}
