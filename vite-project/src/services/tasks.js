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

function authHeaders() {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
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

async function safeFetch(url, init) {
    try {
        return await fetch(url, init);
    } catch (e) {
        const err = new Error('Network error: could not reach API');
        err.cause = e;
        err.url = url;
        throw err;
    }
}

export async function listMyTasks(params = {}) {
    const u = new URL('/api/tasks/my', window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
    });

    const url = u.pathname + u.search;
    const res = await safeFetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...authHeaders(),
        },
    });
    const text = await res.text();
    return okOrThrow(res, text, url);
}

// Optional helper if you need a single task anywhere:
export async function getTask(taskKey) {
    const url = `/api/tasks/${encodeURIComponent(String(taskKey))}`;
    const res = await safeFetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...authHeaders(),
        },
    });
    const text = await res.text();
    return okOrThrow(res, text, url);
}

export async function updateTask(taskKey, body) {
    const url = `/api/tasks/${encodeURIComponent(String(taskKey))}`;
    console.log('[API] PUT', url, 'payload=', body);

    const res = await safeFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(body || {}),
    });
    const text = await res.text();
    return okOrThrow(res, text, url);
}

export async function deleteTask(taskKey) {
    const url = `/api/tasks/${encodeURIComponent(String(taskKey))}`;
    console.log('[API] DELETE', url);

    const res = await safeFetch(url, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            ...authHeaders(),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        const msg = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
        const err = new Error(typeof msg === 'string' ? msg : 'Request failed');
        err.status = res.status; err.data = data; err.url = url;
        throw err;
    }
    return true; // 204 No Content expected
}

export async function listAllTasks() {
    const res = await fetch('/api/tasks', { credentials: 'include' })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = text || null }
    if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`
        const err = new Error(typeof msg === 'string' ? msg : 'Request failed')
        err.status = res.status; err.data = data; err.url = '/api/tasks'
        throw err
    }
    return data // array of TaskRead
}
