// modules/ai_structure.module.js — Cliente del endpoint /api/structure
// Construye payload, muestra preview, llama, aplica al consultation.

(function initAIStructureModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  const ENDPOINT = '/api/structure';
  const TIMEOUT_MS = 45000;

  // ── Construir payload desde la consulta actual ──────────────────────
  function buildPayload() {
    const consultation = app().currentConsultation;
    if (!consultation) return null;

    const patient = (app().patients || []).find(
      p => p.id === consultation.patientId
    );

    return {
      texto: consultation.notas_libre_medico || '',
      diagnosticos: consultation.diagnosticos_libre || [],
      medicamentos_estructurados: consultation.medicamentosLibre || [],
      modo: consultation.libreMode || 'nota-medica',
      paciente: {
        edad: patient ? calcularEdad(patient.fechaNacimiento) : null,
        sexo: patient ? (patient.sexo || patient.genero || null) : null
        // Intencionalmente NO enviamos: nombre, dirección, identificadores
      }
    };
  }

  function calcularEdad(fechaNac) {
    if (!fechaNac) return null;
    const f = new Date(fechaNac);
    if (isNaN(f.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - f.getFullYear();
    const m = hoy.getMonth() - f.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
  }

  // ── Modal de preview del payload ────────────────────────────────────
  function showPayloadModal(payload) {
    return new Promise((resolve) => {
      const wordCount = payload.texto.trim().split(/\s+/).length;
      const dxCount = payload.diagnosticos.length;

      const modal = document.createElement('div');
      modal.className = 'ai-modal-backdrop';
      modal.innerHTML = `
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h3>Confirmar envío a Claude</h3>
            <button class="ai-modal-close" data-action="cancel">✕</button>
          </div>
          <div class="ai-modal-body">
            <p class="ai-modal-summary">
              Se enviarán <b>${wordCount} palabras</b> y <b>${dxCount} diagnóstico(s) CIE-10</b>
              al modelo de IA. Los datos identificables del paciente <b>no</b> se envían.
            </p>
            <p class="ai-modal-label">Payload completo (JSON):</p>
            <pre class="ai-modal-payload">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
          </div>
          <div class="ai-modal-footer">
            <button data-action="cancel">Cancelar</button>
            <button class="btn-primary" data-action="send">Enviar a Claude</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action) {
          document.body.removeChild(modal);
          resolve(action === 'send');
        }
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      });
    });
  }

  // ── Spinner / overlay de carga ──────────────────────────────────────
  function showLoadingOverlay() {
    const ov = document.createElement('div');
    ov.id = 'ai-loading-overlay';
    ov.className = 'ai-loading-overlay';
    ov.innerHTML = `
      <div class="ai-loading-card">
        <div class="ai-spinner"></div>
        <p>Estructurando con Claude...</p>
        <p class="ai-loading-hint">Esto suele tomar 5-15 segundos.</p>
      </div>
    `;
    document.body.appendChild(ov);
  }

  function hideLoadingOverlay() {
    const ov = document.getElementById('ai-loading-overlay');
    if (ov) document.body.removeChild(ov);
  }

  // ── Llamada al endpoint con timeout ─────────────────────────────────
  async function callEndpoint(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json.error || `Error HTTP ${r.status}`);
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  // Endpoint con forzado de mock (header especial para fallback)
  async function callEndpointForceMock(payload) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Force-Mock': 'true'
      },
      body: JSON.stringify(payload)
    });
    const json = await r.json();
    if (!r.ok || !json.ok) {
      throw new Error(json.error || `Error HTTP ${r.status}`);
    }
    return json;
  }

  // ── Modal de fallback ────────────────────────────────────────────────
  function showFallbackPrompt(errorMsg) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'ai-modal-backdrop';
      modal.innerHTML = `
        <div class="ai-modal" style="width: min(480px, 92vw);">
          <div class="ai-modal-header">
            <h3>⚠️ Fallo en la IA</h3>
          </div>
          <div class="ai-modal-body">
            <p style="font-size: 13px;">La llamada a la IA real falló:</p>
            <pre class="ai-modal-payload" style="max-height: 120px; font-size: 11px;">${escapeHtml(errorMsg)}</pre>
            <p style="font-size: 13px; margin-top: 12px;">
              ¿Quieres usar la <b>respuesta modelo</b> para continuar la demo?
              <br><small style="color: var(--text-muted);">Los datos serán representativos pero genéricos.</small>
            </p>
          </div>
          <div class="ai-modal-footer">
            <button data-action="cancel">Cancelar</button>
            <button class="btn-primary" data-action="fallback">Sí, usar respuesta modelo</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => {
        const a = e.target.getAttribute('data-action');
        if (a) { document.body.removeChild(modal); resolve(a === 'fallback'); }
        if (e.target === modal) { document.body.removeChild(modal); resolve(false); }
      });
    });
  }

  // ── Aplicar resultado al consultation ───────────────────────────────
  function applyResult(data) {
    const c = app().currentConsultation;
    if (!c || !data) return;

    const sv = data.signos_vitales || {};
    const ef = data.exploracion_fisica || {};

    const set = (field, value) => { if (value !== undefined) c[field] = value; };

    // Padecimiento
    set('padecimiento_inicio', data.padecimiento_inicio);
    set('padecimiento_sintomas', data.padecimiento_sintomas);
    set('nota_padecimiento_inicio', data.padecimiento_inicio);
    set('nota_padecimiento_sintomas', data.padecimiento_sintomas);
    set('nota_motivo_consulta', data.motivo_consulta);

    // Signos vitales
    set('sv_tas', sv.tas);    set('nota_sv_tas', sv.tas);
    set('sv_tad', sv.tad);    set('nota_sv_tad', sv.tad);
    set('sv_fc', sv.fc);      set('nota_sv_fc', sv.fc);
    set('sv_fr', sv.fr);      set('nota_sv_fr', sv.fr);
    set('sv_temp', sv.temp);  set('nota_sv_temp', sv.temp);
    set('sv_spo2', sv.spo2);  set('nota_sv_spo2', sv.spo2);
    set('sv_peso', sv.peso);  set('nota_sv_peso', sv.peso);
    set('sv_talla', sv.talla); set('nota_sv_talla', sv.talla);
    set('sv_glucemia', sv.glucemia); set('nota_sv_glucemia', sv.glucemia);
    set('sv_dolor', sv.dolor); set('nota_sv_dolor', sv.dolor);
    set('sv_habitus', ef.habitus); set('nota_sv_habitus', ef.habitus);

    // Exploración física
    set('exp_cabeza', ef.cabeza);         set('nota_exp_cabeza', ef.cabeza);
    set('exp_torax', ef.torax);           set('nota_exp_torax', ef.torax);
    set('exp_abdomen', ef.abdomen);       set('nota_exp_abdomen', ef.abdomen);
    set('exp_extremidades', ef.extremidades); set('nota_exp_extremidades', ef.extremidades);
    set('exp_neurologico', ef.neurologico);   set('nota_exp_neurologico', ef.neurologico);

    // ── Sprint 1: Campos exclusivos de historia clínica ────────────────
    // El backend solo los retorna cuando modo === "historia". Si vienen
    // vacíos o ausentes (modo nota), los `set` no escriben nada
    // (set ignora undefined).

    // Antecedentes heredofamiliares (string libre)
    set('ahf', data.ahf);

    // Antecedentes personales no patológicos
    const apnp = data.apnp || {};
    set('apnp_otros', apnp.otros || apnp.resumen);
    set('tabaquismo_detalle', apnp.tabaquismo);
    set('alcoholismo_detalle', apnp.alcoholismo);
    set('toxicomanias_detalle', apnp.toxicomanias);
    set('actfisica_detalle', apnp.actividad_fisica);

    // Antecedentes personales patológicos
    const app_ = data.app || {};
    set('app_enfermedades', app_.enfermedades);
    set('app_cirugias', app_.cirugias);
    set('app_traumatismos', app_.traumatismos);
    set('app_alergias', app_.alergias);
    set('app_transfusiones', app_.transfusiones);
    set('app_medicamentos', app_.medicamentos);

    // Revisión por aparatos y sistemas
    const sis = data.revision_sistemas || {};
    set('sis_cardiovascular', sis.cardiovascular);
    set('sis_respiratorio', sis.respiratorio);
    set('sis_digestivo', sis.digestivo);
    set('sis_neurologico', sis.neurologico);
    set('sis_urinario', sis.urinario);
    set('sis_musculoesqueletico', sis.musculoesqueletico);
    set('sis_piel', sis.piel);
    set('sis_endocrino', sis.endocrino);
    set('sis_genitoreproductivo', sis.genitoreproductivo);
    set('sis_psiquiatrico', sis.psiquiatrico);

    // Estudios
    set('estudios_solicitados', data.estudios_solicitados);
    set('nota_estudios_solicitados', data.estudios_solicitados);

    // Diagnóstico narrativo
    set('diagnostico', data.diagnostico_principal_texto);
    set('nota_diagnostico', data.diagnostico_principal_texto);

    // Pronóstico
    set('pronostico_detalle', data.pronostico);
    set('nota_pronostico_detalle', data.pronostico);

    // Tratamiento e indicaciones
    set('tratamiento', data.tratamiento);
    set('nota_tratamiento', data.tratamiento);
    set('indicaciones_reposo', data.indicaciones_reposo);
    set('nota_indicaciones_reposo', data.indicaciones_reposo);
    set('indicaciones_dieta', data.indicaciones_dieta);
    set('nota_indicaciones_dieta', data.indicaciones_dieta);
    set('indicaciones_cita', data.indicaciones_cita);
    set('nota_indicaciones_cita', data.indicaciones_cita);

    // Guardar la respuesta completa: preview.module.js y el PDF NOM-004 leen
    // todos los bloques (signos_vitales, exploracion_fisica, padecimiento, etc.)
    // desde aquí. Los campos clásicos del expediente ya quedaron hidratados arriba.
    c.ai_structured_result = data;
    c.ai_structured_at = new Date().toISOString();

    if (typeof global.saveConsultations === 'function') {
      global.saveConsultations();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // ── Función principal: orquesta todo el flujo ───────────────────────
  async function structure() {
    const payload = buildPayload();
    if (!payload) { alert('No hay consulta activa.'); return; }
    if (!payload.texto || payload.texto.trim().length < 20) {
      alert('Necesitas escribir al menos 20 caracteres antes de estructurar.');
      return;
    }

    const confirmed = await showPayloadModal(payload);
    if (!confirmed) return;

    showLoadingOverlay();
    const startedAt = Date.now();

    try {
      const resp = await callEndpoint(payload);
      const totalLatency = Date.now() - startedAt;
      hideLoadingOverlay();

      applyResult(resp.data);

      if (registry.metrics) {
        registry.metrics.recordCall(resp.meta, resp.meta?.latencyMs || totalLatency);
      }

      if (registry.demoCases) {
        const r = registry.demoCases.stopTimer();
        if (r) console.info(`⏱ Captura: ${r.elapsedSec.toFixed(1)}s, ahorro: ${r.ahorroMin.toFixed(1)} min`);
      }

      if (registry.preview && typeof registry.preview.show === 'function') {
        registry.preview.show();
      }
    } catch (err) {
      hideLoadingOverlay();
      console.error('Error en flujo de estructuración:', err);

      const useFallback = await showFallbackPrompt(err.message);
      if (useFallback) {
        try {
          const fallbackResp = await callEndpointForceMock(payload);
          applyResult(fallbackResp.data);
          if (registry.metrics) {
            registry.metrics.recordCall(fallbackResp.meta, 0);
          }
          if (registry.preview) registry.preview.show();
          console.warn('🛟 Fallback a MOCK ejecutado por falla de API real');
        } catch (fbErr) {
          alert('No fue posible estructurar:\n\n' + fbErr.message);
        }
      }
    }
  }

  registry.aiStructure = { structure, buildPayload, applyResult };
  global.aiStructureRun = structure;
})(window);
