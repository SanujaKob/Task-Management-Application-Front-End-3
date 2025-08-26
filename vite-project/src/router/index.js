// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: MyTasksPage },
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
    ],
    scrollBehavior: () => ({ top: 0 }),
})

export default router
