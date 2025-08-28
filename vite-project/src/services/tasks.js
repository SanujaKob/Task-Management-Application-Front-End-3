import api from './api'

/** match your Pydantic model field names (snake_case etc.) */
export async function createTask(payload) {
    // payload example:
    // { title, description, status, priority, due_date, assignee }
    const { data } = await api.post('/tasks', payload)
    return data
}

export async function listTasks() {
    const { data } = await api.get('/tasks')
    return data
}

export async function getTask(id) {
    const { data } = await api.get(`/tasks/${id}`)
    return data
}

export async function updateTask(id, patch) {
    const { data } = await api.patch(`/tasks/${id}`, patch)
    return data
}

export async function deleteTask(id) {
    const { data } = await api.delete(`/tasks/${id}`)
    return data
}
