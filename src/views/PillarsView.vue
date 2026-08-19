<template>
  <div class="pillars-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pilares Estratégicos</h1>
        <p class="page-subtitle">Configuración y directrices editoriales de los 4 ejes doctrinales de la Estaca</p>
      </div>
      <button class="btn" :class="showNewForm ? 'btn-secondary' : 'btn-primary'" @click="showNewForm = !showNewForm">
        <svg v-if="!showNewForm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span>{{ showNewForm ? 'Cerrar Formulario' : 'Nuevo Pilar' }}</span>
      </button>
    </div>

    <!-- New Pillar Form -->
    <div v-if="showNewForm" class="card new-pillar-form">
      <div class="card-header-simple">
        <h3 class="card-title">Crear Nuevo Pilar Estratégico</h3>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre del Pilar *</label>
          <input v-model="newPillar.name" placeholder="Ej: Obra Misional" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Identificador (Slug)</label>
          <input v-model="newPillar.slug" placeholder="obra-misional" class="form-control" />
        </div>
        <div class="form-group color-pick-group">
          <label class="form-label">Color Temático</label>
          <div class="color-picker-wrap">
            <input type="color" v-model="newPillar.color" class="color-input" />
            <span class="color-hex">{{ newPillar.color }}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Descripción Doctrinal / Objetivo</label>
        <textarea v-model="newPillar.description" rows="2" placeholder="Propósito de este eje estratégico..." class="form-control"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Día de Publicación Sugerido</label>
          <select v-model="newPillar.recommended_day" class="form-control">
            <option value="">Sin día fijo</option>
            <option value="monday">Lunes</option>
            <option value="tuesday">Martes</option>
            <option value="wednesday">Miércoles</option>
            <option value="thursday">Jueves</option>
            <option value="friday">Viernes</option>
            <option value="saturday">Sábado</option>
            <option value="sunday">Domingo</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato Recomendado</label>
          <select v-model="newPillar.recommended_format" class="form-control">
            <option value="static">Imagen Estática</option>
            <option value="carousel">Carrusel Deslizable</option>
            <option value="reel">Reel de Video (9:16)</option>
            <option value="story">Historia (24h)</option>
          </select>
        </div>
      </div>

      <div class="form-actions-row">
        <button class="btn btn-primary" @click="createPillar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Guardar Pilar</span>
        </button>
      </div>
    </div>

    <!-- Pillars Grid -->
    <div class="pillars-grid">
      <article
        v-for="pillar in pillarsStore.pillars"
        :key="pillar.id"
        class="pillar-card card"
        :style="{ borderTopColor: pillar.color }"
      >
        <div class="pillar-header">
          <div class="pillar-icon-box" :style="{ background: pillar.color + '18', color: pillar.color }">
            <component :is="getPillarIcon(pillar.slug || pillar.name)" />
          </div>
          <div>
            <h3 class="pillar-name">{{ pillar.name }}</h3>
            <span class="pillar-slug">#{{ pillar.slug || 'pilar' }}</span>
          </div>
        </div>

        <p class="pillar-description">{{ pillar.description }}</p>

        <div class="pillar-meta-box">
          <div class="pmi-item">
            <span class="pmi-label">Día sugerido</span>
            <span class="pmi-val">{{ dayLabels[pillar.recommended_day] || 'Flexible' }}</span>
          </div>
          <div class="pmi-item">
            <span class="pmi-label">Formato óptimo</span>
            <span class="pmi-val">{{ formatLabels[pillar.recommended_format] || 'Estático' }}</span>
          </div>
        </div>

        <div class="pillar-bottom-accent" :style="{ background: pillar.color }"></div>
      </article>
    </div>

    <!-- Strategy Reference Card -->
    <section class="card strategy-ref">
      <div class="strategy-header">
        <div class="strat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <h3 class="card-title">Estrategia Editorial — Estaca La Serena</h3>
          <p class="card-subtitle">Pautas aprobadas para la comunicación oficial y alcance de miembros y amigos</p>
        </div>
      </div>

      <div class="strategy-grid">
        <div class="strategy-col">
          <h4 class="strat-subhead">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Distribución Semanal Recomendada
          </h4>
          <ul class="strat-list">
            <li><strong>Lunes — Inspiración Doctrinal:</strong> Gráficos limpios con escrituras y citas de líderes de la Iglesia (sin logotipos invasivos).</li>
            <li><strong>Miércoles — Servicio / SirveAhora:</strong> Reels cortos de 15 a 30 segundos de actividades de caridad y bienestar comunitario.</li>
            <li><strong>Viernes — Información y Agenda:</strong> Carteleras, actividades de JAS/Hombres Jóvenes/Mujeres Jóvenes y conferencias.</li>
            <li><strong>Sábados o Domingos — Historias y Pioneros:</strong> Relatos de fe, testimonios locales y experiencias de miembros.</li>
          </ul>
        </div>

        <div class="strategy-col">
          <h4 class="strat-subhead">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Directrices Técnicas y Algoritmo (2026)
          </h4>
          <ul class="strat-list">
            <li><strong>Formato Reels:</strong> Proporción vertical 9:16 obligatoria; primeros 3 segundos con gancho visual.</li>
            <li><strong>Subtitulado:</strong> El 70% de los usuarios consume video sin audio; incluir subtítulos claros.</li>
            <li><strong>Sin marcas de agua:</strong> Prohibido usar marcas de TikTok o CapCut (Instagram reduce 60% el alcance).</li>
            <li><strong>Frecuencia:</strong> Mantener 3 a 4 publicaciones semanales en feed para optimizar engagement orgánico.</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { usePillarsStore } from '../stores/index'

const pillarsStore = usePillarsStore()
const showNewForm = ref(false)

const newPillar = reactive({
  name: '',
  slug: '',
  color: '#007da5',
  icon: 'book',
  description: '',
  recommended_day: '',
  recommended_format: 'static'
})

const dayLabels = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

const formatLabels = {
  static: 'Imagen Estática',
  carousel: 'Carrusel',
  reel: 'Reel (9:16)',
  story: 'Historia'
}

// Vectorized Pillar SVGs
const IconBook = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }),
  h('path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' })
])

const IconHeart = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })
])

const IconInfo = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('line', { x1: 12, y1: 16, x2: 12, y2: 12 }),
  h('line', { x1: 12, y1: 8, x2: 12.01, y2: 8 })
])

const IconUsers = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: 9, cy: 7, r: 4 }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
])

function getPillarIcon(nameOrSlug = '') {
  const s = nameOrSlug.toLowerCase()
  if (s.includes('inspiraci') || s.includes('doctrin')) return IconBook
  if (s.includes('servici') || s.includes('sirve')) return IconHeart
  if (s.includes('informaci') || s.includes('agenda')) return IconInfo
  return IconUsers
}

async function createPillar() {
  if (!newPillar.name || !newPillar.color) return
  const slug = newPillar.slug || newPillar.name.toLowerCase().replace(/\s+/g, '-')
  await pillarsStore.createPillar({ ...newPillar, slug })
  Object.assign(newPillar, {
    name: '',
    slug: '',
    color: '#007da5',
    icon: 'book',
    description: '',
    recommended_day: '',
    recommended_format: 'static'
  })
  showNewForm.value = false
}

onMounted(() => {
  pillarsStore.fetchPillars()
})
</script>

<style scoped>
.pillars-page {
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

/* ── New Pillar Form ── */
.new-pillar-form {
  padding: 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.card-header-simple {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-16);
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-control {
  width: 100%;
  padding: 9px 12px;
  background: var(--gray-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
}

.form-control:focus {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(0, 125, 165, 0.1);
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: var(--gray-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
}

.color-input {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-hex {
  font-size: 0.8125rem;
  font-family: monospace;
  color: var(--text-secondary);
}

.form-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ── Pillars Grid ── */
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--sp-16);
}

.pillar-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-top: 4px solid;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.pillar-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-detached);
}

.pillar-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.pillar-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pillar-name {
  font: 700 1.05rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.pillar-slug {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pillar-description {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 16px 0;
  flex: 1;
}

.pillar-meta-box {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-tertiary);
}

.pmi-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pmi-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pmi-val {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.pillar-bottom-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0.4;
}

/* ── Strategy Reference ── */
.strategy-ref {
  padding: 24px 28px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.strategy-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-tertiary);
}

.strat-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  background: #e0f4f8;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strategy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-24);
}

.strat-subhead {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 700 0.9rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.strat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strat-list li {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
}

.strat-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-primary);
}

@media (max-width: 900px) {
  .strategy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
