// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'
import CreateUser from '../pages/CreateUser.vue'  // <-- direct import

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: MyTasksPage },
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
        { path: '/users/new', name: 'create-user', component: CreateUser }, // <-- use direct import
    ],
    scrollBehavior: () => ({ top: 0 }),
})

export default router
