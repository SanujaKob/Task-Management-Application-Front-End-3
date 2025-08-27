<template>
  <div class="auth">
    <v-card class="auth-card" elevation="2">
      <v-card-title class="title">Welcome back</v-card-title>
      <v-card-subtitle class="subtitle">Sign in to continue</v-card-subtitle>

      <v-card-text>
        <v-form v-model="isValid" validate-on="blur" @submit.prevent="handleLogin">
          <!-- Email -->
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            :rules="[rules.required, rules.email]"
            :disabled="loading"
            density="comfortable"
            required
          />

          <!-- Password -->
          <v-text-field
            v-model="password"
            :type="show ? 'text' : 'password'"
            label="Password"
            autocomplete="current-password"
            :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="show = !show"
            :rules="[rules.required, rules.min(8)]"
            :disabled="loading"
            density="comfortable"
            required
          />

          <div class="row">
            <v-checkbox
              v-model="remember"
              label="Remember me"
              density="comfortable"
              hide-details
              :disabled="loading"
            />
            <div class="spacer" />
          </div>

          <!-- Error -->
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            class="mt-2"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>

          <!-- Submit -->
          <v-btn
            type="submit"
            color="black"
            class="mt-4"
            block
            :loading="loading"
            :disabled="!isValid || loading"
          >
            Sign In
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const USE_MOCK_AUTH = true

const isValid = ref(false)
const loading = ref(false)
const show = ref(false)
const remember = ref(true)
const email = ref('')
const password = ref('')
const errorMsg = ref('')

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email',
  min: (n) => v => !v || String(v).length >= n || `Minimum ${n} characters`,
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    if (USE_MOCK_AUTH) {
      const ok = email.value.trim() === 'admin@example.com' && password.value === 'password123'
      if (!ok) throw new Error('mock-invalid')

      const token = 'mock-token'
      if (remember.value) localStorage.setItem('auth_token', token)
      else sessionStorage.setItem('auth_token', token)
      localStorage.setItem('me', JSON.stringify({ email: email.value.trim(), name: 'Admin User' }))

      const redirectTo = route.query.redirect || '/'
      router.replace(String(redirectTo))
      return
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), password: password.value }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const token = data.access_token || data.token || ''
    if (!token) throw new Error('No token in response')

    if (remember.value) localStorage.setItem('auth_token', token)
    else sessionStorage.setItem('auth_token', token)
    if (data.user) localStorage.setItem('me', JSON.stringify(data.user))

    const redirectTo = route.query.redirect || '/'
    router.replace(String(redirectTo))
  } catch (e) {
    errorMsg.value = 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth {
  min-height: calc(100dvh - 60px);
  display: grid;
  place-items: center;
  padding: 24px;
  background: #fafafa;       /* light background */
  color: #000;               /* black text */
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;          /* white card */
  color: #000;               /* black text */
  border: 1px solid #ddd;
}

.title { font-weight: 700; color: #000; }
.subtitle { opacity: .8; color: #000; }
.row { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: #000; }
.spacer { flex: 1; }
.forgot { font-size: .9rem; opacity: .9; color: #000; }
</style>
