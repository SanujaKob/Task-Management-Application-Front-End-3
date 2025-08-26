<!-- StatusPanels.vue -->
<template>
  <div class="mt-4">
    <v-expansion-panels v-model="openStatusPanels" multiple>
      <v-expansion-panel v-for="status in orderedStatuses" :key="status">
        <v-expansion-panel-title>
          <b>{{ status }}</b>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div v-if="(grouped[status]?.length || 0) === 0" class="py-6 text-sm opacity-70">
            No tasks in “{{ status }}”.
          </div>

          <v-expansion-panels v-else accordion class="border rounded-lg">
            <v-expansion-panel v-for="t in grouped[status]" :key="t.id">
              <!-- Row (collapsed view) -->
              <v-expansion-panel-title>
                <div class="flex items-center justify-between gap-3 w-full">
                  <div class="min-w-0">
                    <div class="truncate font-medium">
                      {{ t.title || 'Untitled Task' }}
                    </div>
                    <div class="text-xs opacity-70 mt-1 truncate">
                      ID: {{ t.id }} • Due: {{ formatDate(t.due_date) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <v-chip size="x-small" :color="priorityColor(t.priority)" variant="flat">
                      {{ (t.priority || 'normal').toString().toUpperCase() }}
                    </v-chip>
                    <v-chip v-if="t.percent_complete != null" size="x-small" variant="outlined">
                      {{ t.percent_complete }}%
                    </v-chip>
                  </div>
                </div>
              </v-expansion-panel-title>

              <!-- Details (expanded view) -->
              <v-expansion-panel-text>
                <div class="space-y-3">
                  <!-- Description -->
                  <div class="text-sm">
                    <span class="font-medium">Description:</span>
                    <div class="mt-1 whitespace-pre-line">
                      {{ t.description || '—' }}
                    </div>
                  </div>

                  <v-divider></v-divider>

                  <!-- Read-only fields -->
                  <div class="grid gap-3 sm:grid-cols-2 text-sm">
                    <div><span class="font-medium">Task ID:</span> {{ t.id }}</div>
                    <div><span class="font-medium">Status:</span> {{ localStatus[t.id] ?? normalizeStatus(t.status) }}</div>
                    <div><span class="font-medium">Assignee:</span> {{ t.assignee || '—' }}</div>
                    <div><span class="font-medium">Created By:</span> {{ t.created_by || '—' }}</div>
                    <div><span class="font-medium">Created At:</span> {{ formatDateTime(t.created_at) }}</div>
                    <div><span class="font-medium">Updated At:</span> {{ formatDateTime(t.updated_at) }}</div>
                    <div><span class="font-medium">Due Date:</span> {{ formatDate(t.due_date) }}</div>
                  </div>

                  <!-- Editable status + Save/Reset (manual move between panels) -->
                  <div class="grid gap-3 sm:grid-cols-3 items-end">
                    <v-select
                      :items="orderedStatuses"
                      label="Change Status"
                      variant="outlined"
                      density="comfortable"
                      v-model="localStatus[t.id]"
                      :model-value="localStatus[t.id]"
                      :hint="`Current: ${normalizeStatus(t.status)}`"
                      persistent-hint
                    />
                    <div class="flex gap-2">
                      <v-btn
                        size="small"
                        variant="tonal"
                        :disabled="!isDirty(t)"
                        @click="saveStatus(t)"
                      >
                        Save
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        :disabled="!isDirty(t)"
                        @click="resetStatus(t)"
                      >
                        Reset
                      </v-btn>
                    </div>
                  </div>

                  <!-- Actions (Open removed by request) -->
                  <div class="flex gap-2 pt-2">
                    <v-btn size="small" variant="text" @click="emit('edit', t)">Edit</v-btn>
                    <v-btn size="small" variant="text" color="error" @click="emit('delete', t)">Delete</v-btn>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  currentUser: { type: String, default: '' }
})
const emit = defineEmits(['edit', 'delete', 'update-status'])

const orderedStatuses = [
  'To Do',
  'In Progress',
  'Completed',
  'Approved',
  'Rejected',
  'Re-Submission',
]

/** start closed (prevents stray "0") */
const openStatusPanels = ref([])

/** Local editable map of taskId -> status */
const localStatus = ref({})

/** sync local status with tasks input */
watch(
  () => props.tasks,
  list => {
    const map = {}
    for (const t of list) map[t.id] = normalizeStatus(t.status)
    localStatus.value = map
  },
  { immediate: true, deep: true }
)

const mine = computed(() => {
  if (!props.currentUser) return props.tasks
  return props.tasks.filter(t =>
    (t.created_by && t.created_by === props.currentUser) ||
    (t.assignee && t.assignee === props.currentUser)
  )
})

const grouped = computed(() => {
  const buckets = Object.fromEntries(orderedStatuses.map(s => [s, []]))
  for (const t of mine.value) {
    const s = normalizeStatus(t.status)
    if (!buckets[s]) buckets[s] = []
    buckets[s].push(t)
  }
  for (const k of Object.keys(buckets)) {
    buckets[k].sort((a, b) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
      const bd = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
      if (ad !== bd) return ad - bd
      return (a.title || '').localeCompare(b.title || '')
    })
  }
  return buckets
})

function isDirty(t) {
  return (localStatus.value[t.id] ?? normalizeStatus(t.status)) !== normalizeStatus(t.status)
}

function saveStatus(t) {
  const newStatus = localStatus.value[t.id]
  emit('update-status', { id: t.id, newStatus })
}

function resetStatus(t) {
  localStatus.value[t.id] = normalizeStatus(t.status)
}

/** utils */
function normalizeStatus(s) {
  if (!s) return 'To Do'
  const x = s.toString().toLowerCase().trim()
  if (x.includes('re-sub') || x.includes('resub')) return 'Re-Submission'
  if (x.includes('reject')) return 'Rejected'
  if (x.includes('approve')) return 'Approved'
  if (x.includes('complete') || x === 'done') return 'Completed'
  if (x.includes('progress') || x === 'doing') return 'In Progress'  // <-- fixed (removed extra ')')
  return 'To Do'
}
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}
function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}
function priorityColor(p) {
  const v = (p || '').toString().toLowerCase()
  if (v === 'high') return 'error'
  if (v === 'medium') return 'warning'
  if (v === 'low') return 'success'
  return undefined
}
</script>

<style scoped>
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: .5rem; }
.gap-3 { gap: .75rem; }
.mt-1 { margin-top: .25rem; }
.mt-4 { margin-top: 1rem; }
.min-w-0 { min-width: 0; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.space-y-3 > * + * { margin-top: .75rem; }
.border { border: 1px solid var(--v-border-color, rgba(0,0,0,.12)); }
.rounded-lg { border-radius: .5rem; }
.opacity-70 { opacity: .7; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
</style>
