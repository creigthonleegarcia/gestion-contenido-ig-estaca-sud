<template>
  <div class="calendar-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Calendario Editorial</h1>
        <p class="page-subtitle">Planificación mensual de contenido según la estrategia de la Estaca</p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="prevMonth" title="Mes anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Anterior</span>
        </button>

        <div class="month-display-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="month-display">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
        </div>

        <button class="btn btn-secondary btn-sm" @click="nextMonth" title="Mes siguiente">
          <span>Siguiente</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <router-link to="/content/new" class="btn btn-primary btn-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Nueva Publicación</span>
        </router-link>
      </div>
    </div>

    <!-- Pillar Legend Filter Bar -->
    <div class="pillar-legend card">
      <span class="legend-title">Pilares:</span>
      <div v-for="pillar in pillars" :key="pillar.id" class="legend-item">
        <span class="legend-dot" :style="{ background: pillar.color }"></span>
        <span class="legend-name">{{ pillar.name }}</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid-card card">
      <div class="cal-grid">
        <div class="cal-header" v-for="day in dayHeaders" :key="day">{{ day }}</div>

        <div
          v-for="(cell, i) in calendarCells"
          :key="i"
          class="cal-cell"
          :class="{
            'other-month': !cell.currentMonth,
            'today': cell.isToday,
            'has-posts': cell.posts.length
          }"
        >
          <div class="cal-cell-top">
            <span class="cal-date" :class="{ 'today-pill': cell.isToday }">{{ cell.day }}</span>
            <router-link
              v-if="cell.currentMonth"
              :to="{ path: '/content/new', query: { date: cell.dateStr } }"
              class="add-day-btn"
              title="Agendar post este día"
            >
              +
            </router-link>
          </div>

          <!-- Published / Scheduled Post Chips -->
          <div class="cal-posts" v-if="cell.posts.length">
            <template v-for="post in cell.posts" :key="post.id">
              <a
                v-if="post.is_live_ig"
                :href="post.permalink"
                target="_blank"
                rel="noopener noreferrer"
                class="cal-post-chip is-live-chip"
                :style="{ borderLeftColor: post.pillar_color }"
                :title="`${post.title} (Ver en Instagram)`"
              >
                <span class="chip-title">{{ post.title || 'En Instagram' }}</span>
                <span class="ig-chip-tag">IG</span>
              </a>

              <router-link
                v-else
                :to="`/content/${post.id}`"
                class="cal-post-chip"
                :style="{ borderLeftColor: post.pillar_color }"
                :title="`${post.title} (${statusLabels[post.status] || 'Borrador'})`"
              >
                <span class="chip-title">{{ post.title || 'Sin título' }}</span>
                <span class="chip-status-dot" :class="`badge-${post.status}`"></span>
              </router-link>
            </template>
          </div>

          <!-- Strategy Suggestion indicator -->
          <div
            v-else-if="cell.suggestion"
            class="cal-suggestion"
            :style="{ borderColor: cell.suggestion.pillar_color }"
          >
            <span class="sugg-dot" :style="{ background: cell.suggestion.pillar_color }"></span>
            <span class="sugg-text">{{ cell.suggestion.pillar_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Template Banner -->
    <div class="generate-section card">
      <div class="generate-info">
        <div class="gen-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div>
          <h3 class="gen-title">Generar Parrilla Editorial Automática</h3>
          <p class="gen-desc">
            Crea la estructura de sugerencias mensual según la estrategia oficial de la Estaca:
            <strong>Lunes:</strong> Inspiración &bull; <strong>Miércoles:</strong> Servicio SirveAhora &bull; <strong>Viernes:</strong> Agenda &bull; <strong>Sábado:</strong> Historias.
          </p>
        </div>
      </div>
      <button class="btn btn-primary" @click="generateTemplate" :disabled="isGenerating">
        <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>{{ isGenerating ? 'Generando...' : 'Generar Sugerencias' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCalendarStore, usePillarsStore } from '../stores/index'

const calendarStore = useCalendarStore()
const pillarsStore = usePillarsStore()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const isGenerating = ref(false)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const dayHeaders = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const statusLabels = {
  draft: 'Borrador',
  in_review: 'En revisión',
  approved: 'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  rejected: 'Observado'
}

const pillars = computed(() => pillarsStore.pillars)

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const prevMonthNum = month === 0 ? 12 : month
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      dateStr,
      currentMonth: false,
      posts: [],
      isToday: false,
      suggestion: null
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const posts = (calendarStore.posts || []).filter(p => {
      if (!p.scheduled_at) return false
      return p.scheduled_at.startsWith(dateStr)
    })
    const suggestion = calendarStore.suggestions.find(s => s.date === dateStr)
    cells.push({
      day: d,
      dateStr,
      currentMonth: true,
      posts,
      isToday: dateStr === todayStr,
      suggestion: posts.length === 0 ? suggestion : null
    })
  }

  // Next month fill
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const nextMonthNum = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    cells.push({
      day: i,
      dateStr,
      currentMonth: false,
      posts: [],
      isToday: false,
      suggestion: null
    })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

async function generateTemplate() {
  isGenerating.value = true
  try {
    await calendarStore.generateTemplate(currentYear.value, currentMonth.value + 1)
    await loadData()
  } finally {
    isGenerating.value = false
  }
}

async function loadData() {
  await calendarStore.fetchMonth(currentYear.value, currentMonth.value + 1)
}

watch([currentYear, currentMonth], loadData)

onMounted(async () => {
  await pillarsStore.fetchPillars()
  await loadData()
})
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  gap: var(--sp-20);
  max-width: 1320px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-16);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-8);
  flex-wrap: wrap;
}

.month-display-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font: 700 0.95rem/1 var(--font-serif);
  min-width: 170px;
  justify-content: center;
}

/* ── Pillar Legend ── */
.pillar-legend {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
  padding: 12px 18px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}

.legend-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* ── Calendar Grid ── */
.calendar-grid-card {
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  overflow: hidden;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--border-tertiary);
  gap: 1px;
}

.cal-header {
  padding: 10px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--gray-3);
}

.cal-cell {
  background: #ffffff;
  min-height: 118px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background var(--transition-fast);
  position: relative;
}

.cal-cell:hover {
  background: #fbfdfd;
}

.cal-cell.other-month {
  background: var(--gray-2);
  opacity: 0.45;
}

.cal-cell.today {
  background: #f0f9fc;
}

.cal-cell-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.cal-date {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.today-pill {
  background: var(--accent-primary);
  color: #ffffff !important;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.add-day-btn {
  opacity: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--gray-3);
  color: var(--text-muted);
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.cal-cell:hover .add-day-btn {
  opacity: 1;
}

.add-day-btn:hover {
  background: var(--accent-primary);
  color: #ffffff;
}

.cal-posts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cal-post-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  background: var(--gray-2);
  border-left: 3px solid;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.cal-post-chip:hover {
  background: #eef6f9;
  transform: translateX(1px);
}

.is-live-chip {
  background: #fdf4f8;
}

.is-live-chip:hover {
  background: #fce7f3;
  color: #be185d;
}

.ig-chip-tag {
  font-size: 0.6rem;
  font-weight: 700;
  color: #db2777;
  background: #fbcfe8;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1;
}

.chip-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-suggestion {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border: 1px dashed;
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.6);
  margin-top: auto;
}

.sugg-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sugg-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Generate Section Banner ── */
.generate-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  gap: var(--sp-16);
  flex-wrap: wrap;
}

.generate-info {
  display: flex;
  align-items: center;
  gap: var(--sp-16);
}

.gen-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: #e0f4f8;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gen-title {
  font: 700 0.95rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.gen-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 700px;
}
</style>
