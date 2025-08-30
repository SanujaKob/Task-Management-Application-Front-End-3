// src/services/users.js
import api from './api'

/** Normalize list responses: array OR {items|results|data} */
const asList = (data) =>
    Array.isArray(data) ? data : (data?.items || data?.results || data?.data || [])

/** GET /users */
export async function listUsers() {
    const { data } = await api.get('/users')
    return asList(data)
}

/** POST /users */
export async function createUser(payload) {
    const { data } = await api.post('/users', payload)
    return data
}

/** PATCH /users/:id (accepts string or numeric ids) */
export async function patchUser(id, body) {
    const { data } = await api.patch(`/users/${encodeURIComponent(id)}`, body)
    return data
}

/** DELETE /users/:id */
export async function deleteUser(id) {
    const { data } = await api.delete(`/users/${encodeURIComponent(id)}`)
    return data // note: backend returns 204 No Content → data may be ''
}
