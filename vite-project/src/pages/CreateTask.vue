<!-- src/pages/CreateTask.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>Create a New Task</h1>
      <p>Organize your work by creating a Task.</p>
      <br />

      <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit" validate-on="blur">
        <div class="grid">
          <v-text-field
            v-model="form.title"
            label="Title"
            :rules="[rules.required, rules.min2]"
            required
          />

          <v-text-field
            v-model="form.assignee"
            label="Assignee (name or email)"
            :rules="[rules.required]"
            required
          />

          <v-select
            v-model="form.priority"
            :items="priorities"
            label="Priority"
            :rules="[rules.required]"
            required
          />

          <v-select
            v-model="form.status"
            :items="statuses"
            label="Status"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="form.start_date"
            label="Start Date"
            type="date"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="form.due_date"
            label="Due Date"
            type="date"
            :rules="[rules.required, rules.afterStart]"
            required
          />
        </div>

        <v-textarea
          v-model="form.description"
          label="Description"
          rows="4"
          class="mt-4"
          :auto-grow="true"
        />

        <div class="actions">
          <v-btn type="submit" color="black" variant="flat" :loading="submitting" :disabled="submitting">
            Create Task
          </v-btn>
          <v-btn variant="outlined" @click="resetForm" :disabled="submitting">Reset</v-btn>
        </div>

        <v-alert
          v-if="message.text"
          :type="message.type"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="message.text = ''"
        >
          {{ message.text }}
        </v-alert>
      </v-form>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

/** If you set VITE_API_URL in your .env, it will be used. Otherwise it falls back to relative path (works if you use a Vite proxy). */
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
const TASKS_URL = `${API_BASE}/api/tasks`   // -> http://127.0.0.1:8000/api/tasks

const formRef = ref(null)
const isValid = ref(false)
const submitting = ref(false)

const priorities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['To Do', 'In Progress', 'Completed', 'Approved', 'Rejected', 'Re-Submission']

const form = reactive({
  title: '',
  description: '',
  priority: '',
  status: 'To Do',
  assignee: '',
  start_date: '',
  due_date: '',
})

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  min2: v => (v && v.length >= 2) || 'Must be at least 2 characters',
  afterStart: () => {
    if (!form.start_date || !form.due_date) return true
    return form.due_date >= form.start_date || 'Due Date must be on/after Start Date'
  },
}

const message = reactive({ type: 'success', text: '' })

function resetForm() {
  form.title = ''
  form.description = ''
  form.priority = ''
  form.status = 'To Do'
  form.assignee = ''
  form.start_date = ''
  form.due_date = ''
  message.text = ''
  // Reset Vuetify validation state:
  formRef.value?.resetValidation?.()
}

/** Safely convert empty strings to null so FastAPI date fields parse cleanly */
function normalizePayload(raw) {
  const payload = { ...raw }
  for (const k of ['description', 'assignee', 'start_date', 'due_date']) {
    if (payload[k] === '') payload[k] = null
  }
  return payload
}

async function handleSubmit() {
  // Run Vuetify validation explicitly (more reliable than just v-model)
  const res = await formRef.value?.validate?.()
  if (res && res.valid === false) return

  const payload = normalizePayload({
    title: form.title.trim(),
    description: form.description?.trim() || '',
    priority: form.priority,
    status: form.status,
    assignee: form.assignee?.trim() || '',
    start_date: form.start_date, // keep if your backend accepts it; remove otherwise
    due_date: form.due_date,
  })

  submitting.value = true
  message.text = ''
  try {
    const resp = await fetch(TASKS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      // FastAPI commonly returns JSON with {"detail": "..."} on errors
      let detail = `HTTP ${resp.status}`
      try {
        const j = await resp.json()
        if (j?.detail) detail = Array.isArray(j.detail)
          ? j.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
          : j.detail
      } catch { /* ignore JSON parse fail */ }
      throw new Error(detail)
    }
    const created = await resp.json()
    resetForm()
    message.type = 'success'
    message.text = `Task created successfully${created?.id ? ` (ID: ${created.id})` : ''}.`
    // Optionally notify parent list to refresh:
    // emit('created', created)
  } catch (err) {
    message.type = 'error'
    message.text = `Failed to create task. ${err?.message || 'Check your backend or network.'}`
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  color: #000;
  font-family: "Poppins", system-ui, sans-serif;
}

.hero {
  margin: 40px auto;
  padding: 0 16px;
  text-align: center;
}
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p { color: #111; margin: 0 0 20px; }

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
  text-align: left;
}
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}
</style>
