<!-- src/pages/MyTasksPage.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listMyTasks, updateTask, deleteTask } from '@/services/tasks'

// ------- Label <-> API mappings -------
const STATUS_LABEL_TO_API = {
  'To Do':'not_started','In Progress':'in_progress','Completed':'completed',
  'Approved':'approved','Rejected':'rejected','Re-Submission':'resubmit',
}
const STATUS_API_TO_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABEL_TO_API).map(([k,v]) => [v,k])
)
const PRIORITY_LABEL_TO_API = {
  'Low':'low','Normal':'medium','High':'high','Critical':'critical',
}
const PRIORITY_API_TO_LABEL = Object.fromEntries(
  Object.entries(PRIORITY_LABEL_TO_API).map(([k,v]) => [v,k])
)

// ------- Colors & UI helpers -------
const STATUS_COLOR = {
  not_started:  'grey',
  in_progress:  'primary',
  completed:    'green',
  approved:     'teal',
  rejected:     'red',
  resubmit:     'orange',
}
const PRIORITY_COLOR = {
  low:      'blue-grey',
  medium:   'primary',
  high:     'orange',
  critical: 'red',
}
function fmtDate(d) {
  if (!d) return '—'
  try { return String(d).slice(0,10) } catch { return String(d) }
}
function isDone(apiStatus) {
  return apiStatus === 'completed' || apiStatus === 'approved'
}
function isOverdue(task) {
  if (!task?.due_date) return false
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(task.due_date); due.setHours(0,0,0,0)
  return !isDone(task.status) && due < today
}
function clamp0to100(n) {
  const x = Number(n); if (!Number.isFinite(x)) return 0
  return Math.min(100, Math.max(0, Math.round(x)))
}

// ------- State -------
const tasks = ref([])
const loading = ref(false)
const error = ref('')

const q = ref('')
const statusFilter = ref(null)     // label
const overdueOnly = ref(false)

const sortBy = ref('updated_desc') // updated_desc | due_asc | due_desc | priority_desc | title_asc
const statusOptions = Object.keys(STATUS_LABEL_TO_API)
const priorityOptions = Object.keys(PRIORITY_LABEL_TO_API)

// ------- Load -------
async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listMyTasks({
      q: q.value || undefined,
      status: statusFilter.value ? STATUS_LABEL_TO_API[statusFilter.value] : undefined,
      overdue: overdueOnly.value ? true : undefined,
    })
    tasks.value = Array.isArray(res) ? res : (res?.items ?? [])
  } catch (e) {
    if (e?.status === 401) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      localStorage.removeItem('auth_token'); sessionStorage.removeItem('auth_token')
      location.assign(`/login?redirect=${redirect}`)
      return
    }
    error.value = e?.message || 'Failed to load my tasks.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
let deb; watch([q, statusFilter, overdueOnly], () => { clearTimeout(deb); deb = setTimeout(load, 300) })

// ------- Derived / UI data -------
const filtered = computed(() => {
  let rows = tasks.value
  if (q.value.trim()) {
    const needle = q.value.trim().toLowerCase()
    rows = rows.filter(t =>
      String(t.id ?? '').toLowerCase().includes(needle) ||
      String(t.title ?? '').toLowerCase().includes(needle) ||
      String(t.description ?? '').toLowerCase().includes(needle)
    )
  }
  if (overdueOnly.value) rows = rows.filter(isOverdue)
  return rows
})

const sortedFiltered = computed(() => {
  const rows = [...filtered.value]
  switch (sortBy.value) {
    case 'due_asc':
      rows.sort((a,b) => (a.due_date||'') > (b.due_date||'') ? 1 : -1); break
    case 'due_desc':
      rows.sort((a,b) => (a.due_date||'') < (b.due_date||'') ? 1 : -1); break
    case 'priority_desc': {
      const order = { critical:3, high:2, medium:1, low:0 }
      rows.sort((a,b) => (order[a.priority]??-1) < (order[b.priority]??-1) ? 1 : -1); break
    }
    case 'title_asc':
      rows.sort((a,b) => String(a.title||'').localeCompare(String(b.title||''))); break
    default: // updated_desc
      rows.sort((a,b) => String(a.updated_at||'') < String(b.updated_at||'') ? 1 : -1)
  }
  return rows
})

// ------- Dashboard -------
const statusCounts = computed(() => {
  const counts = tasks.value.reduce((acc, t) => {
    const k = t?.status ?? 'unknown'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  return statusOptions.map(lbl => {
    const api = STATUS_LABEL_TO_API[lbl]
    return { label: lbl, api, count: counts[api] || 0, color: STATUS_COLOR[api] || 'grey' }
  })
})
const totalCount = computed(() => tasks.value.length)
const overdueCount = computed(() => tasks.value.filter(isOverdue).length)

// ------- Edit modal -------
const showEdit = ref(false)
const saving   = ref(false)
const editErr  = ref('')
const form = ref({
  id:null, title:'', description:'', status:'To Do', priority:'Normal',
  due_date:null, percent_complete:0,
})
function openEdit(t) {
  form.value = {
    id: t.id,
    title: t.title ?? '',
    description: t.description ?? '',
    status: STATUS_API_TO_LABEL[t.status] ?? 'To Do',
    priority: PRIORITY_API_TO_LABEL[t.priority] ?? 'Normal',
    due_date: t.due_date ? String(t.due_date).slice(0,10) : null,
    percent_complete: clamp0to100(Number(t.progress ?? 0)),
  }
  editErr.value = ''
  showEdit.value = true
}
function buildFullPayload() {
  return {
    title: (form.value.title ?? '').trim() || null,
    description: (form.value.description ?? '').trim() || null,
    status: STATUS_LABEL_TO_API[form.value.status] || null,
    priority: PRIORITY_LABEL_TO_API[form.value.priority] || null,
    due_date: form.value.due_date || null,
    progress: clamp0to100(form.value.percent_complete),
  }
}
async function saveEdit() {
  const taskKey = String(form.value.id ?? '').trim()
  if (!taskKey) { editErr.value = 'Missing task id.'; return }
  const body = buildFullPayload()
  saving.value = true
  editErr.value = ''
  try {
    await updateTask(taskKey, body)
    await load()
    showEdit.value = false
  } catch (e) {
    const status = e?.status ? ` [${e.status}]` : ''
    const url    = e?.url ? `\n${e.url}` : ''
    const resp   = e?.data ? `\n${JSON.stringify(e.data)}` : ''
    editErr.value = (e?.message || 'Request failed') + status + url + resp
  } finally {
    saving.value = false
  }
}

// ------- Delete modal -------
const showDelete = ref(false)
const deleting   = ref(false)
const deleteErr  = ref('')
const toDeleteId = ref(null)
const toDeleteTitle = ref('')
function openDelete(t) {
  toDeleteId.value = t.id
  toDeleteTitle.value = t.title || '(Untitled Task)'
  deleteErr.value = ''
  showDelete.value = true
}
async function confirmDelete() {
  if (!toDeleteId.value) return
  deleting.value = true
  deleteErr.value = ''
  try {
    await deleteTask(toDeleteId.value)
    showDelete.value = false
    await load()
  } catch (e) {
    if (e?.status === 401) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      localStorage.removeItem('auth_token'); sessionStorage.removeItem('auth_token')
      location.assign(`/login?redirect=${redirect}`); return
    }
    const status = e?.status ? ` [${e.status}]` : ''
    const url    = e?.url ? `\n${e.url}` : ''
    const resp   = e?.data ? `\n${JSON.stringify(e.data)}` : ''
    deleteErr.value = (e?.message || 'Delete failed') + status + url + resp
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- Centered hero -->
    <section class="hero">
      <h1 class="hero__title">My Tasks</h1>
      <p class="hero__subtitle">
        Manage and track your tasks with ease. Use the filters and dashboard below to stay on top of your work.
      </p>
    </section>

    <!-- Filters -->
    <section class="toolbar">
      <v-text-field
        v-model="q" label="Search (id / title / desc)" prepend-inner-icon="mdi-magnify"
        hide-details density="comfortable" clearable />
      <v-select
        v-model="statusFilter" :items="statusOptions" label="Status" clearable
        hide-details density="comfortable" />
      <v-select
        v-model="sortBy"
        :items="[
          { title:'Last updated (new → old)', value:'updated_desc' },
          { title:'Due date (soonest)',       value:'due_asc' },
          { title:'Due date (latest)',        value:'due_desc' },
          { title:'Priority (high → low)',    value:'priority_desc' },
          { title:'Title (A→Z)',              value:'title_asc' },
        ]"
        label="Sort by" hide-details density="comfortable"
      />
      <v-checkbox v-model="overdueOnly" label="Overdue only" density="compact" hide-details />
      <v-btn variant="tonal" :loading="loading" @click="load" prepend-icon="mdi-refresh">Refresh</v-btn>
    </section>

    <!-- Dashboard — single-row, equal-width, no scroll -->
    <section class="dash">
      <v-card class="dash-total" variant="tonal">
        <v-card-text>
          <div class="dash-kpi">
            <div class="kpi-label">Total</div>
            <div class="kpi-num">{{ totalCount }}</div>
          </div>
          <div class="kpi-divider" />
          <div class="dash-kpi">
            <div class="kpi-label">Overdue</div>
            <div class="kpi-num">{{ overdueCount }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card
        v-for="s in statusCounts"
        :key="s.api"
        class="dash-item"
        :color="s.color"
        variant="outlined"
      >
        <v-card-text class="dash-item-text">
          <div class="dash-item-count">{{ s.count }}</div>
          <div class="dash-item-label">
            <v-chip :color="s.color" size="small" variant="tonal">{{ s.label }}</v-chip>
          </div>
        </v-card-text>
      </v-card>
    </section>

    <!-- Load/Error -->
    <div v-if="loading" class="block">
      <v-skeleton-loader
        type="article, card, list-item-two-line, list-item-two-line"
        loading
      />
    </div>
    <div v-else-if="error" class="status error">
      <v-alert type="error" variant="tonal" border="start">
        {{ error }}
      </v-alert>
    </div>

    <!-- Empty state -->
    <div v-else-if="sortedFiltered.length === 0" class="empty-wrap">
      <v-card class="empty-card" variant="tonal">
        <v-card-text class="empty-text">
          <v-icon size="36">mdi-clipboard-text-outline</v-icon>
          <div class="empty-title">No tasks to show</div>
          <div class="empty-sub">Try adjusting filters or remove “Overdue only”.</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Task list -->
    <div v-else class="grid">
      <v-card
        v-for="t in sortedFiltered"
        :key="t.id"
        class="task-card"
        variant="outlined"
      >
        <v-card-item>
          <div class="task-row">
            <div class="task-title">
              <span class="title-text">{{ t.title ?? '(Untitled Task)' }}</span>
              <span class="task-id">#{{ t.id }}</span>
            </div>
            <div class="task-right">
              <v-badge v-if="isOverdue(t)" color="red" dot location="bottom end">
                <v-chip color="red" variant="tonal" size="small">Overdue</v-chip>
              </v-badge>
              <v-chip
                :color="STATUS_COLOR[t.status] || 'grey'"
                size="small" class="ml-2"
                variant="flat"
              >
                {{ STATUS_API_TO_LABEL[t.status] ?? t.status }}
              </v-chip>
              <v-chip
                :color="PRIORITY_COLOR[t.priority] || 'grey'"
                size="small" class="ml-2"
                variant="tonal"
              >
                {{ PRIORITY_API_TO_LABEL[t.priority] ?? t.priority }}
              </v-chip>
            </div>
          </div>

          <div class="task-meta">
            <span>Due: <b>{{ fmtDate(t.due_date) }}</b></span>
            <span>Updated: <b>{{ fmtDate(t.updated_at) }}</b></span>
            <span>Progress: <b>{{ clamp0to100(t.progress ?? 0) }}%</b></span>
          </div>

          <div class="task-desc">
            {{ t.description ?? '—' }}
          </div>

          <v-progress-linear
            :model-value="clamp0to100(t.progress ?? 0)"
            height="8"
            :color="isDone(t.status) ? 'green' : 'primary'"
            rounded
            class="mt-2"
          />

          <div class="task-actions">
            <v-btn size="small" variant="text" @click="openEdit(t)" prepend-icon="mdi-pencil">Edit</v-btn>
            <v-btn size="small" variant="text" color="error" @click="openDelete(t)" prepend-icon="mdi-delete">Delete</v-btn>
          </div>
        </v-card-item>
      </v-card>
    </div>

    <!-- Edit Modal -->
    <v-dialog v-model="showEdit" max-width="640">
      <v-card>
        <v-card-title>Edit Task #{{ form.id }}</v-card-title>
        <v-card-text>
          <div class="form-grid">
            <v-text-field v-model="form.title" label="Title" />
            <v-textarea v-model="form.description" label="Description" rows="3" />
            <v-select v-model="form.status" :items="statusOptions" label="Status" />
            <v-select v-model="form.priority" :items="priorityOptions" label="Priority" />
            <v-text-field v-model="form.due_date" label="Due date" type="date" hide-details />
            <div class="slider-row">
              <div class="slider-label">Percent complete</div>
              <v-slider v-model="form.percent_complete" step="1" min="0" max="100" thumb-label />
            </div>
          </div>
          <div v-if="editErr" class="status error" style="margin-top:6px; white-space:pre-wrap">{{ editErr }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEdit=false" :disabled="saving">Cancel</v-btn>
          <v-btn variant="flat" color="primary" @click="saveEdit" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm Modal -->
    <v-dialog v-model="showDelete" max-width="520">
      <v-card>
        <v-card-title>Delete Task?</v-card-title>
        <v-card-text>
          Are you sure you want to delete <b>#{{ toDeleteId }}</b> —
          <i>{{ toDeleteTitle }}</i>? This cannot be undone.
          <div v-if="deleteErr" class="status error" style="margin-top:8px; white-space:pre-wrap">
            {{ deleteErr }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDelete=false" :disabled="deleting">Cancel</v-btn>
          <v-btn variant="flat" color="error" @click="confirmDelete" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 16px; }

/* Hero: centered title + paragraph with a small top gap */
.hero {
  margin-top: 20px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 8px;
}
.hero__title { margin: 0; font-size: 2rem; font-weight: 700; }
.hero__subtitle { margin: 0; max-width: 720px; color: rgba(0,0,0,.7); }

/* Toolbar */
.toolbar {
  display: grid;
  grid-template-columns: 1fr 220px 220px auto auto;
  gap: 12px; align-items: center; margin: 16px 0 12px;
}
@media (max-width: 1000px){ .toolbar { grid-template-columns: 1fr; } }

/* Dashboard — single-row, equal-width, no scroll */
.dash { display:flex; gap:8px; margin: 6px 0 16px; overflow-x:hidden; }
.dash > * { flex:1; min-width:0; }
.dash-total { flex:1.4; } /* total/overdue a bit wider */

.dash-total .v-card-text {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding: 12px !important;
}
.dash-kpi .kpi-label { font-size: .8rem; opacity: .8; }
.dash-kpi .kpi-num   { font-size: 1.4rem; font-weight: 700; line-height: 1; }
.kpi-divider { width:1px; height: 36px; background: rgba(0,0,0,.08); }

.dash-item-text { display:grid; gap:4px; text-align:center; padding:10px !important; }
.dash-item-count { font-size: 1.1rem; font-weight: 700; }
.dash-item-label { font-size: .8rem; opacity: .85; }

/* List */
.grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
@media (max-width: 900px){ .grid { grid-template-columns: 1fr; } }

.task-card { border-radius: 14px; }
.task-row { display:flex; justify-content:space-between; align-items:center; gap: 8px; }
.task-title { display:flex; align-items:baseline; gap: 8px; }
.title-text { font-weight: 700; font-size: 1.05rem; }
.task-id { opacity: .6; font-weight: 500; }
.task-right { display:flex; align-items:center; gap: 8px; }

.task-meta { margin-top: 6px; opacity: .85; display:flex; flex-wrap:wrap; gap: 14px; }
.task-desc { margin-top: 8px; }

.task-actions { display:flex; justify-content:flex-end; gap: 8px; margin-top: 8px; }

/* Status / states */
.status { margin-top: 8px; opacity: .9; }
.status.error { color: #b00020; }

/* Empty state */
.empty-wrap { margin-top: 8px; }
.empty-card { border-radius: 14px; }
.empty-text { display:grid; justify-items:center; gap: 6px; padding: 24px !important; text-align:center; }
.empty-title { font-weight: 700; }
.empty-sub { opacity: .8; }

/* Form */
.form-grid { display: grid; gap: 12px; }
.slider-row { display:grid; gap: 6px; }
.slider-label { font-size:.9rem; opacity:.8; }
</style>
