# Equipo Code Snakes - Deploy Me 2026
# ClinData — Expediente Clínico Electrónico

Sistema de Expediente Clínico Electrónico (ECE) conforme a **NOM-004-SSA3-2012**, desarrollado como SPA en Vanilla JS con backend Node.js/Express. Proyecto presentado en el concurso **Deploy Me · WeWolf × UADY 2026**.

---
## Miembros del equipo:
- González Cardeña Azul Anneliese
- López Sansores Lander Antonio
- Morales Bautista Kevin Enrique
- Pacheco Cervantes Felipe de Jesús
---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Instalación y arranque](#instalación-y-arranque)
5. [Módulos y funcionalidades](#módulos-y-funcionalidades)
6. [Roles y permisos](#roles-y-permisos)
7. [Tipos de nota clínica](#tipos-de-nota-clínica)
8. [Base de datos](#base-de-datos)
9. [Cumplimiento normativo](#cumplimiento-normativo)
10. [Estructura de archivos](#estructura-de-archivos)

---

## Descripción general

ClinData permite a clínicas y consultorios registrar, gestionar y exportar expedientes clínicos electrónicos de forma ágil. Su propuesta de valor central es la **captura libre con estructuración por IA**: el médico dicta o escribe en lenguaje natural y Claude (Anthropic) convierte el texto en una nota estructurada bajo el formato SOAP/NOM-004, con diagnósticos CIE-10 validados y expansión automática de abreviaturas médicas.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vanilla JS (IIFEs), HTML5, CSS3 — sin frameworks ni bundlers |
| Backend | Node.js + Express, puerto 3000 |
| Base de datos | MySQL 2 |
| IA | Anthropic Claude (claude-sonnet-4-20250514) vía `/api/structure` |
| Exportación | jsPDF + impresión nativa del navegador |

---

## Arquitectura

La aplicación es una SPA sin framework. Todo el estado vive en `window.ClinDataApp` y los módulos se auto-registran en `window.ClinDataModules`:

```js
(function initXxxModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;
    // lógica del módulo…
    registry.xxx = { fn1, fn2 };
    global.fn1 = (...args) => fn1(...args); // exposición global para el HTML
})(window);
```

El flujo de datos del expediente sigue este camino:

```
app().currentConsultation
        ↓  fillRecordFields()
      DOM  (inputs / textareas)
        ↓  collectRecordFields()
  consultation object (memoria)
        ↓  saveConsultations()
    localStorage / servidor
```

El servidor Express expone los siguientes endpoints principales:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/abreviaturas` | Catálogo de abreviaturas médicas |
| GET | `/api/conceptos` | Catálogo de conceptos de pago |
| POST | `/api/structure` | Estructuración con IA (Claude) |

---

## Instalación y arranque

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd clindata

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
#    Edita las credenciales en Server.js y ejecuta:
mysql -u root -p < setup.sql

# 4. Iniciar el servidor
node Server.js
# → http://localhost:3000
```

---

## Módulos y funcionalidades

### 🔐 Autenticación (`auth_module.js`)
Gestión de sesión con roles diferenciados. Verificación de permisos granular mediante `global.can("permiso")`.

### 👥 Pacientes (`patients_module.js`)
CRUD completo de pacientes con ficha de identificación (datos demográficos, aseguradora, tipo de paciente). Cabecera dinámica que muestra edad, etapa de consulta y responsable al abrir un expediente.

### 📋 Fila de consulta (`queue_module.js`)
Administración de la sala de espera: agregar, atender y retirar pacientes de la fila. Dispara automáticamente la creación o reapertura del expediente.

### 🚨 Triaje de urgencias (`triage_module.js`)
Cálculo automático de nivel de triaje (1–5) con base en signos vitales, síntomas marcados y escala de dolor. Genera banderas clínicas (inconsciencia, paro cardiorrespiratorio, etc.) y vincula el registro al expediente del paciente.

### 📝 Expediente / Notas médicas (`consultation_module.js` + `expediente_module.js`)
Captura estructurada según NOM-004 con cuatro tipos de nota (ver sección [Tipos de nota](#tipos-de-nota-clínica)). Incluye:
- Ficha de identificación completa
- Antecedentes heredofamiliares y personales (patológicos y no patológicos)
- Revisión por sistemas (cardiovascular, respiratorio, digestivo, neurológico, urinario, musculoesquelético, piel, endocrino, genitorreproductivo, psiquiátrico)
- Exploración física con signos vitales y cálculo automático de IMC
- Diagnóstico CIE-10 con buscador, lateralidad y fecha
- Tratamiento, indicaciones y pronóstico

### 🤖 Captura libre con IA (`freecapture_module.js` + `ai_structure_module.js`)
El médico escribe o dicta en lenguaje natural. Al solicitar estructuración:
1. Se muestra un preview del payload (palabras, diagnósticos CIE-10) antes de enviar.
2. Los datos identificables del paciente **no se envían** a la IA.
3. Claude estructura la nota en formato SOAP/NOM-004 y la aplica al expediente.
4. Si la llamada falla, se ofrece respuesta modelo (mock) para continuar la demo sin interrupción.

### 📊 Métricas de IA (`metrics_module.js`)
Panel en tiempo real que muestra latencia, tokens de entrada/salida, costo estimado por llamada (precios Sonnet 4.5) y acumulados de sesión. Útil para transparencia y pitch técnico.

### ⌨️ Auto-demo (`autodemo_module.js`)
Modo typewriter que escribe automáticamente casos clínicos preconfigurados en los campos del expediente, simulando el flujo real de captura. Configurable en velocidades rápida, normal y realista.

### 🗂️ Casos de demo (`demo_cases_module.js`)
Biblioteca de casos clínicos de ejemplo (con ícono, título y descripción) usados por el módulo de auto-demo y la barra de demostración.

### 🔬 Protocolos quirúrgicos (`protocolos_module.js`)
Formularios dinámicos por protocolo y fase. Protocolos disponibles:

| Protocolo | Fases |
|---|---|
| ATR — Artroplastía Total de Rodilla | PreQx · TransQx · Seguimiento |
| ATC — Artroplastía Total de Cadera | PreQx · TransQx · Seguimiento |
| Hombro | PreQx · TransQx · Seguimiento |
| Ligamento / Menisco / Condral | PreQx · TransQx · Seguimiento |
| Fractura Húmero Proximal | PreQx · TransQx · Seguimiento |
| Fractura Meseta Tibial | PreQx · TransQx · Seguimiento |
| Fractura de Cadera | PreQx · TransQx · Seguimiento |
| Op-Cadera | Apartado único (sin fases) |

Cada fase carga un esquema de campos dinámico (biometría, mediciones RX, lateralidad, anestesia, tiempos quirúrgicos, escalas funcionales, seguimiento de herida, hitos de marcha, etc.).

### 📄 Documentos y órdenes (`documents_module.js`)
Generación de documentos oficiales desde el expediente:
- Receta médica
- Justificación médica
- Consentimientos informados
- Nota postoperatoria
- Informes para aseguradoras e imagenología
- Órdenes de fisioterapia, rayos X y valoraciones preoperatorias
- Carga de archivos externos

Opciones de salida: imprimir o enviar por correo/WhatsApp.

### 💳 Pagos y facturación (`pagos_module.js`)
Registro de conceptos de servicio con cantidad, descripción, costo e IVA (o exento). Sumatoria automática del total. Integrado en la impresión consolidada del expediente.

### 📤 Exportación (`export_module.js`)
Exportación a PDF en dos formatos:
- **Formato médico** — con abreviaturas técnicas resaltadas.
- **Formato paciente** — abreviaturas expandidas a lenguaje natural.

El PDF incluye datos demográficos, nota médica completa, signos vitales, diagnósticos y conceptos de pago. Fallback a impresión nativa del navegador si jsPDF no está disponible.

### 🔤 Abreviaturas médicas (`abreviaturas.js` + `autocompletado-diagnosticos.js`)
Catálogo de abreviaturas con validación en tiempo real. Detecta abreviaturas similares y desconocidas antes de exportar, permitiendo al médico confirmar o corregir. Autocompletado de diagnósticos CIE-10 con buscador integrado en el formulario.

### 👁️ Vista previa (`preview_module.js`)
Visualización estructurada del expediente completo antes de firmarlo y cerrarlo, con verificación de cobertura NOM-004.

---

## Roles y permisos

| Permiso | médico | enfermero | recepción | admin |
|---|---|---|---|---|
| `canWriteMedicalNotes` | ✓ | — | — | ✓ |
| `canWriteNursingNotes` | — | ✓ | — | ✓ |
| `canAddToQueue` | ✓ | ✓ | ✓ | ✓ |
| `canUseTriage` | ✓ | ✓ | — | ✓ |
| `canViewPatients` | ✓ | ✓ | ✓ | ✓ |

Verificar con `global.can("permiso")`. Detección de enfermero:
```js
const isNurse = global.can("canWriteNursingNotes") && !global.can("canWriteMedicalNotes");
```

---

## Tipos de nota clínica

| `tipoNota` | Cuándo se usa | Pestaña HTML |
|---|---|---|
| `"historia"` | Primera consulta del paciente | `#tab-historia` |
| `"nota-medica"` | Consultas de seguimiento (médico) | `#tab-nota-medica` |
| `"urgencias"` | Atención de urgencias | `#tab-urgencias` |
| `"evolucion"` | Nota de enfermería | `#tab-evolucion` |

El tipo se determina en `attendFromQueue` al crear la consulta y se re-deriva en `renderMedicalRecord` si no está definido. El médico siempre ve la nota clínica; el enfermero, la nota de evolución.

---

## Base de datos

La base de datos MySQL se inicializa con `setup.sql`. Las entidades principales son:

- **Pacientes** — datos demográficos e identificación
- **Consultas** — notas, signos vitales, diagnósticos, tratamiento
- **Diagnósticos** — CIE-10, lateralidad, fechas
- **Abreviaturas** — catálogo médico
- **Auditoría** — registro de usuario, fecha y acción realizada

---

## Cumplimiento normativo

ClinData está diseñado bajo los lineamientos de la **NOM-004-SSA3-2012** (Del expediente clínico). El sistema cubre:

- Ficha de identificación completa del paciente
- Historia clínica con interrogatorio por aparatos y sistemas
- Exploración física con signos vitales
- Diagnóstico (CIE-10), pronóstico e indicación terapéutica
- Notas de evolución, urgencias y enfermería
- Auditoría con usuario, fecha y acción
- Exportación en formato legible para médico y paciente

---

## Estructura de archivos

```
clindata/
├── Server.js                    # Servidor Express + endpoints API
├── setup.sql                    # Script de inicialización de BD
├── index.html                   # SPA principal — todos los módulos se cargan aquí
├── script.js                    # Bootstrap de la aplicación
├── styles.css                   # Estilos globales
│
├── auth_module.js               # Autenticación y roles
├── patients_module.js           # CRUD de pacientes
├── queue_module.js              # Fila de consulta
├── triage_module.js             # Triaje de urgencias
├── consultation_module.js       # Notas médicas estructuradas
├── expediente_module.js         # Vista de expediente completo
├── freecapture_module.js        # Captura libre (entrada a IA)
├── ai_structure_module.js       # Cliente del endpoint /api/structure
├── metrics_module.js            # Panel de métricas de IA
├── autodemo_module.js           # Modo typewriter para demos
├── demo_cases_module.js         # Casos clínicos de ejemplo
├── protocolos_module.js         # Protocolos quirúrgicos dinámicos
├── documents_module.js          # Documentos y órdenes médicas
├── pagos_module.js              # Pagos y facturación
├── export_module.js             # Exportación a PDF
├── preview_module.js            # Vista previa del expediente
├── utils_module.js              # Utilidades compartidas
├── abreviaturas.js              # Catálogo y validación de abreviaturas
├── autocompletado-diagnosticos.js  # Buscador CIE-10
└── Principal_abr.js             # Lógica de exportación con abreviaturas
```

---

> **ClinData** · Expediente Clínico Electrónico · NOM-004-SSA3-2012  
> Desarrollado para el concurso Deploy Me · WeWolf × UADY 2026
