<!-- src/App.vue -->
<template>
  <v-app>
    <v-main> <!-- ✅ add this wrapper for Vuetify layout -->
      <div class="shell">
        <Transition name="fade" mode="out-in">
          <!-- Show login immediately (no header/footer/loading) -->
          <div v-if="isLogin" key="login">
            <RouterView />
          </div>

          <!-- Non-login routes: show loading while booting/fetching -->
          <LoadingPage v-else-if="loading" key="loading" />

          <!-- App layout -->
          <div v-else key="app" class="layout">
            <Header />
            <main class="content">
              <RouterView />
            </main>
            <Footer />
          </div>
        </Transition>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import LoadingPage from './pages/LoadingPage.vue'

const route = useRoute()
const LOADING_MS = 1000

const loading = ref(false)
const isLogin = computed(() => route.name === 'login')

function triggerLoading() {
  loading.value = true
  setTimeout(() => { loading.value = false }, LOADING_MS)
}

onMounted(() => {
  if (!isLogin.value) triggerLoading()
})

watch(
  () => route.name,
  (name) => {
    if (name === 'login') {
      loading.value = false
    } else {
      triggerLoading()
    }
  }
)
</script>

<style>
html, body, #app { height: 100%; }
body {
  margin: 0;
  background: #ffffff;
  color: #000000;
  font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.content { flex: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
