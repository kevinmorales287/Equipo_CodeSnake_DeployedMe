// modules/preview.module.js — Vista previa NOM-004 después de estructurar
// Muestra el resultado de la IA en un tab editable con autosave, banner de
// diagnósticos detectados y firma/cierre directo desde la vista previa.

(function initPreviewModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  // ── Mapeo: path del JSON de la IA → campo del consultation ───────────
  // Cuando el médico edita un campo en la preview, se actualiza
  // AMBOS sitios: el ai_structured_result (fuente para re-render de preview)
  // y el campo correspondiente del consultation (fuente para PDF y tabs clásicos).
  //
  // Si un path mapea a múltiples campos del consultation (ej. signos vitales
  // se duplican en sv_* y nota_sv_*), se actualizan todos.
  const PATH_TO_FIELDS = {
    // Identificación / padecimiento
    'motivo_consulta': ['nota_motivo_consulta'],
    'antecedentes_relevantes': [],
    'padecimiento_inicio': ['padecimiento_inicio', 'nota_padecimiento_inicio'],
    'padecimiento_sintomas': ['padecimiento_sintomas', 'nota_padecimiento_sintomas'],

    // Historia clínica (modo historia)
    'ahf': ['ahf'],
    'apnp.tabaquismo': ['tabaquismo_detalle'],
    'apnp.alcoholismo': ['alcoholismo_detalle'],
    'apnp.toxicomanias': ['toxicomanias_detalle'],
    'apnp.actividad_fisica': ['actfisica_detalle'],
    'apnp.otros': ['apnp_otros'],
    'app.enfermedades': ['app_enfermedades'],
    'app.cirugias': ['app_cirugias'],
    'app.traumatismos': ['app_traumatismos'],
    'app.alergias': ['app_alergias'],
    'app.transfusiones': ['app_transfusiones'],
    'app.medicamentos': ['app_medicamentos'],

    // Revisión por sistemas (modo historia)
    'revision_sistemas.cardiovascular': ['sis_cardiovascular'],
    'revision_sistemas.respiratorio': ['sis_respiratorio'],
    'revision_sistemas.digestivo': ['sis_digestivo'],
    'revision_sistemas.neurologico': ['sis_neurologico'],
    'revision_sistemas.urinario': ['sis_urinario'],
    'revision_sistemas.musculoesqueletico': ['sis_musculoesqueletico'],
    'revision_sistemas.piel': ['sis_piel'],
    'revision_sistemas.endocrino': ['sis_endocrino'],
    'revision_sistemas.genitoreproductivo': ['sis_genitoreproductivo'],
    'revision_sistemas.psiquiatrico': ['sis_psiquiatrico'],

    // Signos vitales (se duplican en sv_* y nota_sv_*)
    'signos_vitales.tas':       ['sv_tas', 'nota_sv_tas'],
    'signos_vitales.tad':       ['sv_tad', 'nota_sv_tad'],
    'signos_vitales.fc':        ['sv_fc', 'nota_sv_fc'],
    'signos_vitales.fr':        ['sv_fr', 'nota_sv_fr'],
    'signos_vitales.temp':      ['sv_temp', 'nota_sv_temp'],
    'signos_vitales.spo2':      ['sv_spo2', 'nota_sv_spo2'],
    'signos_vitales.peso':      ['sv_peso', 'nota_sv_peso'],
    'signos_vitales.talla':     ['sv_talla', 'nota_sv_talla'],
    'signos_vitales.glucemia':  ['sv_glucemia', 'nota_sv_glucemia'],
    'signos_vitales.dolor':     ['sv_dolor', 'nota_sv_dolor'],

    // Exploración física
    'exploracion_fisica.habitus':      ['sv_habitus', 'nota_sv_habitus'],
    'exploracion_fisica.cabeza':       ['exp_cabeza', 'nota_exp_cabeza'],
    'exploracion_fisica.torax':        ['exp_torax', 'nota_exp_torax'],
    'exploracion_fisica.abdomen':      ['exp_abdomen', 'nota_exp_abdomen'],
    'exploracion_fisica.extremidades': ['exp_extremidades', 'nota_exp_extremidades'],
    'exploracion_fisica.neurologico':  ['exp_neurologico', 'nota_exp_neurologico'],

    // Plan
    'estudios_solicitados':        ['estudios_solicitados', 'nota_estudios_solicitados'],
    'diagnostico_principal_texto': ['diagnostico', 'nota_diagnostico'],
    'pronostico':                  ['pronostico_detalle', 'nota_pronostico_detalle'],
    'tratamiento':                 ['tratamiento', 'nota_tratamiento'],
    'indicaciones_reposo':         ['indicaciones_reposo', 'nota_indicaciones_reposo'],
    'indicaciones_dieta':          ['indicaciones_dieta', 'nota_indicaciones_dieta'],
    'indicaciones_cita':           ['indicaciones_cita', 'nota_indicaciones_cita'],
  };

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // Genera un campo editable con autosave on input (textarea por defecto)
  function editableField(label, value, path, opts = {}) {
    const empty = !value || !String(value).trim();
    const multiline = opts.multiline !== false;
    const id = 'prev-edit-' + path.replace(/\./g, '-');
    const ph = opts.placeholder || 'Sin información — edita aquí si corresponde';

    const control = multiline
      ? `<textarea
          id="${id}"
          class="prev-edit-textarea ${empty ? 'is-empty' : ''}"
          data-path="${path}"
          placeholder="${ph}"
          rows="${opts.rows || 2}"
          oninput="previewOnFieldEdit(this)">${escapeHtml(value || '')}</textarea>`
      : `<input
          type="text"
          id="${id}"
          class="prev-edit-input ${empty ? 'is-empty' : ''}"
          data-path="${path}"
          placeholder="${ph}"
          value="${escapeHtml(value || '')}"
          oninput="previewOnFieldEdit(this)" />`;

    return `<div class="prev-field prev-field-editable">
      <label for="${id}" class="prev-field-label">${label}</label>
      ${control}
    </div>`;
  }

  // Versión compacta para signos vitales
  function editableRow(label, value, path, opts = {}) {
    const id = 'prev-edit-' + path.replace(/\./g, '-');
    const type = opts.type || 'text';
    return `<div class="prev-row prev-row-editable">
      <label for="${id}" class="prev-label">${label}</label>
      <input
        type="${type}"
        id="${id}"
        class="prev-value-input"
        data-path="${path}"
        value="${escapeHtml(value || '')}"
        oninput="previewOnFieldEdit(this)" />
    </div>`;
  }

  // ── Setter por dot-notation en un objeto (mutativo) ────────────────
  function setByPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') {
        cur[keys[i]] = {};
      }
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  // Debounce por path
  const saveTimers = {};

  function onFieldEdit(el) {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) return;

    const path = el.getAttribute('data-path');
    if (!path) return;
    const value = el.value;

    // 1. Actualizar ai_structured_result (fuente de la preview)
    setByPath(c.ai_structured_result, path, value);

    // 2. Actualizar campos del consultation según mapeo
    const targets = PATH_TO_FIELDS[path] || [];
    targets.forEach(field => { c[field] = value; });

    // 3. Marcar como editado manualmente (para distinguir de auto-IA)
    c.ai_structured_edited = true;
    c.ai_structured_edited_at = new Date().toISOString();

    // 4. Indicador visual: campo dirty
    el.classList.add('prev-edit-dirty');

    // 5. Autosave debounced (800ms por campo)
    clearTimeout(saveTimers[path]);
    saveTimers[path] = setTimeout(() => {
      if (typeof global.saveConsultations === 'function') {
        global.saveConsultations();
      }
      el.classList.remove('prev-edit-dirty');
      el.classList.add('prev-edit-saved');
      updateSaveIndicator();
      setTimeout(() => el.classList.remove('prev-edit-saved'), 1500);
    }, 800);
  }

  function updateSaveIndicator() {
    const el = document.getElementById('prev-save-indicator');
    if (el) {
      el.textContent = '● Cambios guardados ' + new Date().toLocaleTimeString('es-MX');
    }
  }

  function show() {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) {
      alert('Aún no hay resultado estructurado. Haz click en "Estructurar con IA" primero.');
      return;
    }

    // Renderizar el contenido primero
    render();

    // Ocultar TODOS los tabs (display:none explícito, no solo quitar .active)
    document.querySelectorAll('.record-tab-content').forEach(t => {
      t.classList.remove('active');
      t.style.display = 'none';
    });

    // Mostrar el tab preview con display:block explícito
    const el = document.getElementById('tab-preview');
    if (!el) {
      console.error('preview.show(): falta #tab-preview en index.html');
      return;
    }
    el.classList.add('active');
    el.style.display = 'block';

    // Actualizar estado interno de la app
    if (app()) app().currentTab = 'preview';

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Consolidar medicamentos estructurados capturados manualmente en el cuadro Tratamiento
    function formatMedLine(m) {
      const partes = [
        m.nombre,
        m.concentracion,
        m.dosis,
        m.via,
        m.frecuencia,
        m.duracion ? `por ${m.duracion}` : ''
      ].filter(Boolean);
      return '• ' + partes.join(' · ');
    }
    const medsEstructurados = [
      ...(c.medicamentosLibre || []),
      ...(c.medicamentosNota || []),
      ...(c.medicamentos || [])
    ].filter(m => m && (m.nombre || m.dosis));
    if (medsEstructurados.length) {
      const medsTexto = medsEstructurados.map(formatMedLine).join('\n');
      data.tratamiento = (data.tratamiento && data.tratamiento.trim())
        ? (data.tratamiento.trim() + '\n\n' + medsTexto)
        : medsTexto;
    }

    // ── Detección de modo historia ────────────────────────────────────
    // Se considera "historia" si la consulta tiene libreMode=historia
    // o si la IA devolvió cualquiera de los bloques exclusivos de historia.
    const isHistoria = (c.libreMode === "historia") || !!data.ahf || !!data.apnp || !!data.app || !!data.revision_sistemas;
    const apnp = data.apnp || {};
    const app_ = data.app || {};
    const rs = data.revision_sistemas || {};

    const html = `
      <div class="prev-wrap">

        <div class="prev-header">
          <div>
            <h2 class="prev-title">${isHistoria ? 'Vista previa — Historia clínica NOM-004' : 'Vista previa NOM-004'}</h2>
            <p class="prev-subtitle">
              Generado por IA · Confianza:
              <span class="prev-badge prev-badge-${data.confianza_global || 'media'}">
                ${data.confianza_global || 'media'}
              </span>
              · ${new Date(c.ai_structured_at).toLocaleString('es-MX')}
              <span id="prev-save-indicator" class="prev-save-indicator"></span>
            </p>
          </div>
          <div class="prev-header-actions">
            <button onclick="previewBackToFree()">← Editar texto libre</button>
            <button onclick="previewDownloadPdf()">⬇ Descargar PDF NOM-004</button>
            <button class="btn-primary" onclick="previewSignAndClose()">✓ Firmar y cerrar consulta</button>
          </div>
        </div>

        ${dxSugeridos.length ? `
        <div class="prev-banner prev-banner-warn">
          <p class="prev-banner-title">⚠️ Diagnósticos detectados en el texto pero no capturados:</p>
          <ul class="prev-suggestions" id="prev-dx-suggestions">
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
            ${editableField('Motivo de consulta', data.motivo_consulta, 'motivo_consulta')}
            ${editableField('Antecedentes relevantes', data.antecedentes_relevantes, 'antecedentes_relevantes')}
          </div>
        </section>

        ${isHistoria ? `
        <section class="prev-section">
          <h3>Antecedentes heredofamiliares</h3>
          ${editableField('AHF', data.ahf, 'ahf', { rows: 3 })}
        </section>

        <section class="prev-section">
          <h3>Antecedentes personales no patológicos</h3>
          <div class="prev-grid-2">
            ${editableField('Tabaquismo', apnp.tabaquismo, 'apnp.tabaquismo')}
            ${editableField('Alcoholismo', apnp.alcoholismo, 'apnp.alcoholismo')}
            ${editableField('Toxicomanías', apnp.toxicomanias, 'apnp.toxicomanias')}
            ${editableField('Actividad física', apnp.actividad_fisica, 'apnp.actividad_fisica')}
          </div>
          ${editableField('Otros (escolaridad, ocupación, vivienda)', apnp.otros, 'apnp.otros', { rows: 3 })}
        </section>

        <section class="prev-section">
          <h3>Antecedentes personales patológicos</h3>
          <div class="prev-grid-2">
            ${editableField('Enfermedades previas', app_.enfermedades, 'app.enfermedades')}
            ${editableField('Cirugías', app_.cirugias, 'app.cirugias')}
            ${editableField('Traumatismos', app_.traumatismos, 'app.traumatismos')}
            ${editableField('Alergias', app_.alergias, 'app.alergias')}
            ${editableField('Transfusiones', app_.transfusiones, 'app.transfusiones')}
            ${editableField('Medicamentos actuales', app_.medicamentos, 'app.medicamentos')}
          </div>
        </section>
        ` : ''}

        <section class="prev-section">
          <h3>Padecimiento actual</h3>
          ${editableField('Inicio', data.padecimiento_inicio, 'padecimiento_inicio')}
          ${editableField('Sintomatología y evolución', data.padecimiento_sintomas, 'padecimiento_sintomas', { rows: 3 })}
        </section>

        <section class="prev-section">
          <h3>Signos vitales</h3>
          <div class="prev-vitals">
            ${editableRow('TAS', sv.tas, 'signos_vitales.tas')}
            ${editableRow('TAD', sv.tad, 'signos_vitales.tad')}
            ${editableRow('FC', sv.fc, 'signos_vitales.fc')}
            ${editableRow('FR', sv.fr, 'signos_vitales.fr')}
            ${editableRow('Temp', sv.temp, 'signos_vitales.temp')}
            ${editableRow('SpO₂', sv.spo2, 'signos_vitales.spo2')}
            ${editableRow('Peso', sv.peso, 'signos_vitales.peso')}
            ${editableRow('Talla', sv.talla, 'signos_vitales.talla')}
            ${editableRow('Glucemia', sv.glucemia, 'signos_vitales.glucemia')}
            ${editableRow('Dolor', sv.dolor, 'signos_vitales.dolor')}
          </div>
        </section>

        <section class="prev-section">
          <h3>Exploración física</h3>
          <div class="prev-grid-2">
            ${editableField('Habitus', ef.habitus, 'exploracion_fisica.habitus')}
            ${editableField('Cabeza', ef.cabeza, 'exploracion_fisica.cabeza')}
            ${editableField('Tórax', ef.torax, 'exploracion_fisica.torax')}
            ${editableField('Abdomen', ef.abdomen, 'exploracion_fisica.abdomen')}
            ${editableField('Extremidades', ef.extremidades, 'exploracion_fisica.extremidades')}
            ${editableField('Neurológico', ef.neurologico, 'exploracion_fisica.neurologico')}
          </div>
        </section>

        ${isHistoria ? `
        <section class="prev-section">
          <h3>Revisión por aparatos y sistemas</h3>
          <div class="prev-grid-2">
            ${editableField('Cardiovascular', rs.cardiovascular, 'revision_sistemas.cardiovascular')}
            ${editableField('Respiratorio', rs.respiratorio, 'revision_sistemas.respiratorio')}
            ${editableField('Digestivo', rs.digestivo, 'revision_sistemas.digestivo')}
            ${editableField('Neurológico', rs.neurologico, 'revision_sistemas.neurologico')}
            ${editableField('Urinario', rs.urinario, 'revision_sistemas.urinario')}
            ${editableField('Musculoesquelético', rs.musculoesqueletico, 'revision_sistemas.musculoesqueletico')}
            ${editableField('Piel y anexos', rs.piel, 'revision_sistemas.piel')}
            ${editableField('Endocrino', rs.endocrino, 'revision_sistemas.endocrino')}
            ${editableField('Genitorreproductivo', rs.genitoreproductivo, 'revision_sistemas.genitoreproductivo')}
            ${editableField('Psiquiátrico', rs.psiquiatrico, 'revision_sistemas.psiquiatrico')}
          </div>
        </section>
        ` : ''}

        <section class="prev-section">
          <h3>Diagnósticos</h3>
          <div class="prev-dx-list" id="prev-dx-badges">
            ${dxCapturados.length ? dxCapturados.map(d => `
              <span class="prev-dx-badge">
                <code>${escapeHtml(d.codigo)}</code>
                ${escapeHtml(d.descripcion)}
              </span>
            `).join('') : '<span class="prev-empty">Sin diagnósticos CIE-10 capturados</span>'}
          </div>
          ${editableField('Diagnóstico narrativo', data.diagnostico_principal_texto, 'diagnostico_principal_texto', { rows: 2 })}
          ${editableField('Pronóstico', data.pronostico, 'pronostico')}
        </section>

        <section class="prev-section">
          <h3>Plan</h3>
          ${editableField('Tratamiento', data.tratamiento, 'tratamiento', { rows: 3 })}
          ${editableField('Estudios solicitados', data.estudios_solicitados, 'estudios_solicitados')}
          <div class="prev-grid-2">
            ${editableField('Reposo', data.indicaciones_reposo, 'indicaciones_reposo')}
            ${editableField('Dieta', data.indicaciones_dieta, 'indicaciones_dieta')}
          </div>
          ${editableField('Próxima cita', data.indicaciones_cita, 'indicaciones_cita')}
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
      </div>
    `;

    const tab = document.getElementById('tab-preview');
    if (tab) tab.innerHTML = html;
  }

  // Refrescar solo la lista de badges de diagnósticos capturados,
  // sin re-renderizar todo el tab (preserva ediciones manuales en otros inputs)
  function refreshDxBadges() {
    const c = app().currentConsultation;
    if (!c) return;
    const container = document.getElementById('prev-dx-badges');
    if (!container) return;
    const dx = c.diagnosticos_libre || [];
    container.innerHTML = dx.length ? dx.map(d => `
      <span class="prev-dx-badge">
        <code>${escapeHtml(d.codigo)}</code>
        ${escapeHtml(d.descripcion)}
      </span>
    `).join('') : '<span class="prev-empty">Sin diagnósticos CIE-10 capturados</span>';
  }

  // Refrescar solo la lista de sugerencias de diagnósticos detectados
  function refreshSuggestedDxList() {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) return;
    const sugeridos = c.ai_structured_result.diagnosticos_detectados_en_texto || [];
    const ul = document.getElementById('prev-dx-suggestions');
    if (!ul) {
      // Si la sección entera ya no existe y aún hay sugerencias, full re-render
      if (sugeridos.length) render();
      return;
    }
    if (!sugeridos.length) {
      // Quitar el banner completo
      const banner = ul.closest('.prev-banner');
      if (banner) banner.remove();
      return;
    }
    ul.innerHTML = sugeridos.map((s, i) => `
      <li>
        <span><b>${escapeHtml(s.mencion)}</b> → ${escapeHtml(s.sugerencia_descripcion)}
          <code>(${escapeHtml(s.sugerencia_codigo_cie10)})</code></span>
        <button onclick='previewAddSuggestedDx(${i})'>+ Agregar</button>
        <button onclick='previewIgnoreSuggestedDx(${i})' class="btn-secondary">Ignorar</button>
      </li>
    `).join('');
  }

  function backToFree() {
    const c = app().currentConsultation;
    if (c && c.ai_structured_edited) {
      const ok = confirm(
        'Has editado manualmente la vista previa. Si vuelves a estructurar con IA, ' +
        'esos cambios se sobrescribirán. ¿Continuar?'
      );
      if (!ok) return;
    }
    document.querySelectorAll('.record-tab-content').forEach(t => {
      t.classList.remove('active');
      t.style.display = 'none';
    });
    const el = document.getElementById('tab-libre-medico');
    if (el) {
      el.classList.add('active');
      el.style.display = 'block';
    }
    if (app()) app().currentTab = 'libre-medico';
  }

  function signAndClose() {
    // Reutiliza el cierre estándar (que firma y marca attended)
    if (typeof global.closeConsultation === 'function') {
      global.closeConsultation();
    } else {
      alert('Función de cerrar consulta no disponible.');
    }
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
    // Refrescar solo las dos zonas afectadas para preservar ediciones manuales
    refreshDxBadges();
    refreshSuggestedDxList();
  }

  function ignoreSuggestedDx(idx) {
    const c = app().currentConsultation;
    if (!c || !c.ai_structured_result) return;
    c.ai_structured_result.diagnosticos_detectados_en_texto.splice(idx, 1);
    if (typeof global.saveConsultations === 'function') global.saveConsultations();
    refreshSuggestedDxList();
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

  registry.preview = { show, render, PATH_TO_FIELDS };
  global.previewBackToFree = backToFree;
  global.previewSignAndClose = signAndClose;
  global.previewAddSuggestedDx = addSuggestedDx;
  global.previewIgnoreSuggestedDx = ignoreSuggestedDx;
  global.previewDownloadPdf = downloadPdf;
  global.previewOnFieldEdit = onFieldEdit;
})(window);
