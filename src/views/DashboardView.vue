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
          <div v-else class="avatar-fallback">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 21h18"/>
              <path d="M5 21V7l7-4 7 4v14"/>
              <path d="M9 21v-6h6v6"/>
            </svg>
          </div>
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

    <!-- Key Metrics Grid with Info Tooltips & Tips -->
    <section class="metrics-grid" v-if="overview">
      <div class="metric-card" v-for="m in metrics" :key="m.label">
        <div class="metric-header">
          <div class="metric-label-group">
            <span class="metric-label">{{ m.label }}</span>
            <div class="info-popover-wrap">
              <button class="info-btn" :title="`¿Por qué importa: ${m.label}?`" aria-label="Información">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </button>
              <div class="info-popover">
                <div class="popover-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>¿Por qué importa?</span>
                </div>
                <p class="popover-text">{{ m.why }}</p>
                <div class="popover-tip">
                  <span class="tip-badge">Tip Clave</span>
                  <p class="tip-text">{{ m.tip }}</p>
                </div>
              </div>
            </div>
          </div>
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
          <div class="peak-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div class="title-with-info">
              <h3 class="card-title">Ventana Óptima de Publicación</h3>
              <div class="info-popover-wrap">
                <button class="info-btn" title="Información de ventana horaria">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
                <div class="info-popover">
                  <div class="popover-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>¿Por qué importa la hora pico?</span>
                  </div>
                  <p class="popover-text">El 80% de la distribución orgánica de Instagram se define en los primeros 45 minutos. Publicar cuando tus miembros están conectados maximiza la aceleración inicial del algoritmo.</p>
                  <div class="popover-tip">
                    <span class="tip-badge">Tip Clave</span>
                    <p class="tip-text">Programa tus publicaciones a las <strong>17:45 hrs</strong> (15 min antes de las 18:00). Así el post ya estará procesado y en el feed cuando la audiencia abra la aplicación.</p>
                  </div>
                </div>
              </div>
            </div>
            <p class="card-subtitle">Seguidores de @estacalaserena activos por hora en la conurbación</p>
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
      <!-- Reach & Audience Evolution Chart -->
      <div class="card chart-card">
        <div class="card-header-bar">
          <div>
            <div class="title-with-info">
              <h3 class="card-title">Evolución de Alcance y Audiencia</h3>
              <div class="info-popover-wrap">
                <button class="info-btn" title="Información de evolución">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
                <div class="info-popover">
                  <div class="popover-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>¿Por qué importa el alcance?</span>
                  </div>
                  <p class="popover-text">Te muestra la curva de visibilidad y el crecimiento orgánico tras cada evento o publicación estratégica de la Estaca.</p>
                  <div class="popover-tip">
                    <span class="tip-badge">Tip Clave</span>
                    <p class="tip-text">Cuando veas un pico elevado (como viajes al templo o conferencias), replica la misma estructura audiovisual en la siguiente actividad distrital.</p>
                  </div>
                </div>
              </div>
            </div>
            <p class="card-subtitle">Rendimiento orgánico histórico</p>
          </div>
          <span class="chart-badge">Últimos 30 días</span>
        </div>
        <div class="canvas-wrapper">
          <canvas ref="reachChartRef"></canvas>
        </div>
      </div>

      <!-- Pillar Distribution Chart -->
      <div class="card chart-card">
        <div class="card-header-bar">
          <div>
            <div class="title-with-info">
              <h3 class="card-title">Distribución por Pilar Doctrinal</h3>
              <div class="info-popover-wrap">
                <button class="info-btn" title="Información de pilares">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
                <div class="info-popover">
                  <div class="popover-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>¿Por qué importa el balance de pilares?</span>
                  </div>
                  <p class="popover-text">Evita la 'ceguera publicitaria'. Si una cuenta solo publica afiches o avisos, los miembros se desenganchan. El contenido inspiracional nutre espiritualmente.</p>
                  <div class="popover-tip">
                    <span class="tip-badge">Tip Clave</span>
                    <p class="tip-text">Mantén el <strong>40% en Inspiración</strong> sin logos grandes. Es el tipo de contenido con mayor probabilidad de ser compartido por WhatsApp o DM.</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div class="title-with-info">
              <h3 class="card-title">Recomendaciones del Algoritmo</h3>
              <div class="info-popover-wrap">
                <button class="info-btn" title="Información de recomendaciones">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
                <div class="info-popover">
                  <div class="popover-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>¿Por qué importa el motor de reglas?</span>
                  </div>
                  <p class="popover-text">Detecta debilidades en tiempo real: saturación de pilares, horarios desalineados o bajas tasas de interacción antes de que afecten la cuenta.</p>
                  <div class="popover-tip">
                    <span class="tip-badge">Tip Clave</span>
                    <p class="tip-text">Atiende primero las alertas de prioridad <strong>Alta</strong> en rojo para mantener el estado de optimización editorial.</p>
                  </div>
                </div>
              </div>
            </div>
            <p class="card-subtitle">Acciones estratégicas sugeridas para el comité</p>
          </div>
          <span class="recs-count">{{ recommendations.length }} activas</span>
        </div>

        <div class="recommendations-list">
          <article
            v-for="rec in recommendations"
            :key="rec.title"
            class="rec-item"
            :style="{ borderLeftColor: rec.color || '#007da5' }"
          >
            <div class="rec-top">
              <div class="rec-title-wrap">
                <h4 class="rec-title">{{ rec.title }}</h4>
                <span v-if="rec.ai" class="ai-spark-pill">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  IA OpenAI
                </span>
                <span v-else-if="rec.realtime" class="live-pill">En vivo</span>
              </div>
              <span class="badge" :class="`badge-${String(rec.priority).toLowerCase()}`">{{ rec.priority }}</span>
            </div>
            <p class="rec-desc">{{ rec.description }}</p>
            <div v-if="rec.tip" class="rec-tip-box">
              <span class="tip-mini-tag">Tip:</span>
              <span class="tip-mini-text">{{ rec.tip }}</span>
            </div>
          </article>

          <div v-if="recommendations.length === 0" class="empty-state">
            <p>Todo el contenido está optimizado</p>
          </div>
        </div>
      </div>

      <!-- Top Performing Instagram Posts -->
      <div class="card top-posts-card">
        <div class="card-header-bar">
          <div>
            <div class="title-with-info">
              <h3 class="card-title">Publicaciones con Mayor Impacto</h3>
              <div class="info-popover-wrap">
                <button class="info-btn" title="Información del ranking">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
                <div class="info-popover">
                  <div class="popover-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>¿Por qué importa este ranking?</span>
                  </div>
                  <p class="popover-text">Identifica los posts que lograron conectar con la audiencia en base a likes, guardados y compartidos directos.</p>
                  <div class="popover-tip">
                    <span class="tip-badge">Tip Clave</span>
                    <p class="tip-text">El icono de la flecha representa <strong>Compartidos por DM</strong>. Es la métrica dorada de 2026: crea mensajes que un miembro desee enviar a su familia o amigos.</p>
                  </div>
                </div>
              </div>
            </div>
            <p class="card-subtitle">Contenido de @estacalaserena con mejor interacción en feed</p>
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
                v-if="post.media_url && !failedThumbs.has(post.id)"
                :src="post.media_url"
                class="post-thumb"
                :alt="post.caption"
                @error="onThumbError(post.id)"
                loading="lazy"
              />
              <div v-else class="post-thumb-fallback">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
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
                <span class="p-stat" title="Compartidos por DM (Señal #1 de distribución)">
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
        <div class="title-with-info">
          <span class="pipeline-legend">Flujo Editorial</span>
          <div class="info-popover-wrap">
            <button class="info-btn" title="Información del pipeline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
            <div class="info-popover">
              <div class="popover-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>¿Por qué importa el pipeline?</span>
              </div>
              <p class="popover-text">Garantiza que ningún post se publique sin revisión doctrinal del comité ni pase por alto las normas de la Iglesia.</p>
              <div class="popover-tip">
                <span class="tip-badge">Tip Clave</span>
                <p class="tip-text">Trabaja con una semana de anticipación: ten siempre al menos <strong>2 publicaciones aprobadas</strong> listas para salir.</p>
              </div>
            </div>
          </div>
        </div>
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
const failedThumbs = ref(new Set())

let reachChartInstance = null
let pillarChartInstance = null

const overview = computed(() => insightsStore.overview)
const recommendations = computed(() => insightsStore.recommendations)
const profile = computed(() => overview.value?.profile)

function onThumbError(id) {
  failedThumbs.value.add(id)
}

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
      subtext: `@${prof.username || 'estacalaserena'}`,
      why: 'Representa la comunidad fiel de miembros y familias de la Estaca que reciben directamente las noticias y devocionales.',
      tip: 'Anuncia la cuenta en las reuniones de obispado y sacerdocio para que los líderes motiven a los miembros a seguirla orgánicamente.'
    },
    {
      label: 'Alcance Mensual (28d)',
      value: latest.reach || 0,
      bg: '#318d43',
      iconSvg: IconEye,
      subtext: 'Cuentas únicas alcanzadas',
      why: 'Mide cuántas personas distintas (incluyendo amigos no miembros) vieron al menos una publicación de la Estaca.',
      tip: 'Los testimonios de jóvenes en Reels y carruseles consiguen hasta un 65% de visualizaciones fuera de los seguidores.'
    },
    {
      label: 'Cuentas con Interacción',
      value: latest.accounts_engaged || 0,
      bg: '#d45311',
      iconSvg: IconHeart,
      subtext: 'Likes, comentarios y envíos',
      why: 'Indica el impacto real: personas que no solo miraron, sino que respondieron, guardaron o compartieron el mensaje.',
      tip: 'Haz preguntas al final del texto (ej: "¿Qué es lo que más recuerdas de esta conferencia?") para elevar los comentarios en las primeras 2 horas.'
    },
    {
      label: 'Publicaciones en Feed',
      value: prof.media_count || overview.value.postStats?.total_posts || 0,
      bg: '#006184',
      iconSvg: IconGrid,
      subtext: 'Contenido total publicado',
      why: 'El historial de testimonios, actividades y registros edificantes acumulados por la Estaca.',
      tip: 'Mantén una constancia de 3 a 4 publicaciones semanales para que el algoritmo nunca penalice la cuenta por inactividad.'
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
            titleFont: { family: 'Roboto', size: 12 },
            bodyFont: { family: 'Roboto', size: 11 },
            cornerRadius: 4,
            padding: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#70757a', font: { size: 10 } }
          },
          y: {
            grid: { color: '#e8eaed' },
            ticks: { color: '#70757a', font: { size: 10 } }
          }
        }
      }
    })
  }

  // 2. Pillar Distribution Chart
  if (pillarChartRef.value && overview.value?.pillarDistribution?.length) {
    const pillars = overview.value.pillarDistribution
    pillarChartInstance = new Chart(pillarChartRef.value, {
      type: 'doughnut',
      data: {
        labels: pillars.map(p => p.name),
        datasets: [{
          data: pillars.map(p => p.count),
          backgroundColor: pillars.map(p => p.color || '#007da5'),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 10,
              color: '#53575b',
              font: { family: 'Roboto', size: 11 }
            }
          }
        }
      }
    })
  }
}

async function refreshData() {
  isRefreshing.value = true
  await Promise.all([
    insightsStore.fetchOverview(),
    insightsStore.fetchRecommendations()
  ])
  metaConnected.value = overview.value?.isConnected || false
  await nextTick()
  renderCharts()
  isRefreshing.value = false
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

/* ── Hero Profile Banner ── */
.dash-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  flex-wrap: wrap;
  gap: var(--sp-16);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
}

.avatar-container {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  flex-shrink: 0;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: var(--shadow-raised);
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--gray-3);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

.live-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-success);
  border: 2px solid #ffffff;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
  flex-wrap: wrap;
}

.profile-title {
  font: 700 1.25rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.ig-handle-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: #fdf2f8;
  border: 1px solid #fbcfe8;
  border-radius: var(--radius-pill);
  color: #db2777;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.ig-handle-badge:hover {
  background: #fce7f3;
  transform: translateY(-1px);
}

.profile-bio {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-12);
}

.meta-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gray-2);
  color: var(--text-secondary);
  border: 1px solid var(--border-secondary);
}

.meta-status-pill.connected {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #c8e6c9;
}

.pulse-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.btn-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--bg-level1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sync:hover:not(:disabled) {
  background: var(--gray-2);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Interactive Info Popover Component ── */
.title-with-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-popover-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-btn {
  background: transparent;
  border: none;
  padding: 2px;
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.info-btn:hover {
  color: var(--accent-primary);
  background: var(--gray-2);
  transform: scale(1.1);
}

.info-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 270px;
  background: #ffffff;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-detached), 0 8px 24px rgba(0,0,0,0.12);
  padding: 12px 14px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.info-popover-wrap:hover .info-popover,
.info-popover-wrap:focus-within .info-popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.popover-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 6px;
}

.popover-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.popover-tip {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-sm);
  padding: 6px 8px;
}

.tip-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #15803d;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.tip-text {
  font-size: 0.72rem;
  color: #166534;
  line-height: 1.35;
  margin: 0;
}

/* ── Key Metrics Grid ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sp-16);
}

.metric-card {
  padding: 18px 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: all var(--transition-fast);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-detached);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.metric-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.metric-value {
  font: 700 1.6rem/1.1 var(--font-serif);
  color: var(--text-primary);
  margin-bottom: 3px;
}

.metric-trend {
  font-size: 0.72rem;
  color: var(--text-muted);
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
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: var(--sp-12);
}

.peak-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.peak-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: #eef6f9;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font: 700 1rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.peak-badge {
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: #eef6f9;
  border: 1px solid #c7e3ed;
  font-size: 0.78rem;
  color: var(--accent-primary);
}

.hours-timeline {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 3px;
  align-items: flex-end;
  height: 85px;
}

.hour-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  cursor: pointer;
  transition: transform 120ms ease;
}

.hour-col:hover {
  transform: translateY(-2px);
}

.hour-bar-track {
  width: 100%;
  max-width: 18px;
  height: 60px;
  background: var(--gray-2);
  border-radius: 2px 2px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.hour-bar-fill {
  width: 100%;
  background: #007da5;
  opacity: 0.65;
  border-radius: 2px 2px 0 0;
  transition: height 300ms ease;
}

.hour-col.is-peak .hour-bar-fill {
  background: #318d43;
  opacity: 1;
}

.hour-label {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.hour-col.is-peak .hour-label {
  font-weight: 700;
  color: #318d43;
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
  align-items: center;
  margin-bottom: 16px;
}

.chart-badge {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--gray-2);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}

.canvas-wrapper {
  position: relative;
  height: 240px;
  width: 100%;
}

.doughnut-wrap {
  height: 240px;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-16);
}

.recommendations-card,
.top-posts-card {
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  display: flex;
  flex-direction: column;
}

.recs-count {
  font-size: 0.72rem;
  padding: 2px 8px;
  background: #eef6f9;
  color: var(--accent-primary);
  border-radius: var(--radius-pill);
  font-weight: 600;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.rec-item {
  padding: 12px 14px;
  background: var(--gray-2);
  border-left: 3px solid;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: all var(--transition-fast);
}

.rec-item:hover {
  background: #eef6f9;
  transform: translateX(2px);
}

.rec-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.rec-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.live-pill {
  font-size: 0.625rem;
  padding: 1px 5px;
  border-radius: 3px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 700;
}

.ai-spark-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%);
  color: #7c3aed;
  border: 1px solid #ddd6fe;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(124, 58, 237, 0.1);
}

.rec-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 6px 0;
}

.rec-tip-box {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 5px 8px;
  background: #ffffff;
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
}

.tip-mini-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #15803d;
  text-transform: uppercase;
}

.tip-mini-text {
  font-size: 0.72rem;
  color: #166534;
  line-height: 1.3;
}

/* ── Top Posts Ranking ── */
.top-posts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-post-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--gray-2);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
}

.top-post-card:hover {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-raised);
  transform: translateX(2px);
}

.rank-badge {
  font: 700 0.85rem var(--font-serif);
  color: var(--text-muted);
  min-width: 22px;
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
  color: var(--text-muted);
  opacity: 0.5;
}

.post-details {
  flex: 1;
  min-width: 0;
}

.post-caption {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 0 4px 0;
}

.post-metrics-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.p-stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.post-arrow {
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.top-post-card:hover .post-arrow {
  color: var(--accent-primary);
  transform: translateX(2px);
}

/* ── Pipeline Bar ── */
.pipeline-bar {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-16);
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.pipeline-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pipeline-legend {
  font: 700 0.95rem/1.2 var(--font-serif);
  color: var(--text-primary);
}

.pipeline-total {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pipeline-steps {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
  flex-wrap: wrap;
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
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.step-name {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

@media (max-width: 900px) {
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
