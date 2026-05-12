// modules/preview.module.js — Vista previa NOM-004 después de estructurar
// Muestra el resultado de la IA en un tab de solo-lectura, con banner de
// diagnósticos detectados y opción de aceptar la versión estructurada.

(function initPreviewModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function row(label, value) {
    const v = (value === undefined || value === null || value === '')
      ? '<span class="prev-empty">—</span>'
      : escapeHtml(value);
    return `<div class="prev-row"><span class="prev-label">${label}</span><span class="prev-value">${v}</span></div>`;
  }

  function field(label, value) {
    const empty = !value || !String(value).trim();
    return `<div class="prev-field ${empty ? 'is-empty' : ''}">
      <p class="prev-field-label">${label}</p>
      <p class="prev-field-value">${empty ? '<span class="prev-empty">No inferido del texto</span>' : escapeHtml(value)}</p>
    </div>`;
  }

  function show() {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) {
      alert('Aún no hay resultado estructurado. Haz click en "Estructurar con IA" primero.');
      return;
    }
    render();
    // Activar el tab
    document.querySelectorAll('.record-tab-content').forEach(t => t.classList.remove('active'));
    const el = document.getElementById('tab-preview');
    if (el) el.classList.add('active');
  }

  function render() {
    const c = app().currentConsultation;
    const data = c.ai_structured_result;
    if (!data) return;

    const sv = data.signos_vitales || {};
    const ef = data.exploracion_fisica || {};
    const dxCapturados = c.diagnosticos_libre || [];
    const dxSugeridos = data.diagnosticos_detectados_en_texto || [];
    const abreviaturas = data.abreviaturas_expandidas || [];
    const noInferidos = data.campos_no_inferidos || [];

    const html = `
      <div class="prev-wrap">

        <div class="prev-header">
          <div>
            <h2 class="prev-title">Vista previa NOM-004</h2>
            <p class="prev-subtitle">
              Generado por IA · Confianza:
              <span class="prev-badge prev-badge-${data.confianza_global || 'media'}">
                ${data.confianza_global || 'media'}
              </span>
              · ${new Date(c.ai_structured_at).toLocaleString('es-MX')}
            </p>
          </div>
          <div class="prev-header-actions">
            <button onclick="previewBackToFree()">← Editar texto libre</button>
            <button class="btn-primary" onclick="previewAcceptAndSave()">✓ Aceptar y guardar</button>
          </div>
        </div>

        ${dxSugeridos.length ? `
        <div class="prev-banner prev-banner-warn">
          <p class="prev-banner-title">⚠️ Diagnósticos detectados en el texto pero no capturados:</p>
          <ul class="prev-suggestions">
            ${dxSugeridos.map((s, i) => `
              <li>
                <span><b>${escapeHtml(s.mencion)}</b> → ${escapeHtml(s.sugerencia_descripcion)}
                  <code>(${escapeHtml(s.sugerencia_codigo_cie10)})</code></span>
                <button onclick='previewAddSuggestedDx(${i})'>+ Agregar</button>
                <button onclick='previewIgnoreSuggestedDx(${i})' class="btn-secondary">Ignorar</button>
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        <section class="prev-section">
          <h3>Identificación</h3>
          <div class="prev-grid-2">
            ${field('Motivo de consulta', data.motivo_consulta)}
            ${field('Antecedentes relevantes', data.antecedentes_relevantes)}
          </div>
        </section>

        <section class="prev-section">
          <h3>Padecimiento actual</h3>
          ${field('Inicio', data.padecimiento_inicio)}
          ${field('Sintomatología y evolución', data.padecimiento_sintomas)}
        </section>

        <section class="prev-section">
          <h3>Signos vitales</h3>
          <div class="prev-vitals">
            ${row('TA', (sv.tas || '—') + '/' + (sv.tad || '—'))}
            ${row('FC', sv.fc)}
            ${row('FR', sv.fr)}
            ${row('Temp', sv.temp)}
            ${row('SpO₂', sv.spo2)}
            ${row('Peso', sv.peso)}
            ${row('Talla', sv.talla)}
            ${row('Glucemia', sv.glucemia)}
            ${row('Dolor', sv.dolor)}
          </div>
        </section>

        <section class="prev-section">
          <h3>Exploración física</h3>
          <div class="prev-grid-2">
            ${field('Habitus', ef.habitus)}
            ${field('Cabeza', ef.cabeza)}
            ${field('Tórax', ef.torax)}
            ${field('Abdomen', ef.abdomen)}
            ${field('Extremidades', ef.extremidades)}
            ${field('Neurológico', ef.neurologico)}
          </div>
        </section>

        <section class="prev-section">
          <h3>Diagnósticos</h3>
          <div class="prev-dx-list">
            ${dxCapturados.length ? dxCapturados.map(d => `
              <span class="prev-dx-badge">
                <code>${escapeHtml(d.codigo)}</code>
                ${escapeHtml(d.descripcion)}
              </span>
            `).join('') : '<span class="prev-empty">Sin diagnósticos CIE-10 capturados</span>'}
          </div>
          ${field('Diagnóstico narrativo', data.diagnostico_principal_texto)}
          ${field('Pronóstico', data.pronostico)}
        </section>

        <section class="prev-section">
          <h3>Plan</h3>
          ${field('Tratamiento', data.tratamiento)}
          ${field('Estudios solicitados', data.estudios_solicitados)}
          <div class="prev-grid-2">
            ${field('Reposo', data.indicaciones_reposo)}
            ${field('Dieta', data.indicaciones_dieta)}
          </div>
          ${field('Próxima cita', data.indicaciones_cita)}
        </section>

        ${abreviaturas.length ? `
        <section class="prev-section prev-section-meta">
          <h3>Abreviaturas expandidas</h3>
          <div class="prev-abrev-grid">
            ${abreviaturas.map(a => `
              <div class="prev-abrev-pill">
                <code>${escapeHtml(a.original)}</code> → ${escapeHtml(a.expandida)}
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}

        ${noInferidos.length ? `
        <section class="prev-section prev-section-meta">
          <h3>Campos no inferidos</h3>
          <p class="prev-empty">
            ${noInferidos.map(escapeHtml).join(' · ')}
          </p>
          <p class="prev-hint">Puedes completar estos campos manualmente desde el formato clásico.</p>
        </section>
        ` : ''}
      </div>
    `;

    const tab = document.getElementById('tab-preview');
    if (tab) tab.innerHTML = html;
  }

  function backToFree() {
    document.querySelectorAll('.record-tab-content').forEach(t => t.classList.remove('active'));
    const el = document.getElementById('tab-libre-medico');
    if (el) el.classList.add('active');
  }

  function acceptAndSave() {
    if (typeof global.saveConsultations === 'function') {
      global.saveConsultations();
    }
    alert('Consulta estructurada y guardada. Ya puedes firmarla y cerrarla desde el tab de captura libre.');
    backToFree();
  }

  function addSuggestedDx(idx) {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) return;
    const sug = c.ai_structured_result.diagnosticos_detectados_en_texto[idx];
    if (!sug) return;
    if (!c.diagnosticos_libre) c.diagnosticos_libre = [];
    if (!c.diagnosticos_libre.some(d => d.codigo === sug.sugerencia_codigo_cie10)) {
      c.diagnosticos_libre.push({
        codigo: sug.sugerencia_codigo_cie10,
        descripcion: sug.sugerencia_descripcion
      });
    }
    // Quitar de la lista de sugerencias
    c.ai_structured_result.diagnosticos_detectados_en_texto.splice(idx, 1);
    if (typeof global.saveConsultations === 'function') global.saveConsultations();
    render();
  }

  function ignoreSuggestedDx(idx) {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) return;
    c.ai_structured_result.diagnosticos_detectados_en_texto.splice(idx, 1);
    if (typeof global.saveConsultations === 'function') global.saveConsultations();
    render();
  }

  registry.preview = { show, render };
  global.previewBackToFree = backToFree;
  global.previewAcceptAndSave = acceptAndSave;
  global.previewAddSuggestedDx = addSuggestedDx;
  global.previewIgnoreSuggestedDx = ignoreSuggestedDx;
})(window);
