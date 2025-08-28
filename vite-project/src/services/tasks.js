// src/services/tasks.js
import { api } from "@/lib/api";

const BASE = "/api/tasks";

export async function listTasks() {
  const { data } = await api.get(BASE);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function updateTask(id, updates) {
  const { data } = await api.put(`${BASE}/${id}`, updates);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`${BASE}/${id}`);
}
