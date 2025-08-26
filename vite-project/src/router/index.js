import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'

const routes = [
    { path: '/', name: 'home', component: MyTasksPage },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 }),
})

export default router
