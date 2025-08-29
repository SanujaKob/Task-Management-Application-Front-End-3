<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listMyTasks, updateTask } from '@/services/tasks'

const tasks = ref([])
const loading = ref(false)
const error = ref('')

const q = ref('')
const statusFilter = ref(null)
const overdueOnly = ref(false)

/**
 * UI labels on the left, backend-safe values on the right.
 * Tweak the values on the right to match your Task.status enum exactly.
 */
const STATUS_MAP = {
  'To Do': 'To Do',
  'In Progress': 'In Progress',
  'Completed': 'Completed',
  'Approved': 'Approved',
  'Rejected': 'Rejected',
  'Re-Submission': 'Resubmission', // ← backend likely uses this (no hyphen)
}
// Render options from labels:
const statusOptions = Object.keys(STATUS_MAP)
const priorityOptions = ['Low','Normal','High','Critical']

function toBackendStatus(label) {
  if (!label) return undefined
  return STATUS_MAP[label] ?? label
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      q: q.value || undefined,
      status: statusFilter.value ? toBackendStatus(statusFilter.value) : undefined,
      overdue: overdueOnly.value ? true : undefined, // omit when false
    }
    tasks.value = await listMyTasks(params)
  } catch (e) {
    error.value = e?.message || 'Failed to load my tasks.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
let t
watch([q, statusFilter, overdueOnly], () => { clearTimeout(t); t = setTimeout(load, 300) })

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return tasks.value
  return tasks.value.filter(t =>
    String(t.id ?? '').toLowerCase().includes(needle) ||
    String(t.title ?? '').toLowerCase().includes(needle) ||
    String(t.description ?? '').toLowerCase().includes(needle)
  )
})

/* ---------------- Edit Modal ---------------- */
const showEdit = ref(false)
const saving = ref(false)
const editErr = ref('')
const original = ref(null)
const form = ref({
  id: null,
  title: '',
  description: '',
  statusLabel: 'To Do',  // UI label, we convert on save
  priority: 'Normal',
  due_date: null,        // yyyy-mm-dd (string) or null
  percent_complete: 0,
})

function openEdit(task) {
  original.value = { ...task } // snapshot for diff
  // find the UI label corresponding to the backend value
  const labelFromBackend =
    Object.entries(STATUS_MAP).find(([, v]) => v === (task.status ?? 'To Do'))?.[0] ?? 'To Do'

  form.value = {
    id: task.id,
    title: task.title ?? '',
    description: task.description ?? '',
    statusLabel: labelFromBackend,
    priority: priorityOptions.includes(task.priority) ? task.priority : 'Normal',
    due_date: task.due_date ? String(task.due_date).slice(0, 10) : null,
    percent_complete: clamp0to100(Number(task.percent_complete ?? 0)),
  }
  editErr.value = ''
  showEdit.value = true
}

function clamp0to100(n) {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return Math.round(n)
}

function buildPatch() {
  const p = {}
  // Only include fields that changed
  if ((form.value.title ?? '') !== (original.value.title ?? '') && form.value.title.trim() !== '') {
    p.title = form.value.title.trim()
  }
  if ((form.value.description ?? '') !== (original.value.description ?? '')) {
    p.description = form.value.description?.trim() ? form.value.description.trim() : null
  }

  const backendStatus = toBackendStatus(form.value.statusLabel)
  if (backendStatus && backendStatus !== original.value.status) {
    p.status = backendStatus
  }

  if ((form.value.priority ?? 'Normal') !== (original.value.priority ?? 'Normal')) {
    p.priority = form.value.priority
  }

  const origDate = original.value.due_date ? String(original.value.due_date).slice(0,10) : null
  if (form.value.due_date !== origDate) {
    p.due_date = form.value.due_date || null
  }

  const pc = clamp0to100(form.value.percent_complete)
  const origPc = clamp0to100(Number(original.value.percent_complete ?? 0))
  if (pc !== origPc) {
    p.percent_complete = pc
  }
  return p
}

async function saveEdit() {
  if (!form.value.id) return
  saving.value = true
  editErr.value = ''
  try {
    const patch = buildPatch()
    if (Object.keys(patch).length === 0) {
      showEdit.value = false
      return
    }
    await updateTask(form.value.id, patch)
    // optimistic update
    const idx = tasks.value.findIndex(x => x.id === form.value.id)
    if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx], ...patch }
    await load() // re-sync with server
    showEdit.value = false
  } catch (e) {
    // surface server error clearly
    editErr.value = e?.message || 'Failed to save'
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
              <span>{{ t.status ?? 'To Do' }}</span>
              <span>· {{ t.priority ?? 'Normal' }}</span>
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

            <!-- Use the UI label but map to backend on save -->
            <v-select v-model="form.statusLabel" :items="statusOptions" label="Status" />

            <v-select v-model="form.priority" :items="priorityOptions" label="Priority" />

            <v-text-field v-model="form.due_date" label="Due date" type="date" hide-details />

            <v-slider
              v-model="form.percent_complete"
              label="Percent complete"
              step="1" min="0" max="100" thumb-label
            />
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
