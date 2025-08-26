import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'
import MyProfile from '../pages/MyProfile.vue'   // ⬅️ direct import (temporary)

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: MyTasksPage },
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
        { path: '/users/new', name: 'create-user', component: () => import('../pages/CreateUser.vue') },
        { path: '/profile', name: 'profile', component: MyProfile }, // ⬅️ add this
    ],
    scrollBehavior: () => ({ top: 0 }),
})

export default router
