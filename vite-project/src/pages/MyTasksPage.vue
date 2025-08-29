<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listMyTasks, updateTask } from '@/services/tasks'

// ---------- Label <-> API mappings ----------
const STATUS_LABEL_TO_API = {
  'To Do': 'not_started',
  'In Progress': 'in_progress',
  'Completed': 'completed',
  'Approved': 'approved',
  'Rejected': 'rejected',
  'Re-Submission': 'resubmit',
}
const STATUS_API_TO_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABEL_TO_API).map(([k, v]) => [v, k])
)

const PRIORITY_LABEL_TO_API = {
  'Low': 'low',
  'Normal': 'medium',
  'High': 'high',
  'Critical': 'critical',
}
const PRIORITY_API_TO_LABEL = Object.fromEntries(
  Object.entries(PRIORITY_LABEL_TO_API).map(([k, v]) => [v, k])
)

// ---------- State ----------
const tasks = ref([])
const loading = ref(false)
const error = ref('')

const q = ref('')
const statusFilter = ref(null)   // label
const overdueOnly = ref(false)

const statusOptions = Object.keys(STATUS_LABEL_TO_API)
const priorityOptions = Object.keys(PRIORITY_LABEL_TO_API)

// ---------- Data load ----------
async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      q: q.value || undefined,
      status: statusFilter.value ? STATUS_LABEL_TO_API[statusFilter.value] : undefined,
      overdue: overdueOnly.value ? true : undefined,
    }
    const res = await listMyTasks(params)
    tasks.value = Array.isArray(res) ? res : (res?.items ?? [])
  } catch (e) {
    if (e?.status === 401) {
      // Token invalid/expired → clear & redirect
      const redirect = encodeURIComponent(location.pathname + location.search)
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
      location.assign(`/login?redirect=${redirect}`)
      return
    }
    error.value = e?.message || 'Failed to load my tasks.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
let deb
watch([q, statusFilter, overdueOnly], () => {
  clearTimeout(deb)
  deb = setTimeout(load, 300)
})

// ---------- Client-side search for current list ----------
const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return tasks.value
  return tasks.value.filter(t =>
    String(t.id ?? '').toLowerCase().includes(needle) ||
    String(t.title ?? '').toLowerCase().includes(needle) ||
    String(t.description ?? '').toLowerCase().includes(needle)
  )
})

// ---------- Edit modal ----------
const showEdit = ref(false)
const saving   = ref(false)
const editErr  = ref('')
const original = ref(null)
const form = ref({
  id: null,               // task_key: string or int from API
  title: '',
  description: '',
  status: 'To Do',        // label
  priority: 'Normal',     // label
  due_date: null,         // yyyy-mm-dd
  percent_complete: 0,
})

function openEdit(t) {
  original.value = { ...t }
  form.value = {
    id: t.id, // raw key (may be string like "eeb07" or numeric)
    title: t.title ?? '',
    description: t.description ?? '',
    status: STATUS_API_TO_LABEL[t.status] ?? 'To Do',
    priority: PRIORITY_API_TO_LABEL[t.priority] ?? 'Normal',
    due_date: t.due_date ? String(t.due_date).slice(0, 10) : null,
    percent_complete: clamp0to100(Number(t.percent_complete ?? 0)),
  }
  editErr.value = ''
  showEdit.value = true
}

function clamp0to100(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.min(100, Math.max(0, Math.round(x)))
}

function buildPatch() {
  const p = {}

  const newTitle = (form.value.title ?? '').trim()
  const oldTitle = (original.value.title ?? '').trim()
  if (newTitle && newTitle !== oldTitle) p.title = newTitle

  const newDesc = (form.value.description ?? '').trim()
  const oldDesc = (original.value.description ?? '').trim()
  if (newDesc !== oldDesc) p.description = newDesc || null

  const newStatusApi = STATUS_LABEL_TO_API[form.value.status] || null
  if (newStatusApi && newStatusApi !== original.value.status) p.status = newStatusApi

  const newPriorityApi = PRIORITY_LABEL_TO_API[form.value.priority] || null
  if (newPriorityApi && newPriorityApi !== original.value.priority) p.priority = newPriorityApi

  const oldDate = original.value.due_date ? String(original.value.due_date).slice(0, 10) : null
  if (form.value.due_date !== oldDate) p.due_date = form.value.due_date || null

  const pc = clamp0to100(form.value.percent_complete)
  const oldPc = clamp0to100(Number(original.value.percent_complete ?? 0))
  if (pc !== oldPc) p.percent_complete = pc

  return p
}

async function saveEdit() {
  const taskKey = String(form.value.id ?? '').trim()  // backend accepts string or int
  if (!taskKey) {
    editErr.value = 'Missing task id.'
    return
  }

  saving.value = true
  editErr.value = ''
  try {
    const patch = buildPatch()
    if (!Object.keys(patch).length) { showEdit.value = false; return }
    await updateTask(taskKey, patch)   // uses /api/tasks/{task_key}
    await load()
    showEdit.value = false
  } catch (e) {
    const status = e?.status ? ` [${e.status}]` : ''
    const where  = e?.url ? `\n${e.url}` : ''
    const body   = e?.data ? `\n${typeof e.data === 'string' ? e.data : JSON.stringify(e.data)}` : ''
    editErr.value = (e?.message || 'Request failed') + status + where + body
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>My Tasks</h1>

    <section class="toolbar">
      <v-text-field v-model="q" label="Search (id / title / desc)" hide-details density="comfortable" clearable />
      <v-select v-model="statusFilter" :items="statusOptions" label="Status" clearable hide-details density="comfortable" />
      <v-checkbox v-model="overdueOnly" label="Overdue only" density="compact" hide-details />
      <v-btn variant="tonal" :loading="loading" @click="load">Refresh</v-btn>
    </section>

    <div v-if="loading" class="status">Loading…</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <div v-else>
      <div v-if="filtered.length === 0" class="empty">No tasks to show.</div>

      <div v-else class="list">
        <div v-for="t in filtered" :key="t.id" class="item">
          <div class="row">
            <div class="title">
              <b>{{ t.title ?? '(Untitled Task)' }}</b>
              <span class="muted">#{{ t.id }}</span>
            </div>
            <div class="meta">
              <span>{{ STATUS_API_TO_LABEL[t.status] ?? t.status }}</span>
              <span>· {{ PRIORITY_API_TO_LABEL[t.priority] ?? t.priority }}</span>
              <span>· Due: {{ t.due_date ?? '—' }}</span>
              <span>· {{ t.percent_complete ?? 0 }}%</span>
            </div>
          </div>
          <div class="desc">{{ t.description ?? '—' }}</div>
          <div class="actions">
            <v-btn size="small" variant="text" @click="openEdit(t)">Edit</v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <v-dialog v-model="showEdit" max-width="560">
      <v-card>
        <v-card-title>Edit Task #{{ form.id }}</v-card-title>
        <v-card-text>
          <div class="form-grid">
            <v-text-field v-model="form.title" label="Title" />
            <v-textarea v-model="form.description" label="Description" rows="3" />
            <v-select v-model="form.status" :items="statusOptions" label="Status" />
            <v-select v-model="form.priority" :items="priorityOptions" label="Priority" />
            <v-text-field v-model="form.due_date" label="Due date" type="date" hide-details />
            <v-slider v-model="form.percent_complete" label="Percent complete" step="1" min="0" max="100" thumb-label />
          </div>
          <div v-if="editErr" class="status error" style="margin-top:6px">{{ editErr }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEdit = false" :disabled="saving">Cancel</v-btn>
          <v-btn variant="flat" color="primary" @click="saveEdit" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 16px; }
.toolbar { display: grid; grid-template-columns: 1fr 220px auto auto; gap: 12px; align-items: center; margin: 12px 0; }
@media (max-width: 900px){ .toolbar { grid-template-columns: 1fr; } }
.status { margin-top: 8px; opacity: .8; }
.status.error { color: #b00020; }
.empty { opacity: .75; padding: 10px; }
.list { display: grid; gap: 12px; }
.item { border: 1px solid #e7e8ec; border-radius: 10px; padding: 12px; }
.row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.title .muted { margin-left: 8px; opacity: .6; font-weight: 400; }
.meta { opacity: .85; display: flex; gap: 8px; flex-wrap: wrap; }
.desc { margin-top: 6px; }
.actions { display:flex; justify-content:flex-end; margin-top:8px; }
.form-grid { display: grid; gap: 12px; }
</style>
