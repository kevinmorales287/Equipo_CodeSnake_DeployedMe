// modules/autodemo.module.js — Typewriter automático para pitch
// Recibe un caso y escribe el texto letra por letra en el textarea.

(function initAutoDemoModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});
  const app = () => global.ClinDataApp;

  let activeTimer = null;
  let cancelled = false;

  const SPEEDS = {
    rapida: 8,
    normal: 18,
    realista: 32
  };

  function cancel() {
    cancelled = true;
    if (activeTimer) clearTimeout(activeTimer);
    activeTimer = null;
  }

  function typeText(caso, speedKey) {
    speedKey = speedKey || 'normal';
    return new Promise((resolve) => {
      const ta = document.getElementById('notas_libre_medico');
      if (!ta) { resolve(); return; }

      const consultation = app().currentConsultation;
      if (!consultation) { resolve(); return; }

      consultation.diagnosticos_libre = JSON.parse(JSON.stringify(caso.diagnosticos || []));
      if (registry.freecapture) registry.freecapture.renderDxBadges();

      consultation.medicamentosLibre = (caso.medicamentos || []).map((m, idx) => ({
        ...m,
        id: Date.now() + idx
      }));
      if (typeof global.renderMedicamentosLibre === 'function') {
        global.renderMedicamentosLibre();
      }

      const fullText = caso.texto || '';
      ta.value = '';
      consultation.notas_libre_medico = '';
      cancelled = false;

      let i = 0;
      const delay = SPEEDS[speedKey] || SPEEDS.normal;

      function step() {
        if (cancelled) { resolve(); return; }
        if (i >= fullText.length) {
          if (registry.freecapture) registry.freecapture.onInput();
          if (registry.demoCases) registry.demoCases.startTimer(caso.id);
          resolve();
          return;
        }
        ta.value = fullText.slice(0, i + 1);
        consultation.notas_libre_medico = ta.value;
        if (registry.freecapture) registry.freecapture.onInput();
        ta.scrollTop = ta.scrollHeight;
        i++;
        const lastChar = fullText[i - 1];
        const charDelay = (lastChar === '.' || lastChar === '\n') ? delay * 8 : delay;
        activeTimer = setTimeout(step, charDelay);
      }
      step();
    });
  }

  function pickAndType() {
    const cases = (registry.demoCases && registry.demoCases.CASOS) || [];
    if (!cases.length) return;

    const modal = document.createElement('div');
    modal.className = 'ai-modal-backdrop';
    modal.innerHTML = `
      <div class="ai-modal" style="width: min(520px, 92vw);">
        <div class="ai-modal-header">
          <h3>⌨️ Auto-demo (typewriter)</h3>
          <button class="ai-modal-close" data-action="cancel">✕</button>
        </div>
        <div class="ai-modal-body">
          <p style="font-size: 13px; margin: 0 0 10px;">Elige el caso a escribir:</p>
          ${cases.map(c => `
            <div class="autodemo-case-pick" data-case="${c.id}">
              <span>${c.icono} <b>${c.titulo}</b> — ${c.descripcion}</span>
            </div>
          `).join('')}
          <p style="font-size: 12px; margin: 14px 0 6px; color: var(--text-muted);">Velocidad:</p>
          <div style="display: flex; gap: 8px;">
            <label><input type="radio" name="ad_speed" value="rapida"> Rápida</label>
            <label><input type="radio" name="ad_speed" value="normal" checked> Normal</label>
            <label><input type="radio" name="ad_speed" value="realista"> Realista</label>
          </div>
        </div>
        <div class="ai-modal-footer">
          <button data-action="cancel">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target.getAttribute('data-action') === 'cancel' || e.target === modal) {
        document.body.removeChild(modal);
        return;
      }
      const caseEl = e.target.closest('.autodemo-case-pick');
      if (caseEl) {
        const caseId = caseEl.getAttribute('data-case');
        const caso = cases.find(c => c.id === caseId);
        const speedKey = modal.querySelector('input[name="ad_speed"]:checked').value;
        document.body.removeChild(modal);
        if (caso) typeText(caso, speedKey);
      }
    });
  }

  registry.autodemo = { typeText, cancel, pickAndType };
  global.demoAutoTypePicker = pickAndType;
  global.demoAutoCancel = cancel;
})(window);
