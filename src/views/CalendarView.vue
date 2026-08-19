<template>
  <div class="calendar-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Calendario Editorial</h1>
        <p class="page-subtitle">Planificación mensual de contenido por pilar estratégico</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost btn-sm" @click="prevMonth">← Anterior</button>
        <span class="month-display">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
        <button class="btn btn-ghost btn-sm" @click="nextMonth">Siguiente →</button>
      </div>
    </div>

    <!-- Pillar Legend -->
    <div class="pillar-legend">
      <div v-for="pillar in pillars" :key="pillar.id" class="legend-item">
        <span class="legend-dot" :style="{ background: pillar.color }"></span>
        <span>{{ pillar.icon }} {{ pillar.name }}</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <div class="cal-header" v-for="day in dayHeaders" :key="day">{{ day }}</div>

      <div v-for="(cell, i) in calendarCells" :key="i"
           class="cal-cell"
           :class="{ 'other-month': !cell.currentMonth, 'today': cell.isToday, 'has-posts': cell.posts.length }">
        <div class="cal-date">{{ cell.day }}</div>
        <div class="cal-posts">
          <div v-for="post in cell.posts" :key="post.id"
               class="cal-post-chip"
               :style="{ background: post.pillar_color + '22', borderColor: post.pillar_color }"
               :title="post.title">
            <span class="chip-icon">{{ post.pillar_icon }}</span>
            <span class="chip-title">{{ post.title }}</span>
            <span class="badge badge-sm" :class="`badge-${post.status}`">{{ statusLabels[post.status] }}</span>
          </div>
        </div>

        <!-- Suggestion indicator -->
        <div v-if="cell.suggestion" class="cal-suggestion" :style="{ borderColor: cell.suggestion.pillar_color }">
          <span class="sugg-icon">{{ cell.suggestion.pillar_icon }}</span>
          <span class="sugg-text">{{ cell.suggestion.pillar_name }}</span>
        </div>
      </div>
    </div>

    <!-- Generate Template -->
    <div class="generate-section card">
      <div class="generate-info">
        <h3>📋 Generar Parrilla Mensual</h3>
        <p>Crea una plantilla basada en la estrategia editorial (Lun=Inspiración, Mié=Servicio, Vie=Info, Sáb=Historias)</p>
      </div>
      <button class="btn btn-primary" @click="generateTemplate">Generar Sugerencias</button>
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

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const statusLabels = {
  draft: 'Borrador', in_review: 'Revisión', approved: 'Aprobado',
  scheduled: 'Programado', published: 'Publicado', rejected: 'Rechazado'
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
    cells.push({ day: daysInPrevMonth - i, currentMonth: false, posts: [], isToday: false, suggestion: null })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const posts = (calendarStore.posts || []).filter(p => {
      if (!p.scheduled_at) return false
      return p.scheduled_at.startsWith(dateStr)
    })
    const suggestion = calendarStore.suggestions.find(s => s.date === dateStr)
    cells.push({ day: d, currentMonth: true, posts, isToday: dateStr === todayStr, suggestion: posts.length === 0 ? suggestion : null })
  }

  // Next month fill
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false, posts: [], isToday: false, suggestion: null })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

async function generateTemplate() {
  await calendarStore.generateTemplate(currentYear.value, currentMonth.value + 1)
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-display {
  font-size: 1.1rem;
  font-weight: 700;
  min-width: 180px;
  text-align: center;
}

.pillar-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 24px;
}

.cal-header {
  padding: 10px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.cal-cell {
  background: var(--bg-card);
  min-height: 110px;
  padding: 8px;
  position: relative;
  transition: background var(--transition-fast);
}

.cal-cell:hover { background: var(--bg-card-hover); }
.cal-cell.other-month { opacity: 0.35; }

.cal-cell.today {
  background: rgba(74, 144, 217, 0.06);
}

.cal-cell.today .cal-date {
  background: var(--accent-primary);
  color: white;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
}

.cal-date {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.cal-posts {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cal-post-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 0.68rem;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.cal-post-chip:hover { transform: scale(1.02); }

.chip-icon { font-size: 0.7rem; }
.chip-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

.badge-sm {
  font-size: 0.55rem;
  padding: 1px 4px;
}

.cal-suggestion {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border: 1px dashed;
  border-radius: 4px;
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0.6;
  margin-top: 2px;
}

.sugg-icon { font-size: 0.7rem; }

.generate-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.generate-info h3 {
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.generate-info p {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
</style>
