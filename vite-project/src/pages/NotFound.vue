<template>
  <div class="page">
    <v-card class="card" elevation="2">
      <v-card-title class="title">404 — Not Found</v-card-title>
      <v-card-text class="text">
        The page you’re looking for doesn’t exist.
      </v-card-text>
      <v-card-actions>
        <RouterLink to="/" class="btn">Go Home</RouterLink>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page { min-height: calc(100dvh - 60px); display: grid; place-items: center; padding: 24px; }
.card { max-width: 520px; width: 100%; }
.title { font-weight: 700; }
.text { opacity: .9; }
.btn { display: inline-block; padding: 8px 14px; background: #000; color: #fff; border-radius: 8px; text-decoration: none; }
.btn:hover { background: #333; }
</style>
