import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/CalendarView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/content',
    name: 'Content',
    component: () => import('../views/ContentView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/content/new',
    name: 'NewPost',
    component: () => import('../views/PostFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/content/:id/edit',
    name: 'EditPost',
    component: () => import('../views/PostFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/approval',
    name: 'Approval',
    component: () => import('../views/ApprovalView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pillars',
    name: 'Pillars',
    component: () => import('../views/PillarsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
