<!-- src/pages/CreateTask.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>Create a New Task</h1>
      <p>Organize your work by creating a Task.</p>
      <br />

      <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit" validate-on="blur">
        <div class="grid">
          <v-text-field v-model="form.title" label="Title" :rules="[rules.required, rules.min2]" required />

          <!-- Assignee as dropdown -->
          <v-select
            v-model="form.assignee_id"
            :items="assigneeItems"
            item-title="label"
            item-value="value"
            label="Assignee"
            :loading="assigneesLoading"
            :disabled="assigneesLoading || assigneeItems.length === 0"
            :rules="[rules.required]"
            required
          />

          <v-select
            v-model="form.priority"
            :items="priorityItems"
            item-title="label"
            item-value="value"
            label="Priority"
            :rules="[rules.required]"
            required
          />

          <v-select
            v-model="form.status"
            :items="statusItems"
            item-title="label"
            item-value="value"
            label="Status"
            :rules="[rules.required]"
            required
          />

          <v-text-field v-model="form.start_date" label="Start Date" type="date" :rules="[rules.required]" required />
          <v-text-field v-model="form.due_date" label="Due Date" type="date" :rules="[rules.required, rules.afterStart]" required />
        </div>

        <v-textarea v-model="form.description" label="Description" rows="4" class="mt-4" :auto-grow="true" />

        <div class="actions">
          <v-btn type="submit" color="black" variant="flat" :loading="submitting" :disabled="submitting">Create Task</v-btn>
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
import { reactive, ref, computed, onMounted } from 'vue'
import api, { listUsers } from '@/services/api' // api shim + helper

const formRef = ref(null)
const isValid = ref(false)
const submitting = ref(false)

/* ---- Options ---- */
const priorityItems = [
  { label: 'Low',      value: 'low' },
  { label: 'Medium',   value: 'medium' },
  { label: 'High',     value: 'high' },
  { label: 'Critical', value: 'critical' },
]
const statusItems = [
  { label: 'To Do',         value: 'not_started' },
  { label: 'In Progress',   value: 'in_progress' },
  { label: 'Completed',     value: 'completed' },
  { label: 'Approved',      value: 'approved' },
  { label: 'Rejected',      value: 'rejected' },
  { label: 'Re-Submission', value: 'resubmit' },
]

/* ---- Assignees (fetched) ---- */
const assigneesLoading = ref(false)
const users = ref([])

/** Map API users to dropdown items; adjust fields to match your /users schema */
const assigneeItems = computed(() =>
  users.value.map(u => {
    const name = u.full_name || u.username || u.email || `User ${u.id}`
    const secondary = u.email && u.email !== name ? ` (${u.email})` : ''
    return {
      label: `${name}${secondary}`,
      // Prefer using numeric/string ID; if missing, fall back to username/email
      value: u.id ?? u.username ?? u.email,
      raw: u,
    }
  })
)

onMounted(async () => {
  try {
    assigneesLoading.value = true
    users.value = await listUsers()
  } catch (e) {
    console.error('Failed to load users:', e)
  } finally {
    assigneesLoading.value = false
  }
})

/* ---- Form ---- */
const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  status: 'not_started',
  assignee_id: null,   // we bind to ID here
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
  form.priority = 'medium'
  form.status = 'not_started'
  form.assignee_id = null
  form.start_date = ''
  form.due_date = ''
  message.text = ''
  formRef.value?.resetValidation?.()
}

/** Convert empty strings to null so FastAPI optional/date fields parse cleanly */
function normalizePayload(raw) {
  const payload = { ...raw }
  for (const k of ['description', 'start_date', 'due_date']) {
    if (payload[k] === '') payload[k] = null
  }
  return payload
}

async function handleSubmit() {
  const res = await formRef.value?.validate?.()
  if (res && res.valid === false) return

  // Build payload:
  // - Prefer assignee_id (most APIs use IDs)
  // - If your backend expects 'assignee' string (username/email), include it too.
  const selected = assigneeItems.value.find(i => i.value === form.assignee_id)?.raw
  const payload = normalizePayload({
    title: form.title.trim(),
    description: form.description?.trim() || '',
    priority: form.priority,
    status: form.status,
    assignee_id: form.assignee_id ?? null,
    // Optional fallback if your API uses 'assignee' instead of 'assignee_id'
    assignee: selected?.username || selected?.email || null,
    start_date: form.start_date,
    due_date: form.due_date,
  })

  submitting.value = true
  message.text = ''
  try {
    const { data: created } = await api.post('/tasks', payload)
    resetForm()
    message.type = 'success'
    message.text = `Task created successfully${created?.id ? ` (ID: ${created.id})` : ''}.`
  } catch (e) {
    let detail = e?.response?.data?.detail
    if (Array.isArray(detail)) detail = detail.map(d => d.msg || JSON.stringify(d)).join(', ')
    message.type = 'error'
    message.text = `Failed to create task. ${detail || e?.message || 'Check request payload fields.'}`
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { width: 100%; max-width: 960px; margin: 0 auto; background: #fff; color: #000; font-family: "Poppins", system-ui, sans-serif; }
.hero { margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p { color: #111; margin: 0 0 20px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 16px; text-align: left; }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
.actions { display: flex; gap: 12px; margin-top: 16px; justify-content: center; }
</style>
