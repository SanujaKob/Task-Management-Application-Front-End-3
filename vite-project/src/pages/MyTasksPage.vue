<!-- src/pages/MyTasksPage.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import MyTaskDashboard from '@/components/MyTaskDashboard.vue'
import MyTasksBreakdown from '@/components/MyTasksBreakdown.vue'

/** Toggle to false when backend is ready */
const USE_MOCK = true

const tasks = ref([])
const currentUser = 'Sanuja' // replace with your auth store value

// ---- Mock data (for local dev) ----
const mockTasks = [
  {
    id: 'T-101',
    title: 'Set up user authentication',
    description: 'Implement JWT login and role-based access control.',
    status: 'To Do',
    priority: 'High',
    due_date: '2025-09-05',
    percent_complete: 0,
    assignee: 'Sanuja',
    created_by: 'Jane',
    created_at: '2025-08-25T09:30:00Z',
    updated_at: '2025-08-25T09:30:00Z'
  },
  {
    id: 'T-102',
    title: 'Design database schema',
    description: 'ERD for users, tasks, and notifications.',
    status: 'In Progress',
    priority: 'Medium',
    due_date: '2025-09-10',
    percent_complete: 45,
    assignee: 'Ashen',
    created_by: 'Sanuja',
    created_at: '2025-08-24T12:00:00Z',
    updated_at: '2025-08-27T14:15:00Z'
  },
  {
    id: 'T-103',
    title: 'Create landing page UI',
    description: 'Homepage with header, footer, and hero section.',
    status: 'Completed',
    priority: 'Low',
    due_date: '2025-08-20',
    percent_complete: 100,
    assignee: 'Sanuja',
    created_by: 'Sanuja',
    created_at: '2025-08-15T10:00:00Z',
    updated_at: '2025-08-22T16:45:00Z'
  },
  {
    id: 'T-104',
    title: 'Client feedback review',
    description: 'Review design feedback and prepare fixes.',
    status: 'Approved',
    priority: 'Medium',
    due_date: '2025-09-01',
    percent_complete: 100,
    assignee: 'Jane',
    created_by: 'Sanuja',
    created_at: '2025-08-18T08:20:00Z',
    updated_at: '2025-08-25T18:30:00Z'
  },
  {
    id: 'T-105',
    title: 'Fix login bug',
    description: 'Resolve invalid token issue after refresh.',
    status: 'Rejected',
    priority: 'High',
    due_date: '2025-08-28',
    percent_complete: 10,
    assignee: 'Sanuja',
    created_by: 'Ashen',
    created_at: '2025-08-26T11:00:00Z',
    updated_at: '2025-08-27T15:00:00Z'
  }
]

// ---- Load tasks ----
async function fetchTasks() {
  if (USE_MOCK) {
    tasks.value = mockTasks
    return
  }
  const res = await fetch('/api/tasks/my', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  tasks.value = await res.json()
}
onMounted(fetchTasks)

// ---- Status update (from child) ----
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
    if (idx !== -1 && prev) tasks.value[idx] = prev // revert
    // TODO: show snackbar
  }
}

// ---- Full edit dialog (all fields) ----
const editOpen = ref(false)
const draft = ref(null)
const statusOptions = ['To Do','In Progress','Completed','Approved','Rejected','Re-Submission']
const priorityOptions = ['Low','Medium','High']

function onEdit(task) {
  // clone to avoid mutating until save
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
    // update local
    const i = tasks.value.findIndex(t => t.id === payload.id)
    if (i !== -1) tasks.value[i] = { ...payload, updated_at: new Date().toISOString() }
    editOpen.value = false
  } catch (e) {
    console.error(e)
    // TODO: snackbar
  }
}

// ---- Delete ----
async function onDelete(task) {
  const confirm = window.confirm(`Delete task ${task.id}?`)
  if (!confirm) return

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    }
    tasks.value = tasks.value.filter(t => t.id !== task.id)
  } catch (e) {
    console.error(e)
    // TODO: snackbar
  }
}
</script>

<template>
  <div class="page">
    <main class="hero">
      <h1>Stay on top of your tasks</h1>
      <p>Simple, fast task management - create tasks, track progress, and hit deadlines.</p>

      <!-- Dashboard -->
      <section class="home">
        <MyTaskDashboard :disableFetch="USE_MOCK" />
      </section>

      <!-- Breakdown panels -->
      <section class="home">
        <MyTasksBreakdown
          :tasks="tasks"
          :currentUser="currentUser"
          @update-status="onUpdateStatus"
          @edit="onEdit"
          @delete="onDelete"
        />
      </section>
    </main>

    <!-- Edit dialog (all fields) -->
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
.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-family: "Poppins", system-ui, sans-serif;
}
.hero {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 16px;
  text-align: center;
}
.hero h1 {
  font-size: clamp(24px, 4vw, 32px);
  margin-bottom: 10px;
}
.hero p {
  color: #111;
  margin: 0 auto 20px;
  max-width: 600px;
}
.home {
  margin-top: 24px;
  text-align: left;
}

/* Minimal utility grid classes (Vuetify coexists fine with these) */
.grid { display: grid; gap: 12px; }
.md\:grid-cols-2 { grid-template-columns: 1fr; }
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}
</style>
