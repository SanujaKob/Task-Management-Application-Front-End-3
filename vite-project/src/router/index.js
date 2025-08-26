// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MyTasksPage from '../pages/MyTasksPage.vue'
import UsersList from '../pages/UsersList.vue' // make sure file exists EXACTLY here

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: MyTasksPage },
        { path: '/tasks/new', name: 'create-task', component: () => import('../pages/CreateTask.vue') },
        { path: '/users/new', name: 'create-user', component: () => import('../pages/CreateUser.vue') },
        { path: '/users', name: 'users', component: UsersList },
        { path: '/profile', name: 'profile', component: () => import('../pages/MyProfile.vue') },
    ],
    scrollBehavior: () => ({ top: 0 }),
})
export default router
