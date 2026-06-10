// modules/metrics.module.js — Panel de métricas visibles para pitch
// Muestra: palabras, diagnósticos, tokens IA, latencia, costo estimado.

(function initMetricsModule(global) {
  const registry = global.ClinDataModules || (global.ClinDataModules = {});

  const state = {
    lastUsage: null,
    lastLatencyMs: null,
    lastCostUsd: null,
    totalCalls: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCostUsd: 0
  };

  // Precios Sonnet 4.5 por millón de tokens
  const PRICE_IN_PER_MTOK = 3.0;
  const PRICE_OUT_PER_MTOK = 15.0;

  function recordCall(meta, latencyMs) {
    if (!meta) return;
    state.lastLatencyMs = latencyMs;
    state.totalCalls++;

    if (meta.usage) {
      state.lastUsage = meta.usage;
      const inT = meta.usage.input_tokens || 0;
      const outT = meta.usage.output_tokens || 0;
      state.totalTokensIn += inT;
      state.totalTokensOut += outT;
      state.lastCostUsd = (inT * PRICE_IN_PER_MTOK / 1e6) + (outT * PRICE_OUT_PER_MTOK / 1e6);
      state.totalCostUsd += state.lastCostUsd;
    } else if (meta.mocked) {
      state.lastUsage = { input_tokens: 0, output_tokens: 0, mocked: true };
      state.lastCostUsd = 0;
    }

    renderPanel();
  }

  function renderPanel() {
    const panel = document.getElementById('metrics_panel');
    if (!panel) return;

    const u = state.lastUsage || {};
    const mocked = u.mocked;

    panel.innerHTML = `
      <div class="metrics-header">📊 Métricas IA</div>
      <div class="metrics-rows">
        <div class="metric-row">
          <span class="metric-label">Latencia última llamada</span>
          <span class="metric-value">${state.lastLatencyMs != null ? state.lastLatencyMs + ' ms' : '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Tokens entrada</span>
          <span class="metric-value">${u.input_tokens != null ? u.input_tokens.toLocaleString() : '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Tokens salida</span>
          <span class="metric-value">${u.output_tokens != null ? u.output_tokens.toLocaleString() : '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Costo última llamada</span>
          <span class="metric-value">${mocked ? '<span class="metric-mocked">MOCK</span>' : state.lastCostUsd != null ? '$' + state.lastCostUsd.toFixed(4) : '—'}</span>
        </div>
        <hr class="metrics-divider">
        <div class="metric-row">
          <span class="metric-label">Total llamadas en sesión</span>
          <span class="metric-value">${state.totalCalls}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Costo acumulado</span>
          <span class="metric-value">$${state.totalCostUsd.toFixed(4)}</span>
        </div>
      </div>
      <button class="metrics-toggle" onclick="metricsTogglePanel()">−</button>
    `;
  }

  function ensurePanel() {
    if (document.getElementById('metrics_panel')) return;
    const div = document.createElement('div');
    div.id = 'metrics_panel';
    div.className = 'metrics-panel';
    document.body.appendChild(div);
    renderPanel();
  }

  function togglePanel() {
    const p = document.getElementById('metrics_panel');
    if (!p) return;
    p.classList.toggle('collapsed');
  }

  function show() { ensurePanel(); }
  function hide() {
    const p = document.getElementById('metrics_panel');
    if (p) p.remove();
  }

  registry.metrics = { recordCall, show, hide, state };
  global.metricsTogglePanel = togglePanel;
})(window);
