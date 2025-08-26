<!-- src/components/Header.vue -->
<style scoped>
.nav { position: sticky; top: 0; z-index: 10; width: 100vw; background: #ffffff; border-bottom: 1px solid #e5e7eb; }
.nav > .container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 15px 8px; box-sizing: border-box; }
.brand { font-weight: 700; }
nav { display: flex; align-items: center; }
.link { margin-left: 20px; text-decoration: none; color: #000; opacity: 0.9; }
.link.active, .link:hover { opacity: 1; text-decoration: underline; }
.logout-btn { margin-left: 24px; padding: 6px 14px; background: #000; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
.logout-btn:hover { background: #333; }
</style>

<template>
  <header class="nav">
    <div class="container">
      <div class="brand">ABACUS Task Management Application</div>

      <nav>
        <RouterLink to="/" class="link" :class="{ active: $route.name === 'home' }">My Tasks</RouterLink>
        <RouterLink to="/tasks/new" class="link" :class="{ active: $route.name === 'create-task' }">Create Task</RouterLink>
        <RouterLink to="/team-tasks" class="link" :class="{ active: $route.name === 'team-tasks' }">Team Tasks</RouterLink>
        <RouterLink to="/users" class="link" :class="{ active: $route.name === 'users' }">Users</RouterLink>
        <RouterLink to="/users/new" class="link" :class="{ active: $route.name === 'create-user' }">Create User</RouterLink>
        <RouterLink to="/profile" class="link" :class="{ active: $route.name === 'profile' }">My Profile</RouterLink>

        <!-- Logout -->
        <button class="logout-btn" type="button" @click="logout">Log Out</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

async function logout() {
  try {
    // Optional: await fetch('/api/logout', { method: 'POST' })
    localStorage.removeItem('auth_token')
    sessionStorage.clear()

    // If you DON'T have a 'login' route yet, send to 'home'
    await router.replace({ name: 'home' })
  } catch (e) {
    console.error('Logout navigation failed', e)
    // hard fallback
    window.location.href = '/'
  }
}
</script>
