<template>
  <div class="dashboard animate-in">
    <!-- Profile & Header Banner -->
    <header class="dash-hero">
      <div class="profile-meta">
        <div class="avatar-container">
          <img
            v-if="profile?.profile_picture_url"
            :src="profile.profile_picture_url"
            :alt="profile.name"
            class="profile-avatar"
          />
          <div v-else class="avatar-fallback">⛪</div>
          <span class="live-dot" :title="metaConnected ? 'Conexión activa' : 'Sin conexión'"></span>
        </div>

        <div class="profile-info">
          <div class="title-row">
            <h1 class="profile-title">{{ profile?.name || 'Estaca La Serena' }}</h1>
            <a
              v-if="profile?.username"
              :href="`https://instagram.com/${profile.username}`"
              target="_blank"
              class="ig-handle-badge"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              @{{ profile.username }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
          <p class="profile-bio">
            {{ profile?.biography || 'Sistema de gestión y optimización de contenido para el Consejo de Comunicaciones.' }}
          </p>
        </div>
      </div>

      <div class="hero-actions">
        <div class="meta-status-pill" :class="{ connected: metaConnected }">
          <span class="pulse-indicator"></span>
          <span>{{ metaConnected ? 'Meta API v22.0 En Vivo' : 'Modo Demostración' }}</span>
        </div>
        <button
          class="btn-sync"
          @click="refreshData"
          :disabled="isRefreshing"
          title="Actualizar métricas en tiempo real"
        >
          <svg
            :class="{ 'spin-anim': isRefreshing }"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/>
          </svg>
          <span>{{ isRefreshing ? 'Sincronizando...' : 'Actualizar' }}</span>
        </button>
      </div>
    </header>

    <!-- Key Metrics Grid -->
    <section class="metrics-grid" v-if="overview">
      <div class="metric-card" v-for="m in metrics" :key="m.label">
        <div class="metric-header">
          <span class="metric-label">{{ m.label }}</span>
          <div class="metric-icon" :style="{ background: m.bg }">
            <component :is="m.iconSvg" />
          </div>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ m.value }}</div>
          <div class="metric-trend" v-if="m.subtext">
            <span>{{ m.subtext }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Audience Best Time & Reach Heatmap Banner -->
    <section class="peak-hours-card card" v-if="overview?.bestHours?.length">
      <div class="peak-header">
        <div class="peak-title-wrap">
          <div class="peak-icon">⏰</div>
          <div>
            <h3 class="card-title">Ventana Óptima de Publicación</h3>
            <p class="card-subtitle">Seguidores activos por hora en La Serena / Coquimbo</p>
          </div>
        </div>
        <div class="peak-badge">
          Pico: <strong>{{ topHour.hour }}:00 hrs</strong> ({{ topHour.count }} en línea)
        </div>
      </div>

      <div class="hours-timeline">
        <div
          v-for="h in sortedHoursByTime"
          :key="h.hour"
          class="hour-col"
          :class="{ 'is-peak': h.hour === topHour.hour }"
          :title="`${h.hour}:00 hrs - ${h.count} seguidores online`"
        >
          <div class="hour-bar-track">
            <div
              class="hour-bar-fill"
              :style="{ height: `${Math.round((h.count / maxHourCount) * 100)}%` }"
            ></div>
          </div>
          <span class="hour-label">{{ h.hour }}h</span>
        </div>
      </div>
    </section>

    <!-- Charts Row -->
    <section class="charts-grid" v-if="overview">
      <div class="card chart-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Evolución de Alcance y Audiencia</h3>
            <p class="card-subtitle">Rendimiento orgánico histórico</p>
          </div>
          <span class="chart-badge">Últimos 30 días</span>
        </div>
        <div class="canvas-wrapper">
          <canvas ref="reachChartRef"></canvas>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Distribución por Pilar</h3>
            <p class="card-subtitle">Balance estratégico de contenido</p>
          </div>
        </div>
        <div class="canvas-wrapper doughnut-wrap">
          <canvas ref="pillarChartRef"></canvas>
        </div>
      </div>
    </section>

    <!-- Bottom Row: Smart Recommendations + Top Posts -->
    <section class="bottom-grid">
      <!-- Recommendations Engine -->
      <div class="card recommendations-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Recomendaciones del Algoritmo</h3>
            <p class="card-subtitle">Acciones estratégicas sugeridas para el comité</p>
          </div>
          <span class="recs-count">{{ recommendations.length }} activas</span>
        </div>

        <div class="recommendations-list">
          <article
            v-for="rec in recommendations"
            :key="rec.title"
            class="rec-item"
            :style="{ borderLeftColor: rec.color }"
          >
            <div class="rec-top">
              <span class="rec-icon">{{ rec.icon }}</span>
              <div class="rec-title-wrap">
                <h4 class="rec-title">{{ rec.title }}</h4>
                <span v-if="rec.realtime" class="live-pill">En vivo</span>
              </div>
              <span class="badge" :class="`badge-${rec.priority}`">{{ rec.priority }}</span>
            </div>
            <p class="rec-desc">{{ rec.description }}</p>
          </article>

          <div v-if="recommendations.length === 0" class="empty-state">
            <p>Todo el contenido está optimizado 🎉</p>
          </div>
        </div>
      </div>

      <!-- Top Performing Instagram Posts -->
      <div class="card top-posts-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Publicaciones con Mayor Impacto</h3>
            <p class="card-subtitle">Contenido de @estacalaserena con mejor interacción</p>
          </div>
        </div>

        <div v-if="overview?.topPosts?.length" class="top-posts-list">
          <a
            v-for="(post, index) in overview.topPosts"
            :key="post.id || index"
            :href="post.permalink"
            target="_blank"
            rel="noopener noreferrer"
            class="top-post-card"
          >
            <div class="rank-badge">#{{ index + 1 }}</div>
            
            <div class="post-media-wrap">
              <img
                v-if="post.media_url"
                :src="post.media_url"
                class="post-thumb"
                :alt="post.caption"
                loading="lazy"
              />
              <div v-else class="post-thumb-fallback">📸</div>
            </div>

            <div class="post-details">
              <p class="post-caption">{{ post.caption || 'Publicación en Instagram' }}</p>
              <div class="post-metrics-row">
                <span class="p-stat" title="Alcance total">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ post.reach || 0 }}
                </span>
                <span class="p-stat" title="Me gusta">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {{ post.like_count || 0 }}
                </span>
                <span class="p-stat" title="Compartidos (Señal #1)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {{ post.shares || 0 }}
                </span>
                <span class="p-stat" title="Guardados">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {{ post.saved || 0 }}
                </span>
              </div>
            </div>

            <div class="post-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </a>
        </div>

        <div v-else class="empty-state">
          <p>Cargando publicaciones destacadas...</p>
        </div>
      </div>
    </section>

    <!-- Pipeline Workflow Bar -->
    <section class="pipeline-bar card" v-if="overview?.postStats">
      <div class="pipeline-title-group">
        <span class="pipeline-legend">Flujo Editorial</span>
        <span class="pipeline-total">{{ overview.postStats.total_posts || 0 }} publicaciones en gestión</span>
      </div>

      <div class="pipeline-steps">
        <div v-for="st in statusList" :key="st.key" class="pipeline-step">
          <div class="step-badge-dot" :class="`badge-${st.badge}`"></div>
          <div class="step-info">
            <span class="step-num">{{ overview.postStats[st.key] || 0 }}</span>
            <span class="step-name">{{ st.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, h } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useInsightsStore } from '../stores/index'

Chart.register(...registerables)

const insightsStore = useInsightsStore()
const reachChartRef = ref(null)
const pillarChartRef = ref(null)
const metaConnected = ref(false)
const isRefreshing = ref(false)

let reachChartInstance = null
let pillarChartInstance = null

const overview = computed(() => insightsStore.overview)
const recommendations = computed(() => insightsStore.recommendations)
const profile = computed(() => overview.value?.profile)

// SVG Icons components
const IconUsers = () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: 9, cy: 7, r: 4 }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
])

const IconEye = () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
  h('circle', { cx: 12, cy: 12, r: 3 })
])

const IconHeart = () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })
])

const IconGrid = () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 3, y: 3, width: 7, height: 7 }),
  h('rect', { x: 14, y: 3, width: 7, height: 7 }),
  h('rect', { x: 14, y: 14, width: 7, height: 7 }),
  h('rect', { x: 3, y: 14, width: 7, height: 7 })
])

const metrics = computed(() => {
  if (!overview.value) return []
  const latest = overview.value.latestInsight || {}
  const prof = overview.value.profile || {}
  return [
    {
      label: 'Seguidores Reales',
      value: prof.followers_count || latest.followers || 0,
      bg: '#007da5',
      iconSvg: IconUsers,
      subtext: `@${prof.username || 'estacalaserena'}`
    },
    {
      label: 'Alcance Mensual (28d)',
      value: latest.reach || 0,
      bg: '#318d43',
      iconSvg: IconEye,
      subtext: 'Cuentas únicas alcanzadas'
    },
    {
      label: 'Cuentas con Interacción',
      value: latest.accounts_engaged || 0,
      bg: '#d45311',
      iconSvg: IconHeart,
      subtext: 'Likes, comentarios y envíos'
    },
    {
      label: 'Publicaciones en Feed',
      value: prof.media_count || overview.value.postStats?.total_posts || 0,
      bg: '#006184',
      iconSvg: IconGrid,
      subtext: 'Contenido total publicado'
    },
  ]
})

const sortedHoursByTime = computed(() => {
  if (!overview.value?.bestHours) return []
  return [...overview.value.bestHours].sort((a, b) => a.hour - b.hour)
})

const topHour = computed(() => {
  if (!overview.value?.bestHours?.length) return { hour: 18, count: 0 }
  return overview.value.bestHours[0]
})

const maxHourCount = computed(() => {
  if (!overview.value?.bestHours?.length) return 1
  return Math.max(...overview.value.bestHours.map(h => h.count), 1)
})

const statusList = [
  { key: 'drafts', label: 'Borradores', badge: 'draft' },
  { key: 'pending_review', label: 'En revisión', badge: 'in_review' },
  { key: 'scheduled', label: 'Programados', badge: 'scheduled' },
  { key: 'published', label: 'Publicados', badge: 'published' },
  { key: 'rejected', label: 'Observados', badge: 'rejected' },
]

function renderCharts() {
  if (reachChartInstance) reachChartInstance.destroy()
  if (pillarChartInstance) pillarChartInstance.destroy()

  // 1. Reach Chart
  if (reachChartRef.value && overview.value?.accountGrowth?.length) {
    const data = overview.value.accountGrowth
    reachChartInstance = new Chart(reachChartRef.value, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const dt = new Date(d.date)
          return `${dt.getDate()}/${dt.getMonth() + 1}`
        }),
        datasets: [
          {
            label: 'Interacción / Alcance',
            data: data.map(d => d.reach),
            borderColor: '#007da5',
            backgroundColor: 'rgba(0, 125, 165, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 2
          },
          {
            label: 'Seguidores',
            data: data.map(d => d.followers),
            borderColor: '#318d43',
            backgroundColor: 'transparent',
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: '#53575b', font: { family: 'Roboto', size: 11 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#212225',
            padding: 10,
            cornerRadius: 4
          }
        },
        scales: {
          x: { ticks: { color: '#878a8c', font: { size: 10 } }, grid: { color: '#f0f1f1' } },
          y: { ticks: { color: '#878a8c', font: { size: 10 } }, grid: { color: '#f0f1f1' } }
        }
      }
    })
  }

  // 2. Pillar Chart
  if (pillarChartRef.value && overview.value?.pillarDistribution?.length) {
    const data = overview.value.pillarDistribution
    pillarChartInstance = new Chart(pillarChartRef.value, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.count || 1),
          backgroundColor: data.map(d => d.color || '#007da5'),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#53575b', font: { family: 'Roboto', size: 11 }, padding: 12, usePointStyle: true }
          }
        }
      }
    })
  }
}

async function refreshData() {
  isRefreshing.value = true
  try {
    await Promise.all([
      insightsStore.fetchOverview(),
      insightsStore.fetchRecommendations()
    ])
    metaConnected.value = overview.value?.isConnected || false
    await nextTick()
    renderCharts()
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--sp-24);
  max-width: 1320px;
  margin: 0 auto;
}

/* ── Hero Banner ── */
.dash-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
}

.avatar-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-pill);
  object-fit: cover;
  border: 2px solid var(--accent-primary);
  box-shadow: var(--shadow-raised);
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--gray-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.live-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: var(--accent-success);
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
  flex-wrap: wrap;
}

.profile-title {
  font: 700 1.5rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.ig-handle-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: #f0f9fc;
  border: 1px solid rgba(0, 125, 165, 0.2);
  border-radius: var(--radius-pill);
  color: var(--accent-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.ig-handle-badge:hover {
  background: var(--accent-primary);
  color: #ffffff;
}

.profile-bio {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  max-width: 600px;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
}

.meta-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: #fff3e0;
  color: var(--accent-warning);
}

.meta-status-pill.connected {
  background: #e8f5e9;
  color: var(--accent-success);
}

.pulse-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

.btn-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-level1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sync:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: #f7fbfd;
}

.btn-sync:active {
  transform: scale(0.97);
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Metric Cards ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-16);
}

.metric-card {
  padding: 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-detached);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-12);
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.metric-value {
  font: 700 1.85rem/1.1 var(--font-serif);
  color: var(--text-primary);
}

.metric-trend {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* ── Peak Hours Card ── */
.peak-hours-card {
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.peak-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-16);
}

.peak-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
}

.peak-icon {
  font-size: 1.5rem;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  margin: 2px 0 0 0;
}

.peak-badge {
  font-size: 0.8125rem;
  padding: 5px 12px;
  background: #e0f4f8;
  border-radius: var(--radius-pill);
  color: var(--accent-primary);
}

.hours-timeline {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 4px;
  align-items: flex-end;
  height: 90px;
  padding-top: 10px;
}

.hour-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  cursor: pointer;
}

.hour-bar-track {
  flex: 1;
  width: 100%;
  max-width: 12px;
  background: var(--gray-3);
  border-radius: 2px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.hour-bar-fill {
  width: 100%;
  background: var(--accent-primary);
  opacity: 0.5;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hour-col:hover .hour-bar-fill {
  opacity: 0.9;
}

.hour-col.is-peak .hour-bar-fill {
  background: var(--accent-danger);
  opacity: 1;
}

.hour-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ── Charts Grid ── */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--sp-16);
}

.chart-card {
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.card-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--sp-16);
}

.chart-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--gray-2);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}

.canvas-wrapper {
  position: relative;
  height: 230px;
}

.doughnut-wrap {
  height: 230px;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-16);
}

.recommendations-card, .top-posts-card {
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.recs-count {
  font-size: 0.75rem;
  color: var(--accent-primary);
  font-weight: 600;
  background: #e0f4f8;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
  max-height: 440px;
  overflow-y: auto;
  padding-right: 4px;
}

.rec-item {
  padding: 14px 16px;
  border-left: 3px solid;
  background: var(--gray-2);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: all var(--transition-fast);
}

.rec-item:hover {
  background: #f2f7fa;
  transform: translateX(2px);
}

.rec-top {
  display: flex;
  align-items: center;
  gap: var(--sp-8);
  margin-bottom: 6px;
}

.rec-icon { font-size: 1.1rem; }

.rec-title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-title {
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.live-pill {
  font-size: 0.65rem;
  text-transform: uppercase;
  background: #e8f5e9;
  color: var(--accent-success);
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  font-weight: 700;
}

.rec-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* ── Top Posts List ── */
.top-posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  max-height: 440px;
  overflow-y: auto;
  padding-right: 4px;
}

.top-post-card {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
  padding: 10px 12px;
  background: var(--gray-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: all 160ms ease;
  cursor: pointer;
}

.top-post-card:hover {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-raised);
  transform: translateX(2px);
}

.rank-badge {
  font: 700 0.8125rem/1 var(--font-serif);
  color: var(--text-muted);
  width: 24px;
  text-align: center;
}

.post-media-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--gray-3);
}

.post-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.post-details {
  flex: 1;
  min-width: 0;
}

.post-caption {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-metrics-row {
  display: flex;
  gap: 12px;
}

.p-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.post-arrow {
  color: var(--gray-15);
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.top-post-card:hover .post-arrow {
  color: var(--accent-primary);
  transform: translateX(2px);
}

/* ── Pipeline Bar ── */
.pipeline-bar {
  padding: 16px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-24);
}

.pipeline-title-group {
  display: flex;
  flex-direction: column;
}

.pipeline-legend {
  font: 700 0.875rem/1.2 var(--font-serif);
  color: var(--text-primary);
}

.pipeline-total {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pipeline-steps {
  display: flex;
  gap: var(--sp-24);
  flex: 1;
  justify-content: flex-end;
}

.pipeline-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-num {
  font: 700 1.1rem/1.1 var(--font-serif);
  color: var(--text-primary);
}

.step-name {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

/* Badges */
.badge-high { background: #fde8e8; color: var(--accent-danger); }
.badge-medium { background: #fff3e0; color: var(--accent-warning); }
.badge-low { background: #e0f4f8; color: var(--accent-primary); }

.badge-draft { background: var(--gray-20); }
.badge-in_review { background: var(--accent-warning); }
.badge-scheduled { background: var(--accent-primary); }
.badge-published { background: var(--accent-success); }
.badge-rejected { background: var(--accent-danger); }

/* Responsive adjustments */
@media (max-width: 1080px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .dash-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-16);
  }
  .pipeline-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .pipeline-steps {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
