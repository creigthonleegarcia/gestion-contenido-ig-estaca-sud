<template>
  <div class="app-root">
    <template v-if="auth.isAuthenticated && $route.path !== '/login'">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">⛪</div>
          <div class="brand-text">
            <span class="brand-name">Estaca La Serena</span>
            <span class="brand-sub">Instagram Manager</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/calendar" class="nav-item" active-class="active">
            <span class="nav-icon">📅</span>
            <span>Calendario</span>
          </router-link>
          <router-link to="/content" class="nav-item" active-class="active">
            <span class="nav-icon">📝</span>
            <span>Contenido</span>
          </router-link>
          <router-link to="/approval" class="nav-item" active-class="active">
            <span class="nav-icon">✅</span>
            <span>Aprobación</span>
            <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
          </router-link>
          <router-link to="/pillars" class="nav-item" active-class="active">
            <span class="nav-icon">🏛️</span>
            <span>Pilares</span>
          </router-link>
          <router-link to="/settings" class="nav-item" active-class="active">
            <span class="nav-icon">⚙️</span>
            <span>Configuración</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar" :style="{ background: auth.user?.avatar_color }">
              {{ auth.user?.name?.[0] || 'U' }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ auth.user?.name }}</div>
              <div class="user-role">{{ auth.user?.role === 'approver' ? 'Aprobador' : 'Creador' }}</div>
            </div>
            <button class="logout-btn" @click="handleLogout" title="Cerrar sesión">⏻</button>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <router-view />
      </main>
    </template>

    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()
const pendingCount = ref(0)

async function fetchPendingCount() {
  if (!auth.isAuthenticated) return
  try {
    const res = await fetch('http://localhost:3001/api/approval/queue', {
      headers: auth.getHeaders()
    })
    const data = await res.json()
    pendingCount.value = Array.isArray(data) ? data.length : 0
  } catch (e) { /* ignore */ }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  fetchPendingCount()
  setInterval(fetchPendingCount, 30000)
})
</script>

<style>
.app-root {
  display: flex;
  min-height: 100vh;
  background: var(--gray-2);
}

/* Sidebar — Clean white, institutional */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-level1);
  border-right: 1px solid var(--border-tertiary);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-tertiary);
}

.brand-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  border-radius: var(--radius-sm);
  color: white;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font: 700 0.9rem/1.3 var(--font-serif);
  color: var(--text-primary);
}

.brand-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 400;
}

.sidebar-nav {
  flex: 1;
  padding: var(--sp-16) var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 400;
  transition: all var(--transition-fast);
  text-decoration: none;
  position: relative;
  min-height: 44px; /* a11y: minimum touch target */
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item:active {
  background: var(--bg-active);
  transform: scale(0.98);
  transition-duration: 60ms;
}

.nav-item.active {
  background: var(--bg-hover);
  color: var(--accent-primary);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  font-size: 1rem;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
  background: var(--accent-emphasis);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  min-width: 20px;
  text-align: center;
  line-height: 1.4;
}

.sidebar-footer {
  padding: var(--sp-16);
  border-top: 1px solid var(--border-tertiary);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--sp-8);
  border-radius: var(--radius-sm);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.logout-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  min-height: 44px; /* a11y */
}

.logout-btn:hover {
  background: #fde8e8;
  color: var(--accent-danger);
}

.logout-btn:active {
  transform: scale(0.92);
  transition-duration: 60ms;
}

/* Main content — Soft gray background */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--sp-32);
  min-height: 100vh;
  background: var(--gray-2);
}
</style>
