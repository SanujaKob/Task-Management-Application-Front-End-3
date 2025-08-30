// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import MyTasksPage from '@/pages/MyTasksPage.vue';
import UsersList from '@/pages/UsersList.vue';
import { getToken, getRole } from '@/services/auth';

const routes = [
    // Public
    { path: '/login', name: 'login', component: () => import('@/pages/Login.vue'), meta: { public: true } },

    // App (requires auth)
    { path: '/', name: 'home', component: MyTasksPage, meta: { auth: true } },
    { path: '/tasks/new', name: 'create-task', component: () => import('@/pages/CreateTask.vue'), meta: { auth: true } },

    // Manager/Admin only
    { path: '/team-tasks', name: 'team-tasks', component: () => import('@/pages/TeamTasks.vue'), meta: { auth: true, roles: ['manager', 'admin'] } },

    // Admin only
    { path: '/users', name: 'users', component: UsersList, meta: { auth: true, roles: ['admin'] } },
    { path: '/users/new', name: 'create-user', component: () => import('@/pages/CreateUser.vue'), meta: { auth: true, roles: ['admin'] } },

    // Any authed user
    { path: '/profile', name: 'profile', component: () => import('@/pages/MyProfile.vue'), meta: { auth: true } },

    // Friendly errors
    { path: '/403', name: 'forbidden', component: () => import('@/pages/Forbidden.vue'), meta: { public: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue'), meta: { public: true } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() { return { top: 0, left: 0 }; },
});

// ---- Global auth/role guard ----
router.beforeEach((to) => {
    // Public routes always allowed
    if (to.meta?.public) return true;

    // Check auth if required
    if (to.meta?.auth) {
        const token = getToken();
        if (!token) {
            return { name: 'login', query: { redirect: to.fullPath } };
        }

        // If route restricts roles, enforce them
        if (to.meta?.roles?.length) {
            const role = getRole();
            if (!role || !to.meta.roles.includes(role)) {
                return { name: 'forbidden' };
            }
        }
    }

    // Routes without explicit meta default to allow (public)
    return true;
});

export default router;
