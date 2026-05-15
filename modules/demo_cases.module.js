// modules/demo_cases.module.js — Casos clínicos pre-cargados + cronómetro
// Provee 4 casos NOM-004 listos para demo y un cronómetro de "tiempo ahorrado".

(function initDemoCasesModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  // ── Catálogo de casos ──────────────────────────────────────────────
  const CASOS = [
    {
      id: 'primera-consulta',
      titulo: 'Primera consulta · DM2 nuevo dx',
      descripcion: 'Paciente nueva con historia clínica completa',
      icono: '🆕',
      duracion_estimada_clasica: 22,
      diagnosticos: [
        { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2 sin complicaciones' },
        { codigo: 'E78.5', descripcion: 'Hiperlipidemia, no especificada' }
      ],
      texto: `Px femenino de 52 años, originaria y residente de Mérida, casada, ama de casa, escolaridad secundaria, católica, ingresa por primera vez a la consulta externa.

Motivo de consulta: acude por presentar poliuria, polidipsia y polifagia de aproximadamente 6 semanas de evolución, asociado a pérdida ponderal no intencionada de 5 kg en ese período. Refiere visión borrosa intermitente y prurito vulvar persistente. Niega cetonas en orina, niega datos de cetoacidosis.

AHF: madre finada por IAM a los 68 años, era portadora de DM2 e HTA. Padre vivo de 78 años con DM2 e HTA en tratamiento. Hermana mayor con DM2 dx hace 10 años. Niega cáncer en familiares de primera línea. Niega tuberculosis ni enfermedades psiquiátricas familiares.

APNP: tabaquismo negado. Alcoholismo ocasional (1-2 copas de vino por mes en eventos sociales). Toxicomanías negadas. Inmunizaciones: esquema básico completo, refuerzo de Td hace 8 años, sin influenza estacional reciente, sin vacuna COVID-19 reciente. Dieta hipercalórica, alta en carbohidratos refinados, 3 comidas + 2 colaciones diarias. Actividad física sedentaria. Sueño 6-7 hrs/noche, refiere despertares nocturnos por nicturia. Habita en casa propia con todos los servicios. Higiene personal adecuada.

APP: niega DM previa, niega HTA, niega cardiopatías. Antecedente de obesidad de larga evolución. Colecistectomía laparoscópica hace 4 años sin complicaciones. Niega traumatismos significativos. Niega transfusiones. Alergias: alérgica a penicilina (rash generalizado en infancia). Niega otros alérgicos. Medicamentos actuales: ninguno de prescripción. Refiere uso ocasional de paracetamol para cefalea.

AGO: menarca a los 13 años, ciclos regulares 28x4. G3P2C1A0. FUM hace 8 meses, refiere irregularidad menstrual reciente probablemente perimenopáusica. IVSA 18 años, PSA 2, MPF: salpingoclasia post-cesárea. Última citología hace 3 años (normal). Mastografía hace 2 años (BIRADS 1).

EF: TA 142/88, FC 84, FR 17, T 36.6, SatO2 97%, peso 78 kg, talla 1.58 m, IMC 31.2 (obesidad grado I), perímetro abdominal 102 cm. Glucemia capilar 248 mg/dL.

Habitus exterior: paciente femenina, edad aparente igual a la cronológica, conformación endomórfica, marcha estable, posición libremente escogida, lúcida, orientada en tiempo, espacio y persona, cooperadora al interrogatorio.

Cabeza: normocéfala, sin exostosis ni hundimientos. Cabello con distribución y cantidad adecuadas. Pabellones auriculares íntegros, conductos auditivos permeables. Pupilas isocóricas, normorreflécticas. Conjuntivas no ictéricas ni pálidas. Cavidad oral con mucosas semihúmedas, dentadura con caries en molares inferiores. Faringe sin alteraciones.

Cuello: cilíndrico, sin adenopatías palpables, tiroides no palpable, tráquea central. Pulsos carotídeos presentes, simétricos. No ingurgitación yugular.

Tórax: simétrico, amplexión y amplexación conservadas. Campos pulmonares con murmullo vesicular presente bilateralmente sin agregados. Ruidos cardíacos rítmicos, sin soplos audibles.

Abdomen: globoso a expensas de panículo adiposo, blando, depresible, no doloroso a la palpación superficial ni profunda. Cicatriz quirúrgica de colecistectomía bien afrontada. Peristalsis presente y normoactiva. No se palpan visceromegalias. Murphy y McBurney negativos.

Extremidades: íntegras, eutróficas, fuerza muscular 5/5 en las 4 extremidades. Pulsos pedios y tibiales posteriores palpables, simétricos. Llenado capilar < 2 segundos. Sensibilidad superficial y profunda conservadas, sin datos de neuropatía. Reflejos osteotendinosos +/++++ rotulianos y aquíleos.

Genitourinario: diferido para exploración ginecológica programada.

Neurológico: alerta, lenguaje coherente, pares craneales sin alteraciones, fuerza simétrica, sensibilidad conservada, marcha sin alteraciones, equilibrio conservado, Romberg negativo.

Impresión diagnóstica: paciente con cuadro clínico altamente sugestivo de DM2 de novo, con factores de riesgo familiar importantes (madre, padre, hermana). Probable dislipidemia asociada al síndrome metabólico dado IMC y perímetro abdominal. HTA en cifras limítrofes que amerita seguimiento estrecho.

Solicito: glucemia central en ayuno, HbA1c, perfil lipídico completo (colesterol total, HDL, LDL, triglicéridos), química sanguínea (urea, creatinina, ácido úrico), EGO, microalbuminuria en orina de 24 hrs, electrolitos séricos, fondo de ojo, EKG basal.

Plan terapéutico: inicio metformina 500 mg VO c/12 horas con alimentos por 1 semana, posteriormente titular a 850 mg c/12 horas según tolerancia gastrointestinal. Dieta DM 1500 kcal/día con distribución 50% carbohidratos complejos, 20% proteínas, 30% grasas (mayoría insaturadas). Actividad física progresiva: caminata 30 min/día 5 días a la semana, iniciar gradualmente. Educación diabetológica: explicar enfermedad, importancia del apego, datos de alarma (hipoglucemia, hiperglucemia severa). Automonitoreo glucémico en ayuno 3 veces por semana. Cita en 2 semanas con resultados de laboratorio para ajuste terapéutico. Citar a nutrición y a oftalmología.

Pronóstico: reservado a corto plazo dependiente de apego terapéutico y modificación de estilo de vida. Pronóstico a largo plazo bueno si se alcanza control metabólico óptimo (HbA1c < 7%).`
    },
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
