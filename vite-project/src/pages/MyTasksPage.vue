<!-- src/pages/MyTasksPage.vue -->
<script setup>
import { ref, onMounted } from "vue";
import MyTaskDashboard from "@/components/MyTaskDashboard.vue";
import MyTasksBreakdown from "@/components/MyTasksBreakdown.vue";

// Use your resilient service
import {
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  listMyTasks,
  listTasks,
  listAssignees,
} from "@/services/tasks";

/** Flip this to "assignee" if your backend expects that key */
const ASSIGNEE_KEY = "assignee_id";

/* state */
const tasks = ref([]);
const loading = ref(false);
const error = ref("");

/* current user */
const currentUser = localStorage.getItem("full_name") || "Sanuja";
const currentUserId = localStorage.getItem("user_id") || "";

/* options */
const statusOptions = ["To Do","In Progress","Completed","Approved","Rejected","Re-Submission"];
const priorityOptions = ["Low","Medium","High"];

/* users (optional) */
const users = ref([]);
const usersLoading = ref(false);

/* edit dialog */
const editOpen = ref(false);
const draft = ref(null);
const editErr = ref("");

/* helpers */
function mapTask(raw) {
  const assignee_id = raw.assignee_id ?? raw.assignee ?? null;
  return {
    id: raw.id ?? raw._id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    status: raw.status ?? "To Do",
    priority: raw.priority ?? "Medium",
    due_date: raw.due_date ?? raw.dueDate ?? null,
    percent_complete: raw.percent_complete ?? raw.progress ?? 0,
    assignee_id,
    assignee: assignee_id,
    created_by: raw.created_by ?? raw.created_by_id ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? null,
    updated_at: raw.updated_at ?? raw.updatedAt ?? null,
  };
}

/* loads */
async function fetchTasks() {
  loading.value = true; error.value = "";
  try {
    let data = [];
    try {
      data = await listMyTasks();
    } catch {
      // fallback: list all and client-filter
      data = await listTasks();
    }
    let list = (Array.isArray(data) ? data : []).map(mapTask);

    if (currentUserId) {
      const me = String(currentUserId).toLowerCase();
      const filtered = list.filter(
        (t) =>
          String(t.assignee_id ?? "").toLowerCase() === me ||
          String(t.created_by ?? "").toLowerCase() === me
      );
      if (filtered.length) list = filtered;
    }
    tasks.value = list;
  } catch (e) {
    error.value = e?.message || "Failed to fetch tasks";
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  usersLoading.value = true;
  try {
    const data = await listAssignees();
    const arr = Array.isArray(data) ? data : [];
    users.value = arr.map((u) => ({
      id: u.id ?? u._id ?? u.username ?? u.email,
      label: u.full_name || u.username || u.email || String(u.id),
    }));
  } catch {
    users.value = [];
  } finally {
    usersLoading.value = false;
  }
}

/* interactions */
async function onUpdateStatus({ id, newStatus }) {
  // optimistic immutable update -> triggers regrouping
  const prevTasks = tasks.value;
  const nextTasks = prevTasks.map((t) =>
    t.id === id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
  );
  tasks.value = nextTasks;

  try {
    await apiUpdateTask(id, { status: newStatus });
  } catch (e) {
    tasks.value = prevTasks; // revert
    console.error("Update status failed:", e?.message || e);
  }
}

function onEdit(task) {
  editErr.value = "";
  draft.value = {
    ...task,
    assignee_id: task.assignee_id ?? task.assignee ?? null,
    percent_complete: Number.isFinite(task.percent_complete) ? task.percent_complete : 0,
  };
  editOpen.value = true;
}

async function saveEdit() {
  if (!draft.value) return;
  editErr.value = "";

  const id = draft.value.id;
  const payload = {
    title: draft.value.title?.trim() || "",
    description: draft.value.description ?? "",
    status: draft.value.status,
    priority: draft.value.priority,
    percent_complete: Math.max(0, Math.min(100, Number(draft.value.percent_complete ?? 0))),
    due_date: draft.value.due_date || null,
    [ASSIGNEE_KEY]: draft.value.assignee_id ?? null,
  };

  // optimistic immutable update
  const prevTasks = tasks.value;
  tasks.value = prevTasks.map((t) =>
    t.id === id ? { ...t, ...payload, assignee_id: payload[ASSIGNEE_KEY], updated_at: new Date().toISOString() } : t
  );

  try {
    await apiUpdateTask(id, payload);
    editOpen.value = false;
  } catch (e) {
    tasks.value = prevTasks; // revert
    editErr.value = e?.message || "Update failed";
  }
}

async function onDelete(task) {
  const ok = window.confirm(`Delete task ${task.id}?`);
  if (!ok) return;
  try {
    await apiDeleteTask(task.id);
    tasks.value = tasks.value.filter((t) => t.id !== task.id);
  } catch (e) {
    console.error("Delete failed:", e?.message || e);
  }
}

/* init */
onMounted(async () => {
  await fetchTasks();
  fetchUsers(); // optional
});
</script>

<template>
  <div class="page">
    <main class="hero">
      <h1>Stay on top of your tasks</h1>
      <p>Simple, fast task management - create tasks, track progress, and hit deadlines.</p>

      <div v-if="loading" class="status">Loading your tasks…</div>
      <div v-else-if="error" class="status error">{{ error }}</div>

      <section class="home">
        <MyTaskDashboard :tasks="tasks" />
      </section>

      <section class="home">
        <MyTasksBreakdown
          :tasks="tasks"
          :currentUser="currentUser"
          :currentUserId="currentUserId"
          :users="users"
          @update-status="onUpdateStatus"
          @edit="onEdit"
          @delete="onDelete"
        />
      </section>
    </main>

    <!-- Edit dialog (unchanged layout) -->
    <v-dialog v-model="editOpen" max-width="720">
      <v-card>
        <v-card-title>Edit Task</v-card-title>

        <v-card-text v-if="draft" class="grid gap-3">
          <v-alert v-if="editErr" type="error" density="comfortable" variant="tonal">
            {{ editErr }}
          </v-alert>

          <v-text-field v-model="draft.title" label="Title" />
          <v-textarea v-model="draft.description" label="Description" auto-grow />

          <div class="grid md:grid-cols-2 gap-3">
            <v-select :items="statusOptions" v-model="draft.status" label="Status" />
            <v-select :items="priorityOptions" v-model="draft.priority" label="Priority" />
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <template v-if="users.length">
              <v-autocomplete
                v-model="draft.assignee_id"
                :items="users"
                item-title="label"
                item-value="id"
                :loading="usersLoading"
                label="Assignee"
                :return-object="false"
                clearable
              />
            </template>
            <template v-else>
              <v-text-field v-model="draft.assignee_id" label="Assignee" />
            </template>

            <v-text-field :model-value="draft.created_by ?? '—'" label="Created By" readonly />
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
.hero { max-width: 960px; margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 10px; }
.hero p { color: #111; margin: 0 auto 12px; max-width: 600px; }
.status { margin: 8px 0 0; font-size: 14px; }
.status.error { color: #b91c1c; }
.home { margin-top: 24px; text-align: left; }
.grid { display: grid; gap: 12px; }
.md\:grid-cols-2 { grid-template-columns: 1fr; }
@media (min-width: 768px) { .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); } }
</style>
