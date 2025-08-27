<!-- src/pages/TeamTasks.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import MyTasksBreakdown from '@/components/MyTasksBreakdown.vue'
import MyTasksDashboard from '@/components/MyTaskDashboard.vue' // ⬅️ Team overview

/** Toggle to false when backend is ready */
const USE_MOCK = true

const tasks = ref([])

/** Filters */
const q = ref('')
const statusFilter = ref(null)
const assigneeFilter = ref(null)

const statusOptions = ['To Do','In Progress','Completed','Approved','Rejected','Re-Submission']
const assigneeOptions = ref([])

// ---- Mock data (system-wide) ----
const mockTasks = [
  { id: 'T-101', title: 'Set up user authentication', description: 'Implement JWT login and RBAC.', status: 'To Do',       priority: 'High',   due_date: '2025-09-05', percent_complete: 0,   assignee: 'Sanuja', created_by: 'Jane',   created_at: '2025-08-25T09:30:00Z', updated_at: '2025-08-25T09:30:00Z' },
  { id: 'T-102', title: 'Design database schema',      description: 'ERD for users, tasks.',         status: 'In Progress', priority: 'Medium', due_date: '2025-09-10', percent_complete: 45,  assignee: 'Ashen',  created_by: 'Sanuja', created_at: '2025-08-24T12:00:00Z', updated_at: '2025-08-27T14:15:00Z' },
  { id: 'T-103', title: 'Create landing page UI',       description: 'Homepage + hero.',              status: 'Completed',   priority: 'Low',    due_date: '2025-08-20', percent_complete: 100, assignee: 'Sanuja', created_by: 'Sanuja', created_at: '2025-08-15T10:00:00Z', updated_at: '2025-08-22T16:45:00Z' },
  { id: 'T-104', title: 'Client feedback review',       description: 'Review design feedback.',       status: 'Approved',    priority: 'Medium', due_date: '2025-09-01', percent_complete: 100, assignee: 'Jane',   created_by: 'Sanuja', created_at: '2025-08-18T08:20:00Z', updated_at: '2025-08-25T18:30:00Z' },
  { id: 'T-105', title: 'Fix login bug',                description: 'Invalid token after refresh.',  status: 'Rejected',    priority: 'High',   due_date: '2025-08-28', percent_complete: 10,  assignee: 'Sanuja', created_by: 'Ashen',  created_at: '2025-08-26T11:00:00Z', updated_at: '2025-08-27T15:00:00Z' },
  { id: 'T-106', title: 'Analytics dashboard',          description: 'KPIs and charts.',              status: 'Re-Submission',priority:'Medium', due_date: '2025-09-12', percent_complete: 80,  assignee: 'Nuwan',  created_by: 'Ashen',  created_at: '2025-08-23T09:00:00Z',  updated_at: '2025-08-27T11:10:00Z' },
]

async function fetchAllTasks() {
  if (USE_MOCK) {
    tasks.value = mockTasks
  } else {
    const res = await fetch('/api/tasks', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('Failed to fetch tasks')
    tasks.value = await res.json()
  }

  const set = new Set(tasks.value.map(t => t.assignee).filter(Boolean))
  assigneeOptions.value = Array.from(set).sort()
}
onMounted(fetchAllTasks)

/** Filtered list (used by panels) */
const filteredTasks = computed(() => {
  let arr = tasks.value.slice()

  if (q.value) {
    const needle = q.value.toLowerCase()
    arr = arr.filter(t =>
      (t.title || '').toLowerCase().includes(needle) ||
      (t.description || '').toLowerCase().includes(needle) ||
      (t.id || '').toLowerCase().includes(needle) ||
      (t.assignee || '').toLowerCase().includes(needle) ||
      (t.created_by || '').toLowerCase().includes(needle)
    )
  }
  if (statusFilter.value) {
    arr = arr.filter(t => (t.status || '').toLowerCase() === statusFilter.value.toLowerCase())
  }
  if (assigneeFilter.value) {
    arr = arr.filter(t => (t.assignee || '').toLowerCase() === assigneeFilter.value.toLowerCase())
  }
  return arr
})

function clearFilters() {
  q.value = ''
  statusFilter.value = null
  assigneeFilter.value = null
}

/* ---- Status update (from child) ---- */
async function onUpdateStatus({ id, newStatus }) {
  const idx = tasks.value.findIndex(t => t.id === id)
  const prev = idx !== -1 ? { ...tasks.value[idx] } : null

  if (idx !== -1) {
    tasks.value[idx] = { ...tasks.value[idx], status: newStatus, updated_at: new Date().toISOString() }
  }

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/tasks/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Status update failed')
    }
  } catch (e) {
    console.error(e)
    if (idx !== -1 && prev) tasks.value[idx] = prev
  }
}

/* ---- Edit ---- */
const editOpen = ref(false)
const draft = ref(null)
const priorityOptions = ['Low','Medium','High']

function onEdit(task) {
  draft.value = { ...task }
  editOpen.value = true
}

async function saveEdit() {
  if (!draft.value) return
  const payload = { ...draft.value }

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/tasks/${encodeURIComponent(payload.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Update failed')
    }
    const i = tasks.value.findIndex(t => t.id === payload.id)
    if (i !== -1) tasks.value[i] = { ...payload, updated_at: new Date().toISOString() }
    editOpen.value = false
  } catch (e) {
    console.error(e)
  }
}

/* ---- Delete ---- */
async function onDelete(task) {
  const ok = window.confirm(`Delete task ${task.id}?`)
  if (!ok) return
  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    }
    tasks.value = tasks.value.filter(t => t.id !== task.id)
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="page">
    <main class="hero">
      <h1>Team Tasks</h1>
      <p>View and manage all tasks in the system.</p>

      <!-- Team dashboard (overview for ALL tasks) -->
      <section class="home">
        <!-- If your dashboard accepts a tasks prop, pass the full set -->
        <MyTasksDashboard :tasks="tasks" />
        <!-- If your dashboard fetches by itself, you can remove :tasks -->
        <!-- <MyTasksDashboard /> -->
      </section>

      <!-- Filters toolbar -->
      <section class="toolbar">
        <v-text-field
          v-model="q"
          label="Search by title, ID, assignee…"
          hide-details
          density="comfortable"
          class="w-full"
        />
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Status"
          clearable
          hide-details
          density="comfortable"
        />
        <v-select
          v-model="assigneeFilter"
          :items="assigneeOptions"
          label="Assignee"
          clearable
          hide-details
          density="comfortable"
        />
        <v-btn variant="tonal" @click="clearFilters">Clear</v-btn>
      </section>

      <!-- Breakdown panels -->
      <section class="home">
        <MyTasksBreakdown
          :tasks="filteredTasks"
          :currentUser="''"
          @update-status="onUpdateStatus"
          @edit="onEdit"
          @delete="onDelete"
        />
      </section>
    </main>

    <!-- Edit dialog -->
    <v-dialog v-model="editOpen" max-width="720">
      <v-card>
        <v-card-title>Edit Task</v-card-title>
        <v-card-text v-if="draft" class="grid gap-3">
          <v-text-field v-model="draft.title" label="Title" />
          <v-textarea v-model="draft.description" label="Description" auto-grow />
          <div class="grid md:grid-cols-2 gap-3">
            <v-select :items="statusOptions" v-model="draft.status" label="Status" />
            <v-select :items="priorityOptions" v-model="draft.priority" label="Priority" />
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <v-text-field v-model="draft.assignee" label="Assignee" />
            <v-text-field v-model="draft.created_by" label="Created By" />
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <v-text-field v-model.number="draft.percent_complete" label="Percent Complete" type="number" min="0" max="100" />
            <v-text-field v-model="draft.due_date" label="Due Date" type="date" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.page { width: 100%; max-width: 1200px; margin: 0 auto; background: #fff; color: #000; display: flex; flex-direction: column; overflow-y: auto; font-family: "Poppins", system-ui, sans-serif; }
.hero { max-width: 960px; margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 10px; }
.hero p { color: #111; margin: 0 auto 20px; max-width: 600px; }

/* Toolbar */
.toolbar { display: grid; grid-template-columns: 1fr 220px 220px auto; gap: 12px; align-items: center; margin: 16px 0 8px; text-align: left; }
@media (max-width: 900px) { .toolbar { grid-template-columns: 1fr; } }

.home { margin-top: 16px; text-align: left; }

/* Minimal utility grid classes */
.grid { display: grid; gap: 12px; }
.md\:grid-cols-2 { grid-template-columns: 1fr; }
@media (min-width: 768px) { .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); } }
</style>
