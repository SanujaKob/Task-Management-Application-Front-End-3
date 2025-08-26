<!-- src/components/Header.vue -->
<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100vw;                  /* keep your full-bleed header */
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.nav > .container {
  max-width: 1200px;            /* fits laptop screens nicely */
  margin: 0 auto;               /* centers horizontally */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 1px;
  box-sizing: border-box;
}

.brand { font-weight: 700; }

.link {
  margin-left: 20px;
  text-decoration: none;
  color: #000;
  opacity: 0.9;
}
.link.active,
.link:hover { opacity: 1; text-decoration: underline; }
</style>

<template>
  <header class="nav">
    <div class="container">
      <div class="brand">ABACUS Task Management Application</div>

      <nav>
        <!-- My Tasks (home) -->
        <RouterLink
          to="/"
          class="link"
          :class="{ active: $route.name === 'home' }"
        >
          My Tasks
        </RouterLink>

        <!-- Create Task -->
        <RouterLink
          to="/tasks/new"
          class="link"
          :class="{ active: $route.name === 'create-task' }"
        >
          Create Task
        </RouterLink>

        <!-- Placeholders (wire these when routes exist) -->
        <a class="link" href="#">Team Tasks</a>
        <a class="link" href="#">Users</a>
        <a class="link" href="#">Create User</a>
        <a class="link" href="#">My Profile</a>
      </nav>
    </div>
  </header>
</template>

<script setup>
// no script needed right now
</script>
