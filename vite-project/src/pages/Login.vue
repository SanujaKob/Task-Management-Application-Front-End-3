<template>
  <div class="auth">
    <v-card class="auth-card" elevation="2">
      <v-card-title class="title">Welcome back</v-card-title>
      <v-card-subtitle class="subtitle">Sign in to continue</v-card-subtitle>

      <v-card-text>
        <v-form v-model="isValid" validate-on="blur" @submit.prevent="handleLogin">
          <!-- Username or Email -->
          <v-text-field
            v-model="usernameOrEmail"
            label="Username or email"
            autocomplete="username"
            :rules="[rules.required]"
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
import { login, fetchMe } from '@/services/api' // ← adjust path if needed

const router = useRouter()
const route = useRoute()

const isValid = ref(false)
const loading = ref(false)
const show = ref(false)
const remember = ref(true)
const usernameOrEmail = ref('')
const password = ref('')
const errorMsg = ref('')

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  min: n => v => !v || String(v).length >= n || `Minimum ${n} characters`,
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    // Calls POST /api/auth/login with x-www-form-urlencoded { username, password }
    const { access_token } = await login(
      usernameOrEmail.value.trim(),
      password.value,
      { remember: remember.value },
    )

    // Optional: fetch profile if you exposed /api/me
    try {
      const me = await fetchMe()
      localStorage.setItem('me', JSON.stringify(me))
    } catch { /* no-op */ }

    const redirectTo = route.query.redirect || '/'
    router.replace(String(redirectTo))
  } catch (e) {
    errorMsg.value = e?.message || 'Invalid credentials'
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
  background: #fafafa;
  color: #000;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  color: #000;
  border: 1px solid #ddd;
}
.title { font-weight: 700; color: #000; }
.subtitle { opacity: .8; color: #000; }
.row { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: #000; }
.spacer { flex: 1; }
.forgot { font-size: .9rem; opacity: .9; color: #000; }
</style>
