<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listTeamTasks } from '@/services/tasks'

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
const PRIORITY_LABEL_TO_API = { 'Low':'low','Normal':'medium','High':'high','Critical':'critical' }
const PRIORITY_API_TO_LABEL = Object.fromEntries(
  Object.entries(PRIORITY_LABEL_TO_API).map(([k, v]) => [v, k])
)

const tasks = ref([])
const loading = ref(false)
const error = ref('')

const q = ref('')
const statusFilter = ref(null)   // label
const overdueOnly = ref(false)
const onlyMe = ref(false)

const statusOptions = Object.keys(STATUS_LABEL_TO_API)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      q: q.value || undefined,
      status: statusFilter.value ? STATUS_LABEL_TO_API[statusFilter.value] : undefined,
      overdue: overdueOnly.value ? true : undefined,
      assignee: onlyMe.value ? 'me' : undefined,
    }
    tasks.value = await listTeamTasks(params)
  } catch (e) {
    error.value = e?.message || 'Failed to load team tasks.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
let deb
watch([q, statusFilter, overdueOnly, onlyMe], () => { clearTimeout(deb); deb = setTimeout(load, 300) })

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return tasks.value
  return tasks.value.filter(t =>
    String(t.id ?? '').toLowerCase().includes(needle) ||
    String(t.title ?? '').toLowerCase().includes(needle) ||
    String(t.description ?? '').toLowerCase().includes(needle)
  )
})
</script>

<template>
  <div class="page">
    <h1>Team Tasks</h1>

    <section class="toolbar">
      <v-text-field v-model="q" label="Search (id / title / desc)" hide-details density="comfortable" clearable />
      <v-select v-model="statusFilter" :items="statusOptions" label="Status" clearable hide-details density="comfortable" />
      <v-checkbox v-model="overdueOnly" label="Overdue only" density="compact" hide-details />
      <v-checkbox v-model="onlyMe" label="Only mine" density="compact" hide-details />
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
              <span v-if="t.assignee_id">· Assignee #{{ t.assignee_id }}</span>
            </div>
          </div>
          <div class="desc">{{ t.description ?? '—' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 16px; }
.toolbar { display: grid; grid-template-columns: 1fr 220px auto auto auto; gap: 12px; align-items: center; margin: 12px 0; }
@media (max-width: 1000px){ .toolbar { grid-template-columns: 1fr; } }
.status { margin-top: 8px; opacity: .8; }
.status.error { color: #b00020; }
.empty { opacity: .75; padding: 10px; }
.list { display: grid; gap: 12px; }
.item { border: 1px solid #e7e8ec; border-radius: 10px; padding: 12px; }
.row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.title .muted { margin-left: 8px; opacity: .6; font-weight: 400; }
.meta { opacity: .85; display: flex; gap: 8px; flex-wrap: wrap; }
.desc { margin-top: 6px; }
</style>
