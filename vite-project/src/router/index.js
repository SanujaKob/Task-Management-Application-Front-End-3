// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'
import UsersList from '../pages/UsersList.vue' // make sure this file exists

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Public
        { path: '/login', name: 'login', component: () => import('../pages/Login.vue') }, // NEW

        // App
        { path: '/', name: 'home', component: MyTasksPage },
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
        { path: '/team-tasks', name: 'team-tasks', component: () => import('../pages/TeamTasks.vue') }, // NEW
        { path: '/users', name: 'users', component: UsersList },
        { path: '/users/new', name: 'create-user', component: () => import('../pages/CreateUser.vue') },
        { path: '/profile', name: 'profile', component: () => import('../pages/MyProfile.vue') },
    ],
    scrollBehavior: () => ({ top: 0 }),
})

/**
 * Simple auth guard:
 * - Allows /login without a token
 * - Redirects everything else to /login if no token is found
 * - Preserves intended destination in ?redirect=
 */
router.beforeEach((to) => {
    // Public route
    if (to.name === 'login') return true

    // Require token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }

    return true
})


export default router
