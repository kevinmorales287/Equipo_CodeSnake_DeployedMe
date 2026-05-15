// modules/freecapture.module.js — Captura libre del médico
// Tab #tab-libre-medico: textarea narrativo + diagnósticos CIE-10 + checklist NOM-004.

(function initFreecaptureModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  // Items del checklist NOM-004. El item "diagnostico" se evalúa por array,
  // no por regex (los demás se prenden si la regex matchea el texto libre).
  const CHECKLIST_NOTA = [
    { id: "motivo",       label: "Motivo de consulta",
      regex: /\b(acude|consulta|motivo|refiere|presenta)\b/i },
    { id: "padecimiento", label: "Padecimiento actual",
      regex: /\b(dolor|síntoma|sintoma|inicio|evolución|días|horas|semanas)\b/i },
    { id: "vitales",      label: "Signos vitales",
      regex: /\b(TA|FC|FR|SatO2|sato2|temp|peso|talla|°C)\b/i },
    { id: "exploracion",  label: "Exploración física",
      regex: /\b(EF|abdomen|tórax|torax|cardiopulmonar|extremidades|consciente|exploración)\b/i },
    { id: "diagnostico",  label: "Diagnóstico (CIE-10)",
      regex: null }, // Especial: se prende por array de diagnósticos
    { id: "pronostico",   label: "Pronóstico",
      regex: /\b(pronóstico|pronostico|favorable|reservado|grave)\b/i },
    { id: "plan",         label: "Plan / Tratamiento",
      regex: /\b(tx|tratamiento|continúa|continua|inicio|suspender|mg|c\/\d+)\b/i },
    { id: "indicaciones", label: "Indicaciones / Cita",
      regex: /\b(cita|seguimiento|reposo|dieta|referencia|control)\b/i },
  ];

  const CHECKLIST_HISTORIA = [
    { id: "motivo",       label: "Motivo de consulta",
      regex: /\b(acude|consulta|motivo|refiere|presenta)\b/i },
    { id: "ahf",          label: "Antecedentes heredofamiliares",
      regex: /\b(madre|padre|abuel[oa]s?|hermanos?|familiares?|hereditari[oa]|carga genética|AHF)\b/i },
    { id: "apnp",         label: "Antecedentes no patológicos",
      regex: /\b(fum[ao]|tabaq|alcohol|drogas|toxicom|sedentari|ejercicio|escolar|ocupaci|vivienda|alimentaci|vacun)\b/i },
    { id: "app",          label: "Antecedentes patológicos",
      regex: /\b(alérgic|alergi|cirug[íi]a|operad|hospitaliz|fractur|traumatis|transfusi|diabet|hipertens|crónic|enfermedad previa|antecedente)\b/i },
    { id: "padecimiento", label: "Padecimiento actual",
      regex: /\b(dolor|síntoma|sintoma|inicio|evolución|días|horas|semanas|hace)\b/i },
    { id: "sistemas",     label: "Revisión por aparatos y sistemas",
      regex: /\b(cardiovascular|respiratori|digestiv|neurológic|urinari|musculoesquel|piel|endocrin|genitorrep|psiquiátric|sistem)\b/i },
    { id: "vitales",      label: "Signos vitales",
      regex: /\b(TA|FC|FR|SatO2|sato2|temp|peso|talla|°C)\b/i },
    { id: "exploracion",  label: "Exploración física",
      regex: /\b(EF|abdomen|tórax|torax|cardiopulmonar|extremidades|consciente|exploración|cabeza)\b/i },
    { id: "estudios",     label: "Estudios solicitados",
      regex: /\b(laboratori|biomet|química|electrolitos|rayos|radiografía|tomograf|ultrasoni|ecograf|estudio)\b/i },
    { id: "diagnostico",  label: "Diagnóstico (CIE-10)",
      regex: null },
    { id: "pronostico",   label: "Pronóstico",
      regex: /\b(pronóstico|pronostico|favorable|reservado|grave)\b/i },
    { id: "plan",         label: "Plan / Tratamiento",
      regex: /\b(tx|tratamiento|continúa|continua|inicio|suspender|mg|c\/\d+)\b/i },
    { id: "indicaciones", label: "Indicaciones / Cita",
      regex: /\b(cita|seguimiento|reposo|dieta|referencia|control)\b/i },
  ];

  function getLibreMode() {
    const c = app().currentConsultation;
    return (c && c.libreMode === "historia") ? "historia" : "nota-medica";
  }

  function getChecklist() {
    return getLibreMode() === "historia" ? CHECKLIST_HISTORIA : CHECKLIST_NOTA;
  }

  // ── Render del checklist ────────────────────────────────────────────
  function renderChecklist() {
    const ul = document.getElementById("libre_checklist_items");
    if (!ul) return;
    ul.innerHTML = getChecklist().map(item => `
      <li id="chk_${item.id}" class="chk-item chk-pending">
        <span class="chk-mark">○</span><span class="chk-label">${item.label}</span>
      </li>
    `).join("");
  }

  // ── Render de badges de diagnósticos ────────────────────────────────
  function renderDxBadges() {
    const container = document.getElementById("libre_dx_badges");
    if (!container) return;
    const consultation = app().currentConsultation;
    const dxList = (consultation && consultation.diagnosticos_libre) || [];

    container.innerHTML = dxList.map((dx, idx) => `
      <span class="libre-dx-badge">
        <span class="libre-dx-code">${escapeHtml(dx.codigo || "")}</span>
        <span class="libre-dx-desc">${escapeHtml(dx.descripcion || "")}</span>
        <span class="libre-dx-remove" onclick="freecaptureRemoveDx(${idx})">✕</span>
      </span>
    `).join("");

    updateChecklist();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // ── Agregar diagnóstico al array ────────────────────────────────────
  function addDx(item) {
    const consultation = app().currentConsultation;
    if (!consultation) return;
    if (!consultation.diagnosticos_libre) consultation.diagnosticos_libre = [];

    const codigo = item.codigo || item.cie10_code || "";
    const descripcion = item.descripcion || item.termino || "";

    // Evitar duplicados por código
    if (consultation.diagnosticos_libre.some(d => d.codigo === codigo)) return;

    consultation.diagnosticos_libre.push({ codigo, descripcion });

    renderDxBadges();
    saveDebounced();

    const input = document.getElementById("libre_dx_input");
    if (input) input.value = "";
    hideDxSuggestions();
  }

  function removeDx(idx) {
    const consultation = app().currentConsultation;
    if (!consultation || !consultation.diagnosticos_libre) return;
    consultation.diagnosticos_libre.splice(idx, 1);
    renderDxBadges();
    saveDebounced();
  }

  // ── Autocompletado CIE-10 ───────────────────────────────────────────
  let dxSearchTimer = null;
  function setupDxAutocomplete() {
    const input = document.getElementById("libre_dx_input");
    const sugBox = document.getElementById("libre_dx_suggestions");
    if (!input || !sugBox) return;

    const diag = registry.diagnostics;
    if (!diag) {
      console.warn("freecapture: registry.diagnostics no disponible");
      return;
    }

    diag.loadCie10Cache();

    // Limpiar listeners previos por si el tab se renderiza varias veces
    if (input._freecaptureBound) return;
    input._freecaptureBound = true;

    input.addEventListener("input", () => {
      clearTimeout(dxSearchTimer);
      const query = input.value.trim();
      if (query.length < 2) { hideDxSuggestions(); return; }
      dxSearchTimer = setTimeout(async () => {
        let results = diag.searchCie10Local(query);
        if (!results.length && window.location.protocol !== "file:") {
          try {
            const r = await fetch(`/api/conceptos?q=${encodeURIComponent(query)}`);
            if (r.ok) results = await r.json();
          } catch (e) { /* silencioso */ }
        }
        showDxSuggestions(results);
      }, 180);
    });

    input.addEventListener("keydown", (e) => {
      const items = sugBox.querySelectorAll(".libre-dx-sug-item");
      if (!items.length) return;
      const active = sugBox.querySelector(".libre-dx-sug-item.active");
      let idx = active ? Array.from(items).indexOf(active) : -1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        idx = Math.min(idx + 1, items.length - 1);
        items.forEach(i => i.classList.remove("active"));
        items[idx].classList.add("active");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        idx = Math.max(idx - 1, 0);
        items.forEach(i => i.classList.remove("active"));
        items[idx].classList.add("active");
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = active || items[0];
        if (target) target.click();
      } else if (e.key === "Escape") {
        hideDxSuggestions();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => hideDxSuggestions(), 200);
    });
  }

  function showDxSuggestions(results) {
    const sugBox = document.getElementById("libre_dx_suggestions");
    if (!sugBox || !results || !results.length) { hideDxSuggestions(); return; }
    sugBox.innerHTML = results.map((item, idx) => {
      const codigo = item.codigo || item.cie10_code || "";
      const desc = item.descripcion || item.termino || "";
      const payload = JSON.stringify({ codigo, descripcion: desc });
      return `
        <div class="libre-dx-sug-item ${idx === 0 ? 'active' : ''}"
             data-dx-payload="${escapeHtml(payload)}">
          <div class="libre-dx-sug-text">${escapeHtml(desc)}</div>
          <div class="libre-dx-sug-code">${escapeHtml(codigo)}</div>
        </div>
      `;
    }).join("");

    sugBox.querySelectorAll(".libre-dx-sug-item").forEach(el => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(el.getAttribute("data-dx-payload"));
          addDx(data);
        } catch (err) { /* silencioso */ }
      });
    });

    sugBox.style.display = "block";
  }

  function hideDxSuggestions() {
    const sugBox = document.getElementById("libre_dx_suggestions");
    if (sugBox) sugBox.style.display = "none";
  }

  // ── Manejo del textarea ─────────────────────────────────────────────
  function onInput() {
    const ta = document.getElementById("notas_libre_medico");
    if (!ta) return;
    const text = ta.value;

    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const wcEl = document.getElementById("libre_wordcount");
    if (wcEl) wcEl.textContent = `${words} palabras`;

    const consultation = app().currentConsultation;
    if (consultation) {
      consultation.notas_libre_medico = text;
      saveDebounced();
    }

    updateChecklist();

    const btn = document.querySelector(".libre-bottombar .btn-ai-structure");
    if (btn) btn.disabled = words < 50;
  }

  function updateChecklist() {
    const ta = document.getElementById("notas_libre_medico");
    const text = ta ? ta.value : "";
    const consultation = app().currentConsultation;
    const dxCount = (consultation && consultation.diagnosticos_libre)
      ? consultation.diagnosticos_libre.length : 0;

    const items = getChecklist();
    let covered = 0;
    items.forEach(item => {
      const li = document.getElementById(`chk_${item.id}`);
      if (!li) return;
      let isDone = false;
      const labelEl = li.querySelector(".chk-label");
      if (item.id === "diagnostico") {
        isDone = dxCount > 0;
        if (labelEl) {
          labelEl.textContent = isDone
            ? `Diagnóstico (${dxCount} CIE-10)`
            : item.label;
        }
      } else if (item.regex) {
        isDone = item.regex.test(text);
      }
      li.className = `chk-item ${isDone ? 'chk-done' : 'chk-pending'}`;
      const markEl = li.querySelector(".chk-mark");
      if (markEl) markEl.textContent = isDone ? "✓" : "○";
      if (isDone) covered++;
    });

    const progEl = document.getElementById("libre_progress");
    if (progEl) progEl.textContent = `${covered}/${items.length}`;
    const fillEl = document.getElementById("libre_progress_fill");
    if (fillEl) fillEl.style.width = `${(covered / items.length) * 100}%`;
  }

  // ── Guardado debounced ──────────────────────────────────────────────
  let saveTimer = null;
  function saveDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (typeof global.saveConsultations === "function") {
        global.saveConsultations();
        const el = document.getElementById("libre_autosave");
        if (el) el.textContent = "● Guardado " +
          new Date().toLocaleTimeString("es-MX");
      }
    }, 800);
  }

  // ── Carga inicial cuando se renderiza el tab ────────────────────────
  function load() {
    renderChecklist();
    setupDxAutocomplete();

    const consultation = app().currentConsultation;
    const ta = document.getElementById("notas_libre_medico");
    if (ta && consultation) {
      ta.value = consultation.notas_libre_medico || "";
    }

    // ── Adaptación de UI según modo (historia vs nota-medica) ─────────
    const mode = getLibreMode();
    const isHistoria = mode === "historia";

    if (ta) {
      ta.placeholder = isHistoria
        ? "Describe la primera consulta como hablarías: AHF, antecedentes, padecimiento actual, exploración, plan…"
        : "Escribe la consulta como hablarías. La IA estructurará al final…";
    }

    const sectionLabel = document.querySelector('#tab-libre-medico .libre-section:nth-of-type(2) .libre-section-label');
    if (sectionLabel) {
      sectionLabel.innerHTML = isHistoria
        ? `Historia clínica narrada <span class="libre-section-hint">— escribe libre, IA estructura</span>`
        : `Notas de la consulta <span class="libre-section-hint">— escribe libre, IA estructura</span>`;
    }

    const checklistHeader = document.querySelector('#tab-libre-medico .libre-checklist-header > span:first-child');
    if (checklistHeader) {
      checklistHeader.textContent = isHistoria
        ? "Cobertura NOM-004 · Historia clínica"
        : "Cobertura NOM-004 · Nota de evolución";
    }

    renderDxBadges();
    onInput();

    // Activar barra de demo y panel de métricas
    if (registry.demoCases) registry.demoCases.showDemoBar();
    if (registry.metrics) registry.metrics.show();
  }

  // ── Estructuración con IA + Vista previa ────────────────────────────
  function structure() {
    if (registry.aiStructure && typeof registry.aiStructure.structure === 'function') {
      registry.aiStructure.structure();
    } else {
      alert('Módulo de IA no disponible.');
    }
  }
  function preview() {
    if (registry.preview && typeof registry.preview.show === 'function') {
      registry.preview.show();
    } else {
      alert('Aún no has estructurado con IA.');
    }
  }
  function loadTemplate() { alert("Plantillas — pendiente."); }

  // El cierre real exige diagnóstico/tratamiento estructurados.
  // En Sprint 1 advertimos al médico antes de invocar closeConsultation.
  function signAndClose() {
    const consultation = app().currentConsultation;
    if (!consultation) return;
    const hasDx = (consultation.diagnosticos_libre || []).length > 0;
    const hasNotes = (consultation.notas_libre_medico || "").trim().length > 0;
    if (!hasDx || !hasNotes) {
      alert("Para firmar y cerrar necesitas al menos un diagnóstico CIE-10 y notas de la consulta.");
      return;
    }
    if (!consultation.tratamiento && !consultation.diagnostico) {
      const ok = confirm(
        "Aún no has estructurado las notas con IA (Sprint 2 pendiente).\n\n" +
        "¿Cerrar de todos modos? La consulta se guardará pero el formato " +
        "estructurado NOM-004 quedará vacío."
      );
      if (!ok) return;
      // Espejo mínimo para que closeConsultation no rechace el cierre
      consultation.diagnostico = (consultation.diagnosticos_libre || [])
        .map(d => `${d.descripcion} (${d.codigo})`).join("; ");
      consultation.tratamiento = "[Pendiente de estructurar — captura libre]";
    }
    if (typeof global.firmarExpediente === "function") global.firmarExpediente();
    if (typeof global.closeConsultation === "function") global.closeConsultation();
  }

  // ── Registro y exposición global ────────────────────────────────────
  registry.freecapture = {
    load, onInput, renderDxBadges, addDx, removeDx, updateChecklist,
    getLibreMode, getChecklist
  };
  global.freecaptureOnInput = onInput;
  global.freecaptureLoad = load;
  global.freecaptureStructure = structure;
  global.freecapturePreview = preview;
  global.freecaptureLoadTemplate = loadTemplate;
  global.freecaptureSignAndClose = signAndClose;
  global.freecaptureSelectDx = addDx;
  global.freecaptureRemoveDx = removeDx;
})(window);
