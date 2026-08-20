<template>
  <div class="app-root">
    <template v-if="auth.isAuthenticated && $route.path !== '/login'">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/>
              <path d="M5 21V7l7-4 7 4v14"/>
              <path d="M9 21v-6h6v6"/>
              <path d="M10 9h4"/>
              <path d="M12 7v4"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Estaca La Serena</span>
            <span class="brand-sub">Instagram Manager</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="9"/>
                <rect x="14" y="3" width="7" height="5"/>
                <rect x="14" y="12" width="7" height="9"/>
                <rect x="3" y="16" width="7" height="5"/>
              </svg>
            </span>
            <span>Dashboard</span>
          </router-link>

          <router-link to="/calendar" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span>Calendario</span>
          </router-link>

          <router-link to="/content" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            <span>Contenido</span>
          </router-link>

          <router-link to="/approval" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            <span>Aprobación</span>
            <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
          </router-link>

          <router-link to="/pillars" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="21" x2="20" y2="21"/>
                <line x1="4" y1="7" x2="20" y2="7"/>
                <polyline points="2 7 12 2 22 7"/>
                <line x1="7" y1="7" x2="7" y2="21"/>
                <line x1="12" y1="7" x2="12" y2="21"/>
                <line x1="17" y1="7" x2="17" y2="21"/>
              </svg>
            </span>
            <span>Pilares</span>
          </router-link>

          <router-link to="/settings" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
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
            <button class="logout-btn" @click="handleLogout" title="Cerrar sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
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
    const res = await fetch('/api/approval/queue', {
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
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  border-radius: var(--radius-sm);
  color: white;
  flex-shrink: 0;
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
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 400;
  transition: all var(--transition-fast);
  text-decoration: none;
  position: relative;
  min-height: 44px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: currentColor;
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
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 34px;
}

.logout-btn:hover {
  background: #fde8e8;
  border-color: #fca5a5;
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
