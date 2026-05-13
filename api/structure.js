// api/structure.js — Endpoint POST /api/structure
// Convierte texto libre + diagnósticos CIE-10 a JSON NOM-004 estructurado.
// En modo MOCK_AI=true devuelve respuesta predefinida (no consume API).

const express = require('express');
const router = express.Router();

require('dotenv').config();

const PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
const MOCK_AI = process.env.MOCK_AI === 'true';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '4096', 10);

// ── Esquema esperado de la respuesta ───────────────────────────────────
const RESPONSE_SCHEMA_HINT = `
{
  "motivo_consulta": "string — motivo principal expresado por el paciente",
  "padecimiento_inicio": "string — cuándo y cómo inició el cuadro",
  "padecimiento_sintomas": "string — síntomas, evolución, factores",
  "antecedentes_relevantes": "string — APP, AHF, alergias mencionados",
  "signos_vitales": {
    "tas": "string", "tad": "string", "fc": "string", "fr": "string",
    "temp": "string", "spo2": "string", "peso": "string", "talla": "string",
    "glucemia": "string", "dolor": "string"
  },
  "exploracion_fisica": {
    "habitus": "string",
    "cabeza": "string",
    "torax": "string",
    "abdomen": "string",
    "extremidades": "string",
    "neurologico": "string"
  },
  "estudios_solicitados": "string — estudios pedidos en esta consulta",
  "diagnostico_principal_texto": "string — diagnóstico principal narrativo",
  "diagnosticos_detectados_en_texto": [
    { "mencion": "string", "sugerencia_codigo_cie10": "string", "sugerencia_descripcion": "string" }
  ],
  "pronostico": "string",
  "tratamiento": "string — medicamentos, dosis, vías",
  "indicaciones_reposo": "string",
  "indicaciones_dieta": "string",
  "indicaciones_cita": "string",
  "abreviaturas_expandidas": [
    { "original": "string", "expandida": "string" }
  ],
  "campos_no_inferidos": ["string"],
  "confianza_global": "alta | media | baja"
}
`.trim();

// ── Prompt builder ─────────────────────────────────────────────────────
function buildPrompt(payload) {
  const { texto, diagnosticos, paciente } = payload;
  const dxList = (diagnosticos || []).map(d =>
    `  - ${d.codigo}: ${d.descripcion}`).join('\n') || '  (ninguno capturado)';

  return `Eres un asistente clínico especializado en estructurar notas médicas según la NOM-004-SSA3-2012 (Del expediente clínico) de México.

REGLAS ESTRICTAS:
1. NO inventes información. Si un campo no aparece en el texto, déjalo "" y agrégalo a "campos_no_inferidos".
2. Expande TODAS las abreviaturas a su forma completa en los campos estructurados (DM2 → diabetes mellitus tipo 2, HTA → hipertensión arterial, c/24h → cada 24 horas, etc.). Reporta las expansiones en "abreviaturas_expandidas".
3. Si detectas en el texto un diagnóstico que NO está en la lista de capturados, agrégalo a "diagnosticos_detectados_en_texto" con sugerencia CIE-10. NO modifiques la lista original.
4. Los signos vitales se extraen a campos numéricos individuales (sin unidades, ej. "138" no "138 mmHg"). TA se separa en TAS y TAD.
5. Usa lenguaje clínico formal y mantén fidelidad al texto original.
6. Devuelve EXCLUSIVAMENTE JSON válido, sin markdown, sin \`\`\`json fences, sin texto antes ni después.

ESQUEMA DE RESPUESTA:
${RESPONSE_SCHEMA_HINT}

DATOS DE ENTRADA:
- Edad del paciente: ${paciente?.edad || 'no especificada'}
- Sexo: ${paciente?.sexo || 'no especificado'}
- Diagnósticos CIE-10 ya capturados:
${dxList}

NOTA LIBRE DEL MÉDICO:
"""
${texto}
"""

Devuelve el JSON ahora:`;
}

// ── Mock para desarrollo ───────────────────────────────────────────────
function mockResponse(payload) {
  return {
    motivo_consulta: "Seguimiento de hipertensión arterial",
    padecimiento_inicio: "Paciente conocido con hipertensión arterial de larga evolución",
    padecimiento_sintomas: "Acude para control. Refiere apego al tratamiento. Niega cefalea, dolor torácico ni disnea.",
    antecedentes_relevantes: "Antecedente de diabetes mellitus tipo 2 controlada. Niega alergias.",
    signos_vitales: {
      tas: "138", tad: "85", fc: "76", fr: "16",
      temp: "36.5", spo2: "97", peso: "82", talla: "1.72",
      glucemia: "", dolor: "0"
    },
    exploracion_fisica: {
      habitus: "Buen estado general, consciente, orientado",
      cabeza: "Sin alteraciones aparentes",
      torax: "Cardiopulmonar sin compromiso",
      abdomen: "Blando, depresible, no doloroso a la palpación",
      extremidades: "Sin edema, llenado capilar adecuado",
      neurologico: ""
    },
    estudios_solicitados: "Química sanguínea y perfil lipídico",
    diagnostico_principal_texto: "Hipertensión arterial esencial controlada",
    diagnosticos_detectados_en_texto: (payload.diagnosticos || []).some(d => /e11/i.test(d.codigo)) ? [] : [
      {
        mencion: "DM2 controlada",
        sugerencia_codigo_cie10: "E11.9",
        sugerencia_descripcion: "Diabetes mellitus tipo 2 sin complicaciones"
      }
    ],
    pronostico: "Favorable",
    tratamiento: "Continúa losartán 50 mg cada 24 horas, vía oral",
    indicaciones_reposo: "",
    indicaciones_dieta: "Hiposódica",
    indicaciones_cita: "Cita en 2 meses",
    abreviaturas_expandidas: [
      { original: "HTA", expandida: "hipertensión arterial" },
      { original: "DM2", expandida: "diabetes mellitus tipo 2" },
      { original: "c/24h", expandida: "cada 24 horas" }
    ],
    campos_no_inferidos: ["indicaciones_reposo"],
    confianza_global: "alta"
  };
}

// ── Validación de respuesta ────────────────────────────────────────────
function validateStructure(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.signos_vitales || typeof obj.signos_vitales !== 'object') return false;
  if (!obj.exploracion_fisica || typeof obj.exploracion_fisica !== 'object') return false;
  if (!Array.isArray(obj.diagnosticos_detectados_en_texto)) return false;
  if (!Array.isArray(obj.abreviaturas_expandidas)) return false;
  if (!Array.isArray(obj.campos_no_inferidos)) return false;
  return true;
}

// ── Adapter Anthropic ──────────────────────────────────────────────────
async function callAnthropic(prompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }]
  });

  const textBlock = (message.content || []).find(b => b.type === 'text');
  if (!textBlock) throw new Error('Respuesta sin contenido textual');

  return {
    text: textBlock.text,
    usage: message.usage,
    model: message.model
  };
}

async function callAI(prompt) {
  if (PROVIDER === 'anthropic') return callAnthropic(prompt);
  throw new Error(`Proveedor no soportado: ${PROVIDER}`);
}

// ── Endpoint principal ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { texto, diagnosticos, paciente } = req.body || {};

    if (!texto || typeof texto !== 'string' || texto.trim().length < 20) {
      return res.status(400).json({
        ok: false,
        error: 'El texto debe tener al menos 20 caracteres.'
      });
    }

    if (texto.length > 20000) {
      return res.status(400).json({
        ok: false,
        error: 'El texto excede 20000 caracteres.'
      });
    }

    // Override: el cliente puede forzar mock para fallback de demo
    const forceMock = req.headers['x-force-mock'] === 'true';
    if (MOCK_AI || forceMock) {
      const startTime = Date.now();
      await new Promise(r => setTimeout(r, 800));
      const data = mockResponse({ texto, diagnosticos, paciente });
      return res.json({
        ok: true,
        data,
        meta: {
          mocked: true,
          provider: PROVIDER,
          model: 'mock-v1',
          latencyMs: Date.now() - startTime,
          forced: forceMock
        }
      });
    }

    // Modo real
    const startTime = Date.now();
    const prompt = buildPrompt({ texto, diagnosticos, paciente });

    let aiResp;
    try {
      aiResp = await callAI(prompt);
    } catch (apiErr) {
      console.error('Falla en llamada a IA:', apiErr);
      return res.status(503).json({
        ok: false,
        error: 'La API de IA está temporalmente no disponible.',
        details: apiErr.message,
        suggest_fallback: true
      });
    }

    const latencyMs = Date.now() - startTime;

    let parsed;
    try {
      const clean = aiResp.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('JSON inválido devuelto por la IA:', aiResp.text.slice(0, 500));
      return res.status(502).json({
        ok: false,
        error: 'La IA devolvió una respuesta no parseable.',
        raw: aiResp.text.slice(0, 500),
        suggest_fallback: true
      });
    }

    if (!validateStructure(parsed)) {
      return res.status(502).json({
        ok: false,
        error: 'La respuesta de la IA no cumple el esquema esperado.',
        received: parsed,
        suggest_fallback: true
      });
    }

    return res.json({
      ok: true,
      data: parsed,
      meta: {
        mocked: false,
        provider: PROVIDER,
        model: aiResp.model,
        usage: aiResp.usage,
        latencyMs
      }
    });

  } catch (err) {
    console.error('Error en /api/structure:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error interno',
      suggest_fallback: true
    });
  }
});

module.exports = router;
