<template>
  <div class="dashboard animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Métricas y recomendaciones para tu estrategia de Instagram</p>
      </div>
      <div class="header-actions">
        <span class="meta-status" :class="{ connected: metaConnected }">
          {{ metaConnected ? '🟢 Meta API Conectada' : '🟡 Modo Demo' }}
        </span>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="metrics-grid" v-if="overview">
      <div class="metric-card card" v-for="metric in metrics" :key="metric.label">
        <div class="metric-icon" :style="{ background: metric.bg }">{{ metric.icon }}</div>
        <div class="metric-content">
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-label">{{ metric.label }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-grid" v-if="overview">
      <div class="card chart-card">
        <h3 class="card-title">📈 Alcance de los últimos 30 días</h3>
        <canvas ref="reachChartRef" height="200"></canvas>
      </div>

      <div class="card chart-card chart-small">
        <h3 class="card-title">🎯 Distribución por Pilar</h3>
        <canvas ref="pillarChartRef" height="200"></canvas>
      </div>
    </div>

    <!-- Recommendations + Post Stats -->
    <div class="bottom-grid">
      <div class="card recommendations-card">
        <h3 class="card-title">💡 Recomendaciones</h3>
        <div class="recommendations-list">
          <div v-for="rec in recommendations" :key="rec.title" class="rec-item"
               :style="{ borderLeftColor: rec.color }">
            <div class="rec-header">
              <span class="rec-icon">{{ rec.icon }}</span>
              <span class="rec-title">{{ rec.title }}</span>
              <span class="rec-priority badge" :class="`badge-${rec.priority}`">{{ rec.priority }}</span>
            </div>
            <p class="rec-desc">{{ rec.description }}</p>
          </div>
          <div v-if="recommendations.length === 0" class="empty-state">
            <p>No hay recomendaciones por ahora 🎉</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">🏆 Top Posts en Instagram</h3>
        <div v-if="overview?.topPosts?.length" class="top-posts-list">
          <a v-for="post in overview.topPosts" :key="post.id" :href="post.permalink" target="_blank" class="top-post-item">
            <img v-if="post.media_url" :src="post.media_url" class="top-post-thumb" :alt="post.caption" />
            <div class="top-post-info">
              <div class="top-post-title">{{ post.caption }}</div>
              <div class="top-post-meta">
                <span>👁️ {{ post.reach }}</span>
                <span>❤️ {{ post.like_count }}</span>
                <span>📤 {{ post.shares }}</span>
                <span>🔖 {{ post.saved }}</span>
              </div>
            </div>
          </a>
        </div>
        <div v-else class="empty-state">
          <p class="empty-state-icon">📊</p>
          <p>Conecta Meta API para ver datos reales</p>
        </div>
      </div>
    </div>

    <!-- Post Status Summary -->
    <div class="status-bar" v-if="overview">
      <div v-for="status in statusList" :key="status.key" class="status-item">
        <span class="status-count">{{ overview.postStats?.[status.key] || 0 }}</span>
        <span class="status-label">{{ status.label }}</span>
        <span class="badge" :class="`badge-${status.badge}`">●</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useInsightsStore } from '../stores/index'

Chart.register(...registerables)

const insightsStore = useInsightsStore()
const reachChartRef = ref(null)
const pillarChartRef = ref(null)
const metaConnected = ref(false)

const overview = computed(() => insightsStore.overview)
const recommendations = computed(() => insightsStore.recommendations)

const metrics = computed(() => {
  if (!overview.value) return []
  const latest = overview.value.latestInsight || {}
  const profile = overview.value.profile || {}
  return [
    { icon: '👥', label: 'Seguidores', value: profile.followers_count || latest.followers || 0, bg: '#007da5' },
    { icon: '👁️', label: 'Alcance (28d)', value: latest.reach || 0, bg: '#318d43' },
    { icon: '💬', label: 'Cuentas Interacción', value: latest.accounts_engaged || 0, bg: '#d45311' },
    { icon: '📝', label: 'Posts en IG', value: profile.media_count || overview.value.postStats?.total_posts || 0, bg: '#006184' },
  ]
})

const statusList = [
  { key: 'drafts', label: 'Borradores', badge: 'draft' },
  { key: 'pending_review', label: 'En revisión', badge: 'in_review' },
  { key: 'scheduled', label: 'Programados', badge: 'scheduled' },
  { key: 'published', label: 'Publicados', badge: 'published' },
  { key: 'rejected', label: 'Rechazados', badge: 'rejected' },
]

function createReachChart() {
  if (!reachChartRef.value || !overview.value?.accountGrowth?.length) return
  const data = overview.value.accountGrowth
  new Chart(reachChartRef.value, {
    type: 'line',
    data: {
      labels: data.map(d => { const dt = new Date(d.date); return `${dt.getDate()}/${dt.getMonth() + 1}` }),
      datasets: [
        {
          label: 'Alcance',
          data: data.map(d => d.reach),
          borderColor: '#007da5',
          backgroundColor: 'rgba(0, 125, 165, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHitRadius: 10,
          borderWidth: 2
        },
        {
          label: 'Seguidores',
          data: data.map(d => d.followers),
          borderColor: '#318d43',
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#53575b', font: { family: 'Roboto', size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#878a8c', font: { size: 10 } }, grid: { color: '#e0e2e2' } },
        y: { ticks: { color: '#878a8c', font: { size: 10 } }, grid: { color: '#eff0f0' } }
      }
    }
  })
}

function createPillarChart() {
  if (!pillarChartRef.value || !overview.value?.pillarDistribution?.length) return
  const data = overview.value.pillarDistribution
  new Chart(pillarChartRef.value, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.count || 1),
        backgroundColor: data.map(d => d.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#53575b', font: { family: 'Roboto', size: 11 }, padding: 12 }
        }
      }
    }
  })
}

onMounted(async () => {
  await Promise.all([
    insightsStore.fetchOverview(),
    insightsStore.fetchRecommendations()
  ])

  metaConnected.value = overview.value?.isConnected || false

  await nextTick()
  createReachChart()
  createPillarChart()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--sp-24);
}

.meta-status {
  font-size: 0.8125rem;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: #fff3e0;
  color: var(--accent-warning);
  font-weight: 600;
}

.meta-status.connected {
  background: #e8f5e9;
  color: var(--accent-success);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-16);
  margin-bottom: var(--sp-24);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
  padding: var(--sp-24);
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  transition: box-shadow var(--transition-normal);
}

.metric-card:hover {
  box-shadow: var(--shadow-detached);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  color: white;
}

.metric-value {
  font: 700 1.5rem/1.2 var(--font-serif);
  color: var(--text-primary);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 400;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--sp-16);
  margin-bottom: var(--sp-24);
}

.chart-card {
  position: relative;
  background: var(--bg-level1);
}

.chart-card canvas {
  max-height: 240px;
}

.card-title {
  font: 600 0.875rem/1.3 var(--font-sans);
  margin-bottom: var(--sp-16);
  color: var(--text-primary);
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-16);
  margin-bottom: var(--sp-24);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  max-height: 380px;
  overflow-y: auto;
}

.rec-item {
  padding: 14px 16px;
  border-left: 3px solid;
  background: var(--gray-2);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: background var(--transition-fast);
}

.rec-item:hover {
  background: var(--gray-3);
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.rec-icon { font-size: 1rem; }
.rec-title { font-weight: 600; font-size: 0.8125rem; flex: 1; }
.rec-desc { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; }

.badge-high { background: #fde8e8; color: var(--accent-danger); }
.badge-medium { background: #fff3e0; color: var(--accent-warning); }
.badge-low { background: #e0f4f8; color: var(--accent-primary); }

.top-posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  max-height: 380px;
  overflow-y: auto;
}

.top-post-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--gray-2);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.top-post-item:hover {
  background: var(--gray-3);
}

.top-post-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.top-post-pillar {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.top-post-title {
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.top-post-meta {
  display: flex;
  gap: 10px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.status-bar {
  display: flex;
  gap: var(--sp-8);
  padding: var(--sp-16);
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.status-count {
  font: 700 1.3rem/1 var(--font-serif);
}

.status-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
