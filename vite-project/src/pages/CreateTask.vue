<!-- src/pages/CreateTask.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>Create a New Task</h1>
      <p>Organize your work by creating a Task.</p>
      <br></br>

      <v-form v-model="isValid" @submit.prevent="handleSubmit" validate-on="blur">
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
          <v-btn type="submit" color="black" variant="flat" :disabled="submitting || !isValid">
            <template v-if="!submitting">Create Task</template>
            <template v-else>Saving…</template>
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
    // Valid if either empty (other rule handles required) or due >= start
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
}

async function handleSubmit() {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    status: form.status,
    assignee: form.assignee.trim(),
    start_date: form.start_date || null,
    due_date: form.due_date || null,
  }

  submitting.value = true
  message.text = ''
  try {
    // Change to full URL if you’re not using a Vite proxy:
    // const res = await fetch('http://localhost:8000/api/tasks', { ... })
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    resetForm()
    message.type = 'success'
    message.text = 'Task created successfully.'
  } catch (err) {
    message.type = 'error'
    message.text = 'Failed to create task. Check your backend or network.'
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

/* Center the header + paragraph */
.hero {
  margin: 40px auto;
  padding: 0 16px;
  text-align: center;
}
.hero h1 {
  font-size: clamp(24px, 4vw, 32px);
  margin-bottom: 6px;
}
.hero p {
  color: #111;
  margin: 0 0 20px;
}

/* Two columns on desktop, 1 on mobile */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
  text-align: left; /* keep inputs left-aligned even if header is centered */
}
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center; /* center the buttons under the centered header */
}
</style>
