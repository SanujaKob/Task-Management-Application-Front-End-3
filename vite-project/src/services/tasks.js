// robust partial update
export async function updateTask(id, patch) {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    async function call(method) {
        const res = await fetch(`/api/tasks/${encodeURIComponent(String(id))}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(patch),
        })
        const txt = await res.text()
        let data = null
        try { data = txt ? JSON.parse(txt) : null } catch { data = txt || null }
        if (!res.ok) {
            const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`
            const err = new Error(typeof detail === 'string' ? detail : 'Request failed')
            // bubble up server validation details if present
            if (data && data.detail) err.detail = data.detail
            throw err
        }
        return data
    }
    try {
        return await call('PATCH')   // preferred for partial
    } catch (e) {
        // if PATCH not allowed on your backend, PUT fallback
        return await call('PUT')
    }
}
