// src/services/users.js
import api from './api'

export async function listUsers() {
    const r = await api.get('/api/users')
    // accept common shapes: array, {items}, {results}, {data}
    if (Array.isArray(r)) return r
    return r?.items || r?.results || r?.data || []
}

export function patchUser(id, body) {
    // change to api.patch if your backend uses PATCH
    return api.put(`/api/users/${encodeURIComponent(id)}`, body)
}

export function deleteUser(id) {
    return api.del(`/api/users/${encodeURIComponent(id)}`)
}
