# 🏥 ClinData — Sistema de Expediente Clínico Electrónico

> **Versión 1.0** · Equipo CodeSnake · DeployMe 2026
> ---Link a Github pages para probar el prototipo del programa; https://kevinmorales287.github.io/Equipo_CodeSnake_DeployedMe/ 
> Sistema de autocompletado predictivo para notas clínicas basado en CIE-10, SNOMED CT y NOM-004-SSA3-2012

---

## 📋 Tabla de contenidos

- Descripción  
- Visión del proyecto  
- Problema  
- Solución propuesta  
- Características principales  
- Núcleo innovador del sistema  
- Estructura del proyecto  
- Tecnologías utilizadas  
- Instalación y configuración  
- Base de datos  
- Uso del sistema  
- Impacto esperado  
- Valor diferencial  
- Cumplimiento normativo  
- Estado del proyecto  
- Equipo  

---

## 📖 Descripción

**ClinData** es un sistema de expediente clínico electrónico diseñado para optimizar la captura de información médica en el contexto hospitalario mexicano.

Su funcionalidad principal es un **motor de autocompletado predictivo** que asiste al médico mientras redacta notas clínicas, sugiriendo términos en tiempo real basados en un banco de datos clínicos estandarizado.

Surge como respuesta a una problemática real: la alta carga de pacientes, el poco tiempo por consulta y la necesidad de registrar grandes volúmenes de información con precisión, lo que frecuentemente deriva en registros incompletos o con abreviaturas ambiguas.

---

## 🔭 Visión del proyecto

ClinData no es únicamente un sistema de expediente clínico electrónico, sino un **prototipo de sistema inteligente** diseñado para transformar la manera en que se captura, interpreta y reutiliza la información médica.

Busca evolucionar el expediente tradicional hacia un modelo donde:

- La información **no se repite**, se reutiliza  
- La escritura **no es manual**, es asistida  
- El historial **no es estático**, es dinámico y contextual  

👉 En lugar de solo digitalizar expedientes, ClinData los hace más rápidos, inteligentes y reutilizables.

---

## 🧠 Problema

En la práctica clínica real:

- Los médicos invierten demasiado tiempo escribiendo información repetitiva  
- El uso de abreviaturas puede generar ambigüedad  
- El acceso a historiales previos no siempre es eficiente  
- Existe duplicación de información en cada consulta  

👉 Resultado: pérdida de tiempo operativo y aumento en el riesgo de errores clínicos

---

## 💡 Solución propuesta

ClinData propone un sistema que combina:

- Base de datos estructurada de información médica  
- Algoritmos inteligentes de asistencia en escritura  
- Gestión dinámica del historial clínico  

Todo enfocado en optimizar el flujo de trabajo médico en tiempo real.

---

## ✨ Características principales

- Autocompletado tipo VS Code (ghost text en tiempo real)  
- Búsqueda multi-palabra con contexto  
- Filtrado por sección clínica  
- Banco de más de 15,000 términos médicos  
- Expansión y validación de abreviaturas  
- Notas clínicas estructuradas  
- Base de datos optimizada para velocidad  

---

## ⚙️ Núcleo innovador del sistema

### ✍️ Autocompletado inteligente

- Predice términos médicos en contexto  
- Reduce la cantidad de texto a escribir  
- Acelera la captura de información clínica  

### 🔎 Motor de abreviaturas inteligente

- Detecta abreviaturas automáticamente  
- Las valida contra un catálogo médico  
- Sugiere correcciones usando similitud (Levenshtein)  
- Permite expandirlas a su forma completa  

### 🧾 Gestión evolutiva del expediente clínico

- Primera consulta: registro completo  
- Consultas posteriores: reutilización automática  
- Notas evolutivas: seguimiento del paciente  

👉 El expediente evoluciona, no se reinicia.

### 🧠 Historial clínico reutilizable

- Acceso inmediato a diagnósticos previos  
- Contexto del paciente disponible en todo momento  
- Reducción de redundancia  

### 📄 Exportación dual

- Versión médica (técnica con abreviaturas)  
- Versión paciente (clara y sin abreviaturas)  

### 👨‍⚕️ Sistema de roles

- Médico → gestión completa  
- Enfermería → apoyo clínico  
- Administrador → control del sistema  

---

## 📁 Estructura del proyecto

ClinData_Version_1/
├── index.html  
├── script.js  
├── styles.css  
├── Server.js  
├── Db.js  
├── abreviaturas.js  
├── Principal_abr.js  
├── setup.sql  
├── package.json  
└── README.md  

---

## 🛠️ Tecnologías utilizadas

Frontend: HTML, CSS, JavaScript  
Backend: Node.js + Express  
Base de datos: PostgreSQL (Neon)  
Terminología: CIE-10, SNOMED CT  
Normativa: NOM-004-SSA3-2012  

---

## 🚀 Instalación y configuración

git clone https://github.com/Equipo_CodeSnake_DeployedMe.git  
cd ClinData_Version_1  
npm install  
npm run dev  

---

## 🗄️ Base de datos

CREATE TABLE diccionario_clinico (  
    id SERIAL PRIMARY KEY,  
    palabra_completa TEXT,  
    abreviatura TEXT,  
    seccion TEXT,  
    prioridad TEXT  
);

---

## 💡 Uso del sistema

1. Seleccionar tipo de nota  
2. Escribir en el editor  
3. Aceptar sugerencias con ENTER  
4. Navegar con ↑ ↓  

---

## 📊 Impacto esperado

- Reducción del tiempo de registro clínico  
- Mejora en la claridad de expedientes  
- Eliminación de duplicidad  
- Mejor soporte para decisiones médicas  

---

## 🔥 Valor diferencial

A diferencia de un sistema tradicional:

👉 ClinData asiste activamente al médico mientras escribe

---

## 📜 Cumplimiento normativo

- NOM-004-SSA3-2012  
- Estructura clínica completa  
- Validación de abreviaturas  
- Terminología estandarizada  

---

## 📌 Estado del proyecto

Prototipo funcional (MVP):

- Autocompletado inteligente  
- Validación de abreviaturas  
- Gestión evolutiva del expediente  

---

## 👥 Equipo

Equipo CodeSnake — DeployMe 2026

- González Cardeña Azul Anneliese  
- López Sansores Lander Antonio
- Morales Bautista Kevin Enrique 
- Pacheco Cervantes Felipe de Jesús  

---

**ClinData v1.0** · Equipo CodeSnake · DeployMe 2026  
