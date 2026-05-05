# ClinData — Expediente Clínico Electrónico

Sistema de Expediente Clínico Electrónico (ECE) conforme a NOM-004-SSA3-2012. SPA en vanilla JS servida por Node.js/Express en puerto 3000.

## Arquitectura general

- Sin framework ni bundler. Todo el JS son IIFEs cargados como `<script>` en `index.html`.
- Estado global en `window.ClinDataApp` (objeto único, hydratado desde localStorage/API).
- Módulos registrados en `window.ClinDataModules` — cada módulo se auto-registra al cargarse:

```js
(function initXxxModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;
    // ...funciones...
    registry.xxx = { fn1, fn2 };
    global.fn1 = (...args) => fn1(...args);   // exposición global para llamadas desde HTML
})(window);
```

- Servidor: `server.js` — Express, puerto 3000, sirve archivos estáticos + dos endpoints:
  - `GET /api/abreviaturas`
  - `GET /api/conceptos`
  - Base de datos: MySQL2

## Módulos principales

| Archivo | Registro | Responsabilidad |
|---|---|---|
| `modules/queue.module.js` | `registry.queue` | Fila de consulta (agregar, atender, retirar) |
| `modules/triage.module.js` | `registry.triage` | Triaje de urgencias |
| `modules/consultation.module.js` | `registry.consultation` | Expediente/notas médicas |
| `modules/patients.module.js` | `registry.patients` | CRUD de pacientes |
| `modules/auth.module.js` | `registry.auth` | Autenticación y roles |

## Roles y permisos

| Permiso | medico | enfermero | recepcion | admin |
|---|---|---|---|---|
| `canWriteMedicalNotes` | ✓ | — | — | ✓ |
| `canWriteNursingNotes` | — | ✓ | — | ✓ |
| `canAddToQueue` | ✓ | ✓ | ✓ | ✓ |
| `canUseTriage` | ✓ | ✓ | — | ✓ |
| `canViewPatients` | ✓ | ✓ | ✓ | ✓ |

Verificar con `global.can("permiso")`. El enfermero se detecta con:
```js
const isNurse = global.can("canWriteNursingNotes") && !global.can("canWriteMedicalNotes");
```

## Tipos de nota (`tipoNota`)

| Valor | Cuándo se usa | Tab HTML |
|---|---|---|
| `"historia"` | Primera consulta del paciente | `#tab-historia` |
| `"nota-medica"` | Consultas de seguimiento (médico) | `#tab-nota-medica` |
| `"urgencias"` | Atención de urgencias | `#tab-urgencias` |
| `"evolucion"` | Nota de enfermería | `#tab-evolucion` |

`tipoNota` se determina en `attendFromQueue` al crear la consulta (si no existe) y se re-deriva en `renderMedicalRecord` si no está definido. El médico siempre abre la nota clínica; el enfermero siempre abre la nota de evolución.

## Flujo de datos del expediente

```
app().currentConsultation
        ↓ fillRecordFields()
      DOM (inputs/textareas)
        ↓ collectRecordFields()
  consultation object (en memoria)
        ↓ saveConsultations()
      localStorage / servidor
```

`ALL_RECORD_FIELDS` en `consultation.module.js` es la fuente única de verdad: lista todos los IDs de campos del formulario. Todo campo que aparezca ahí se leerá/escribirá automáticamente.

## Convención de nombres de campos

Los IDs de los `<input>` / `<textarea>` del formulario siguen este patrón:

| Prefijo | Sección |
|---|---|
| `pnp_` / `pnp-` | Perfil / datos personales del paciente |
| `app_` | Antecedentes patológicos personales |
| `apnp_` | Antecedentes patológicos no personales |
| `sv_` | Signos vitales (historia) |
| `nota_sv_` | Signos vitales (nota médica) |
| `nota_sis_` | Revisión por sistemas (nota médica) |
| `nota_exp_` | Exploración física (nota médica) |
| `nota_estudios_` | Estudios (nota médica) |
| `nota_` | Resto de campos de nota médica |
| `enf_` | Campos de nota de enfermería |
| `urg_` | Campos de nota de urgencias |

## Fila de consulta y consultas compartidas

Una entrada de fila (`consultQueue`) y una consulta (`consultations`) se vinculan mediante `queueEntryId`. Esto permite que médico y enfermero accedan al mismo objeto de consulta:

- Al atender desde la fila, se busca una consulta activa con el mismo `queueEntryId` antes de crear una nueva.
- El enfermero **no** marca la entrada como `"attended"` al atender — la deja en `"waiting"` para que el médico la siga viendo.
- `closeConsultation` sincroniza el estado `"attended"` de la entrada vinculada al cerrar.

## CSS relevante

- `expediente.css` — estilos del expediente, incluye regla de `text-transform: uppercase` para campos clínicos de `#tab-nota-medica` y `#tab-urgencias` (excluye números, readonly y selects).
- Las tarjetas de la fila y triaje están en el mismo archivo.

## Norma clínica

NOM-004-SSA3-2012 — Del expediente clínico. La estructura de `tab-nota-medica` sigue el numeral 7.1 (nota de evolución). La `tab-historia` sigue el numeral 7.2 (historia clínica).
