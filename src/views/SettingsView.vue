<template>
  <div class="settings-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración</h1>
        <p class="page-subtitle">Conexión con Meta Graph API y preferencias del sistema</p>
      </div>
    </div>

    <!-- Meta API Connection -->
    <div class="card settings-section">
      <h3 class="section-title">🔗 Conexión con Meta Graph API</h3>
      <div class="connection-status" :class="{ connected: apiStatus.configured }">
        <span class="status-dot"></span>
        <span>{{ apiStatus.message || 'Verificando conexión...' }}</span>
      </div>

      <div class="form-group">
        <label>Meta Access Token</label>
        <input type="password" v-model="settings.accessToken"
               placeholder="Pega tu token de acceso de Meta aquí" />
        <small class="form-help">Obtén tu token en <a href="https://developers.facebook.com/" target="_blank">Meta for Developers</a>. Token de larga duración recomendado (60 días).</small>
      </div>

      <div class="form-group">
        <label>Instagram Business Account ID</label>
        <input v-model="settings.igAccountId" placeholder="Ej: 17841400123456789" />
        <small class="form-help">El ID de tu cuenta de Instagram Business vinculada a la Facebook Page.</small>
      </div>

      <div class="setup-guide card-glass">
        <h4>📋 Guía de Configuración</h4>
        <ol>
          <li>Convierte tu cuenta de Instagram a <strong>Business</strong> o <strong>Creator</strong></li>
          <li>Vincula la cuenta a una <strong>Facebook Page</strong></li>
          <li>Crea una app en <a href="https://developers.facebook.com/" target="_blank">Meta for Developers</a></li>
          <li>Agrega el producto <strong>Instagram</strong> a tu app</li>
          <li>Genera un <strong>token de acceso de usuario</strong> con permisos:
            <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_read_engagement</code>
          </li>
          <li>Intercambia por un <strong>token de larga duración</strong> (60 días)</li>
          <li>Copia el token y el IG Account ID arriba</li>
        </ol>
      </div>

      <button class="btn btn-primary" @click="saveSettings" :disabled="saving">
        💾 Guardar Configuración
      </button>
    </div>

    <!-- Users -->
    <div class="card settings-section">
      <h3 class="section-title">👥 Usuarios del Sistema</h3>
      <div class="users-table">
        <div class="user-row header">
          <span>Usuario</span>
          <span>Email</span>
          <span>Rol</span>
        </div>
        <div class="user-row" v-for="(account, i) in demoAccounts" :key="i">
          <span class="user-cell-name">
            <span class="user-dot" :style="{ background: account.color }"></span>
            {{ account.name }}
          </span>
          <span class="user-cell-email">{{ account.email }}</span>
          <span class="badge" :class="account.role === 'approver' ? 'badge-approved' : 'badge-scheduled'">
            {{ account.role === 'approver' ? 'Aprobador' : 'Creador' }}
          </span>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="card settings-section about-section">
      <h3 class="section-title">ℹ️ Acerca del Sistema</h3>
      <p>Sistema de Gestión de Contenido Instagram para la <strong>Estaca La Serena</strong>.</p>
      <p>Basado en la <em>Estrategia de Comunicación Digital</em> y los 4 pilares estratégicos de contenido.</p>
      <div class="about-meta">
        <span>🏗️ Vue 3 + Vite + Express + SQLite</span>
        <span>📡 Meta Graph API v22.0</span>
        <span>🔐 JWT Auth (2 roles)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const apiStatus = reactive({ configured: false, message: '' })
const saving = ref(false)

const settings = reactive({
  accessToken: '',
  igAccountId: ''
})

const demoAccounts = [
  { name: 'Creador de Contenido', email: 'creador@estaca.cl', role: 'creator', color: '#4a90d9' },
  { name: 'Presidente de Estaca', email: 'aprobador@estaca.cl', role: 'approver', color: '#34c759' }
]

async function checkApiStatus() {
  try {
    const res = await fetch('http://localhost:3001/api/publish/status', {
      headers: auth.getHeaders()
    })
    const data = await res.json()
    apiStatus.configured = data.configured
    apiStatus.message = data.message
  } catch (e) {
    apiStatus.message = 'Error verificando conexión'
  }
}

function saveSettings() {
  saving.value = true
  alert('Para configurar las credenciales de Meta, edita el archivo .env del servidor con:\n\nMETA_ACCESS_TOKEN=tu_token\nIG_BUSINESS_ACCOUNT_ID=tu_id\n\nLuego reinicia el servidor.')
  saving.value = false
}

onMounted(checkApiStatus)
</script>

<style scoped>
.page-header { margin-bottom: 24px; }

.settings-section {
  padding: 28px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 20px;
  background: rgba(245, 166, 35, 0.1);
  color: var(--accent-warning);
}

.connection-status.connected {
  background: rgba(52, 199, 89, 0.1);
  color: var(--accent-success);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.form-group { margin-bottom: 18px; }

.form-help {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.form-help a { color: var(--accent-primary); }

.setup-guide {
  padding: 20px;
  margin: 20px 0;
}

.setup-guide h4 {
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.setup-guide ol {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-guide li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.setup-guide code {
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
}

.users-table {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.user-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  padding: 12px 16px;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}

.user-row:last-child { border-bottom: none; }

.user-row.header {
  background: var(--bg-input);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.user-cell-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.user-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.user-cell-email {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.about-section p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.about-meta {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
