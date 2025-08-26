// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'
import UsersList from '../pages/UsersList.vue' // make sure this file exists

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: MyTasksPage },

        // Tasks
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
        { path: '/team-tasks', name: 'team-tasks', component: () => import('../pages/TeamTasks.vue') }, // NEW

        // Users
        { path: '/users', name: 'users', component: UsersList },
        { path: '/users/new', name: 'create-user', component: () => import('../pages/CreateUser.vue') },

        // Profile
        { path: '/profile', name: 'profile', component: () => import('../pages/MyProfile.vue') },
    ],
    scrollBehavior: () => ({ top: 0 }),
})

export default router
