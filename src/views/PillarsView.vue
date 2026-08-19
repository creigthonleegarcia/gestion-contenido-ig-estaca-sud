<template>
  <div class="pillars-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pilares Estratégicos</h1>
        <p class="page-subtitle">Gestiona los pilares de contenido basados en la estrategia editorial</p>
      </div>
      <button class="btn btn-primary" @click="showNewForm = !showNewForm">
        {{ showNewForm ? '✕ Cerrar' : '+ Nuevo Pilar' }}
      </button>
    </div>

    <!-- New Pillar Form -->
    <div v-if="showNewForm" class="card new-pillar-form">
      <h3 class="card-title">Crear Nuevo Pilar</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Nombre</label>
          <input v-model="newPillar.name" placeholder="Nombre del pilar" />
        </div>
        <div class="form-group">
          <label>Slug</label>
          <input v-model="newPillar.slug" placeholder="slug-del-pilar" />
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="color" v-model="newPillar.color" />
        </div>
        <div class="form-group">
          <label>Ícono</label>
          <input v-model="newPillar.icon" placeholder="📌" style="max-width: 80px" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Descripción</label>
          <textarea v-model="newPillar.description" rows="2"></textarea>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Día Recomendado</label>
          <select v-model="newPillar.recommended_day">
            <option value="">Sin día específico</option>
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
          <label>Formato Recomendado</label>
          <select v-model="newPillar.recommended_format">
            <option value="static">📷 Estático</option>
            <option value="carousel">🎠 Carrusel</option>
            <option value="reel">🎬 Reel</option>
            <option value="story">📱 Story</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary" @click="createPillar">Crear Pilar</button>
    </div>

    <!-- Pillars Grid -->
    <div class="pillars-grid">
      <div v-for="pillar in pillarsStore.pillars" :key="pillar.id" class="pillar-card card"
           :style="{ borderTopColor: pillar.color }">
        <div class="pillar-header">
          <span class="pillar-icon" :style="{ background: pillar.color + '22' }">{{ pillar.icon }}</span>
          <h3 class="pillar-name">{{ pillar.name }}</h3>
        </div>
        <p class="pillar-description">{{ pillar.description }}</p>

        <div class="pillar-meta">
          <div class="pillar-meta-item">
            <span class="pmi-label">Día recomendado</span>
            <span class="pmi-value">{{ dayLabels[pillar.recommended_day] || '—' }}</span>
          </div>
          <div class="pillar-meta-item">
            <span class="pmi-label">Formato</span>
            <span class="pmi-value">{{ formatLabels[pillar.recommended_format] || '—' }}</span>
          </div>
        </div>

        <div class="pillar-color-bar" :style="{ background: pillar.color }"></div>
      </div>
    </div>

    <!-- Strategy Reference -->
    <div class="card strategy-ref">
      <h3 class="card-title">📄 Referencia de la Estrategia</h3>
      <div class="strategy-grid">
        <div class="strategy-item">
          <h4>📅 Parrilla Semanal Recomendada</h4>
          <ul>
            <li><strong>Lunes:</strong> Inspiración Doctrinal (gráfico estático / carrusel corto)</li>
            <li><strong>Miércoles:</strong> Servicio / SirveAhora (Reel 15-30 seg)</li>
            <li><strong>Viernes:</strong> Información / Agenda (carrusel informativo)</li>
            <li><strong>Sáb-Dom:</strong> Historias / Testimonios (Reel entrevista o foto)</li>
          </ul>
        </div>
        <div class="strategy-item">
          <h4>📐 Pautas Técnicas</h4>
          <ul>
            <li>Reels: formato vertical 9:16, 15-45 segundos</li>
            <li>Subtítulos legibles para navegación sin sonido</li>
            <li>Micrófono externo/solapa para testimonios</li>
            <li>Historias diarias para avisos coyunturales</li>
            <li>3-4 publicaciones semanales en feed</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePillarsStore } from '../stores/index'

const pillarsStore = usePillarsStore()
const showNewForm = ref(false)

const newPillar = reactive({
  name: '', slug: '', color: '#4a90d9', icon: '📌',
  description: '', recommended_day: '', recommended_format: 'static'
})

const dayLabels = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
}

const formatLabels = { static: '📷 Estático', carousel: '🎠 Carrusel', reel: '🎬 Reel', story: '📱 Story' }

async function createPillar() {
  if (!newPillar.name || !newPillar.slug || !newPillar.color) return
  await pillarsStore.createPillar({ ...newPillar })
  Object.assign(newPillar, { name: '', slug: '', color: '#4a90d9', icon: '📌', description: '', recommended_day: '', recommended_format: 'static' })
  showNewForm.value = false
}

onMounted(() => pillarsStore.fetchPillars())
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.new-pillar-form {
  margin-bottom: 24px;
  padding: 24px;
}

.new-pillar-form .card-title { margin-bottom: 16px; }

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.form-row .form-group { flex: 1; }

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pillar-card {
  border-top: 3px solid;
  position: relative;
  overflow: hidden;
}

.pillar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pillar-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.pillar-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.pillar-description {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.pillar-meta {
  display: flex;
  gap: 20px;
}

.pillar-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pmi-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pmi-value {
  font-size: 0.82rem;
  font-weight: 600;
}

.pillar-color-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0.4;
}

.strategy-ref { padding: 24px; }
.strategy-ref .card-title { margin-bottom: 16px; }

.strategy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.strategy-item h4 {
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.strategy-item ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.strategy-item li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding-left: 16px;
  position: relative;
}

.strategy-item li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent-primary);
  font-weight: bold;
}
</style>
