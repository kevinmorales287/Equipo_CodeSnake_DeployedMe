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
            <button onclick="previewDownloadPdf()">⬇ Descargar PDF NOM-004</button>
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

  function downloadPdf() {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) {
      alert('Estructura con IA primero antes de descargar el PDF.');
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF no está cargado. Recarga la página.');
      return;
    }

    const data = c.ai_structured_result;
    const sv = data.signos_vitales || {};
    const ef = data.exploracion_fisica || {};
    const patient = (app().patients || []).find(p => p.id === c.patientId) || {};
    const medico = app().currentUser || {};

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const margin = 15;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const contentW = pageW - margin * 2;
    let y = margin;

    function addText(text, opts) {
      opts = opts || {};
      const fontSize = opts.size || 10;
      const bold = opts.bold || false;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || '—'), contentW);
      lines.forEach(function(l) {
        if (y > pageH - margin - 10) { doc.addPage(); y = margin; }
        doc.text(l, margin, y);
        y += fontSize * 0.45;
      });
      y += 1;
    }

    function addSection(title) {
      y += 3;
      if (y > pageH - margin - 15) { doc.addPage(); y = margin; }
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(title, margin, y); y += 5;
      doc.setDrawColor(200); doc.line(margin, y - 1.5, pageW - margin, y - 1.5);
      doc.setTextColor(0); y += 1;
    }

    function addRow(label, value) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value || '—'), contentW - 45);
      lines.forEach(function(l, i) {
        if (y > pageH - margin - 10) { doc.addPage(); y = margin; }
        doc.text(l, margin + 42, y);
        if (i < lines.length - 1) y += 4;
      });
      y += 5;
    }

    // Encabezado
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('EXPEDIENTE CLÍNICO - NOM-004-SSA3-2012', pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('Generado: ' + new Date(c.ai_structured_at).toLocaleString('es-MX'), pageW / 2, y, { align: 'center' });
    y += 4;
    doc.text('Estructurado con asistencia de IA · ClinData', pageW / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;

    // Datos del paciente
    addSection('DATOS DEL PACIENTE');
    const nombrePaciente = patient.name || patient.nombre || ((patient.nombres || '') + ' ' + (patient.apellidos || '')).trim() || '—';
    addRow('Nombre', nombrePaciente);
    addRow('Edad', patient.edad || patient.age);
    addRow('Sexo', patient.sexo || patient.genero || patient.sex);
    addRow('Expediente', patient.id || patient.expediente);

    // Motivo y padecimiento
    addSection('MOTIVO DE CONSULTA');
    addText(data.motivo_consulta);

    addSection('ANTECEDENTES RELEVANTES');
    addText(data.antecedentes_relevantes);

    addSection('PADECIMIENTO ACTUAL');
    addRow('Inicio', data.padecimiento_inicio);
    addRow('Sintomatología', data.padecimiento_sintomas);

    // Signos vitales
    addSection('SIGNOS VITALES');
    var sv_text = 'TA: ' + (sv.tas || '—') + '/' + (sv.tad || '—') + ' mmHg   FC: ' + (sv.fc || '—') + ' lpm   FR: ' + (sv.fr || '—') + ' rpm   Temp: ' + (sv.temp || '—') + ' °C   SpO₂: ' + (sv.spo2 || '—') + ' %   Peso: ' + (sv.peso || '—') + ' kg   Talla: ' + (sv.talla || '—') + ' m';
    addText(sv_text, { size: 9 });

    // Exploración
    addSection('EXPLORACIÓN FÍSICA');
    addRow('Habitus', ef.habitus);
    addRow('Cabeza', ef.cabeza);
    addRow('Tórax', ef.torax);
    addRow('Abdomen', ef.abdomen);
    addRow('Extremidades', ef.extremidades);
    addRow('Neurológico', ef.neurologico);

    // Diagnósticos
    addSection('DIAGNÓSTICOS');
    var dxCap = c.diagnosticos_libre || [];
    if (dxCap.length) {
      dxCap.forEach(function(dx) { addRow(dx.codigo, dx.descripcion); });
    } else {
      addText('Sin diagnósticos CIE-10 capturados');
    }
    if (data.diagnostico_principal_texto) {
      addRow('Narrativa', data.diagnostico_principal_texto);
    }
    addRow('Pronóstico', data.pronostico);

    // Plan
    addSection('PLAN Y TRATAMIENTO');
    addRow('Tratamiento', data.tratamiento);
    addRow('Estudios', data.estudios_solicitados);
    addRow('Reposo', data.indicaciones_reposo);
    addRow('Dieta', data.indicaciones_dieta);
    addRow('Próxima cita', data.indicaciones_cita);

    // Firma
    y += 6;
    if (y > pageH - 35) { doc.addPage(); y = margin; }
    doc.setDrawColor(0); doc.line(margin, y, margin + 70, y);
    y += 4;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(medico.nombre || medico.displayName || medico.username || '—', margin, y); y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('Cédula: ' + (medico.cedula || '—'), margin, y);

    // Footer en todas las páginas
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(140);
      doc.text('Página ' + i + ' de ' + totalPages + ' · NOM-004-SSA3-2012 · ClinData',
        pageW / 2, pageH - 8, { align: 'center' });
    }

    var fname = 'Expediente_' + (patient.id || patient.expediente || 'paciente') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(fname);
  }

  registry.preview = { show, render };
  global.previewBackToFree = backToFree;
  global.previewAcceptAndSave = acceptAndSave;
  global.previewAddSuggestedDx = addSuggestedDx;
  global.previewIgnoreSuggestedDx = ignoreSuggestedDx;
  global.previewDownloadPdf = downloadPdf;
})(window);
