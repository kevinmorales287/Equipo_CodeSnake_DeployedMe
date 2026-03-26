# 🏥 ClinData -Esttructura del proyecto 

Este repositorio contiene el núcleo del sistema **ClinData**, enfocado en la eficiencia del llenado de notas médicas y el cumplimiento de estándares informáticos de salud.

## 📂 Estructura del Proyecto

```text
ClinData_Version_1/
├── index.html           # Interfaz principal (Editor con Ghost Text)
├── script.js            # Lógica de autocompletado y navegación frontend
├── styles.css           # Estilos clínicos (Paleta papel/tinta)
├── Server.js            # Servidor Node.js / Express (Endpoint Autocomplete)
├── Db.js                # Conexión a Neon PostgreSQL (Pool de conexiones)
├── abreviaturas.js      # Diccionario médico y validación NOM-004
├── Principal_abr.js     # Motor de búsqueda de abreviaturas
├── setup.sql            # Scripts de BD (Tablas, Índices y Semillas)
├── package.json         # Gestión de dependencias de Node.js
├── package-lock.json    # Historial de versiones de dependencias
├── .gitignore           # Archivos excluidos (e.g. .env)
└── README.md            # Documentación del proyecto
