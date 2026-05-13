// modules/demo_cases.module.js — Casos clínicos pre-cargados + cronómetro
// Provee 4 casos NOM-004 listos para demo y un cronómetro de "tiempo ahorrado".

(function initDemoCasesModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  // ── Catálogo de casos ──────────────────────────────────────────────
  const CASOS = [
    {
      id: 'hta-control',
      titulo: 'HTA · Control',
      descripcion: 'Paciente conocido, seguimiento de hipertensión',
      icono: '💊',
      duracion_estimada_clasica: 8,
      diagnosticos: [
        { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' }
      ],
      texto: `Px masculino de 45 años acude para seguimiento de HTA. Refiere apego al tratamiento, niega cefalea, dolor torácico ni disnea. APP de DM2 controlada, niega alergias.

EF: TA 138/85, FC 76, FR 16, T 36.5, SatO2 97%, peso 82 kg, talla 1.72 m. Buen estado general, consciente. Cardiopulmonar sin compromiso. Abdomen blando depresible no doloroso. Extremidades sin edema.

Continúa con losartán 50 mg c/24 h. Solicito QS y perfil lipídico. Cita en 2 meses. Pronóstico favorable.`
    },
    {
      id: 'abdomen-agudo',
      titulo: 'Abdomen agudo',
      descripcion: 'Urgencia, sospecha de apendicitis',
      icono: '🚨',
      duracion_estimada_clasica: 12,
      diagnosticos: [
        { codigo: 'K35.80', descripcion: 'Apendicitis aguda no especificada' }
      ],
      texto: `Px masculino de 24 años acude a urgencias por dolor abdominal de 18 horas de evolución, inicio periumbilical con migración a FID, intensidad 8/10, asociado a náusea y vómito en 2 ocasiones. Niega evacuaciones. Última ingesta hace 8 horas.

EF: TA 110/70, FC 102, FR 20, T 37.8, SatO2 98%. Px álgico, consciente, deshidratación leve. Abdomen con dolor a la palpación en FID, McBurney positivo, Blumberg positivo, Rovsing positivo. Peristalsis disminuida.

Laboratorios: leucocitos 14500, neutrófilos 82%. Solicito USG abdominal urgente y valoración por cirugía general. NPO, soluciones cristaloides IV, ketorolaco 30 mg IV STAT, ondansetrón 4 mg IV. Pronóstico reservado pendiente de evolución y resolución quirúrgica.`
    },
    {
      id: 'dx-multiple',
      titulo: 'Diabético complicado',
      descripcion: 'Paciente con múltiples comorbilidades',
      icono: '🩺',
      duracion_estimada_clasica: 15,
      diagnosticos: [
        { codigo: 'E11.65', descripcion: 'Diabetes mellitus tipo 2 con hiperglucemia' },
        { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' }
      ],
      texto: `Px femenino de 62 años acude por mal control glucémico de 3 semanas. Refiere poliuria, polidipsia y pérdida ponderal de 4 kg. Niega cetonas en orina. APP: DM2 de 12 años, HTA de 8 años, dislipidemia. Usuaria de metformina 850 mg c/12h y losartán 50 mg c/24h. Refiere falta de apego dietético reciente.

EF: TA 145/92, FC 88, FR 18, T 36.7, SatO2 96%, peso 78 kg, talla 1.58 m. Glucemia capilar 312. Px con sobrepeso, mucosas semihúmedas, sin datos de deshidratación severa. Cardiopulmonar sin compromiso. Abdomen globoso a expensas de panículo, no doloroso. Extremidades sin lesiones, pulsos pedios palpables, sensibilidad conservada.

Solicito HbA1c, QS completa, EGO, microalbuminuria y fondo de ojo. Inicio insulina NPH 10 UI SC c/24h nocturna, continúa metformina 850 mg c/12h, agrego empagliflozina 10 mg c/24h. Reforzar dieta DM e hiposódica, actividad física 30 min/día. Cita en 7 días con resultados. Pronóstico reservado para función a largo plazo.`
    },
    {
      id: 'pediatrico',
      titulo: 'Infección respiratoria',
      descripcion: 'Pediátrico, faringoamigdalitis',
      icono: '🧒',
      duracion_estimada_clasica: 6,
      diagnosticos: [
        { codigo: 'J03.90', descripcion: 'Amigdalitis aguda, no especificada' }
      ],
      texto: `Px femenino de 7 años traída por madre por fiebre de 39°C de 48 hrs de evolución, odinofagia y rechazo a la alimentación. Niega tos, rinorrea o dificultad respiratoria. Esquema de vacunación completo. Niega alergias.

EF: TA 90/60, FC 110, FR 22, T 38.9, SatO2 98%, peso 22 kg. Px irritable, hidratada, sin datos de dificultad respiratoria. Faringe hiperémica con amígdalas hipertróficas grado III, exudado blanquecino bilateral. Adenopatías cervicales submandibulares dolorosas. Cardiopulmonar sin compromiso. Abdomen blando no doloroso.

Inicio amoxicilina 50 mg/kg/día VO c/8h por 10 días (350 mg c/8h), paracetamol 15 mg/kg/dosis VO c/6h PRN fiebre. Líquidos abundantes, dieta blanda fría. Datos de alarma. Cita de control en 72 hrs si no mejora. Pronóstico bueno.`
    }
  ];

  // ── Cronómetro de "tiempo ahorrado" ────────────────────────────────
  let timerState = {
    inicio: null,
    caso: null,
    intervalId: null
  };

  function startTimer(casoId) {
    const caso = CASOS.find(c => c.id === casoId);
    if (!caso) return;
    timerState.inicio = Date.now();
    timerState.caso = caso;
    updateTimerUI();
    if (timerState.intervalId) clearInterval(timerState.intervalId);
    timerState.intervalId = setInterval(updateTimerUI, 100);
  }

  function stopTimer() {
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    if (!timerState.inicio || !timerState.caso) return null;
    const elapsedMs = Date.now() - timerState.inicio;
    const elapsedSec = elapsedMs / 1000;
    const ahorroMin = timerState.caso.duracion_estimada_clasica - (elapsedSec / 60);
    return { elapsedSec, ahorroMin, caso: timerState.caso };
  }

  function updateTimerUI() {
    const el = document.getElementById('demo_timer_display');
    if (!el || !timerState.inicio) return;
    const elapsedSec = (Date.now() - timerState.inicio) / 1000;
    const mins = Math.floor(elapsedSec / 60);
    const secs = (elapsedSec % 60).toFixed(1);
    el.textContent = `${mins}:${String(secs).padStart(4, '0')}`;

    const ahorroEl = document.getElementById('demo_timer_ahorro');
    if (ahorroEl && timerState.caso) {
      const ahorroMin = timerState.caso.duracion_estimada_clasica - (elapsedSec / 60);
      if (ahorroMin > 0) {
        ahorroEl.textContent = `−${ahorroMin.toFixed(1)} min vs formato clásico`;
        ahorroEl.className = 'demo-timer-ahorro positivo';
      } else {
        ahorroEl.textContent = `+${Math.abs(ahorroMin).toFixed(1)} min`;
        ahorroEl.className = 'demo-timer-ahorro negativo';
      }
    }
  }

  // ── Cargar caso al expediente ──────────────────────────────────────
  function cargarCaso(casoId) {
    const caso = CASOS.find(c => c.id === casoId);
    if (!caso) return;
    const consultation = app().currentConsultation;
    if (!consultation) {
      alert('Atiende a un paciente primero antes de cargar un caso de demo.');
      return;
    }

    consultation.notas_libre_medico = caso.texto;
    consultation.diagnosticos_libre = JSON.parse(JSON.stringify(caso.diagnosticos));

    const ta = document.getElementById('notas_libre_medico');
    if (ta) ta.value = caso.texto;
    if (registry.freecapture) {
      registry.freecapture.renderDxBadges();
      registry.freecapture.onInput();
    }

    if (typeof global.saveConsultations === 'function') global.saveConsultations();

    startTimer(casoId);
  }

  // ── Barra superior de demo ─────────────────────────────────────────
  function renderDemoBar() {
    const existing = document.getElementById('demo_bar');
    if (existing) return;

    const bar = document.createElement('div');
    bar.id = 'demo_bar';
    bar.className = 'demo-bar';
    bar.innerHTML = `
      <div class="demo-bar-left">
        <span class="demo-bar-label">🎯 Demo:</span>
        ${CASOS.map(c => `
          <button class="demo-case-btn" onclick="demoLoadCase('${c.id}')" title="${c.descripcion}">
            ${c.icono} ${c.titulo}
          </button>
        `).join('')}
        <button class="demo-case-btn demo-auto-btn" onclick="demoAutoTypePicker()" title="Modo auto-demo (typewriter)">
          ⌨️ Auto-typing
        </button>
      </div>
      <div class="demo-bar-right">
        <div class="demo-timer">
          <span class="demo-timer-label">Tiempo en captura</span>
          <span id="demo_timer_display" class="demo-timer-display">0:00.0</span>
          <span id="demo_timer_ahorro" class="demo-timer-ahorro"></span>
        </div>
        <button class="demo-case-btn" onclick="demoReset()">↺ Reset</button>
      </div>
    `;
    document.body.appendChild(bar);
  }

  function showDemoBar() {
    renderDemoBar();
    const bar = document.getElementById('demo_bar');
    if (bar) bar.style.display = 'flex';
  }

  function hideDemoBar() {
    const bar = document.getElementById('demo_bar');
    if (bar) bar.style.display = 'none';
  }

  function reset() {
    if (timerState.intervalId) clearInterval(timerState.intervalId);
    timerState = { inicio: null, caso: null, intervalId: null };
    const el = document.getElementById('demo_timer_display');
    if (el) el.textContent = '0:00.0';
    const ahorroEl = document.getElementById('demo_timer_ahorro');
    if (ahorroEl) { ahorroEl.textContent = ''; ahorroEl.className = 'demo-timer-ahorro'; }
  }

  registry.demoCases = { CASOS, cargarCaso, startTimer, stopTimer, showDemoBar, hideDemoBar, reset };
  global.demoLoadCase = cargarCaso;
  global.demoReset = reset;
})(window);
