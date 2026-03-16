# Sistema de expediente inteligente 

## Indice de contenido

1. [Descripcion general del sistema](#descripcion-general-del-sistema)
2. [Estructura general del sistema](#estructura-general-del-sistema)
3. [Primera consulta y resumen del expediente](#primera-consulta-y-resumen-del-expediente)
4. [Formatos clinicos por especialidad](#formatos-clinicos-por-especialidad)
5. [Algoritmo predictivo de captura](#algoritmo-predictivo-de-captura)
6. [Catalogo de abreviaturas reconocidas](#catalogo-de-abreviaturas-reconocidas)
7. [Control de acceso por roles](#control-de-acceso-por-roles)
8. [Sistema de urgencias y clasificacion triage](#sistema-de-urgencias-y-clasificacion-triage)
9. [Revision medica obligatoria en decisiones automaticas](#revision-medica-obligatoria-en-decisiones-automaticas)
10. [Parametros utilizados por el sistema de triage](#parametros-utilizados-por-el-sistema-de-triage)

---

# Descripcion general del sistema

| Elemento | Descripcion |
|---|---|
| Tipo de sistema | Plataforma digital diseñada para administrar expedientes clinicos electronicos durante la atencion medica. |
| Proposito | Reducir el tiempo administrativo del medico y mejorar la organizacion de la informacion clinica del paciente. |
| Funcionamiento general | El sistema organiza la captura de datos medicos mediante modulos estructurados que guian al personal de salud durante la consulta. |

| Componente del sistema | Funcion dentro del sistema |
|---|---|
| Modulo de consulta | Permite registrar la informacion clinica del paciente durante la atencion medica. |
| Resumen del expediente | Presenta informacion relevante del paciente antes de iniciar una consulta. |
| Formatos por especialidad | Ajusta automaticamente los campos clinicos segun el tipo de consulta o especialidad. |
| Algoritmo predictivo | Facilita la captura de datos mediante expansion de abreviaturas y sugerencias contextuales. |
| Control de acceso | Define que informacion puede consultar o modificar cada usuario. |
| Sistema de triage | Clasifica el nivel de urgencia del paciente en servicios de emergencia. |

---

# Estructura general del sistema

| Modulo del sistema | Funcion dentro del flujo de atencion |
|---|---|
| Registro de pacientes | Permite almacenar la informacion de identificacion del paciente. |
| Primera consulta | Organiza la captura de la historia clinica inicial. |
| Consultas subsecuentes | Permite registrar notas medicas durante el seguimiento del paciente. |
| Resumen clinico | Muestra informacion relevante del expediente antes de cada consulta. |
| Sistema de triage | Evalua la prioridad de atencion en servicios de urgencias. |
| Control de usuarios | Gestiona permisos y accesos dentro del sistema. |

---

# Primera consulta y resumen del expediente

| Categoria dentro del sistema | Elemento | Funcion dentro del sistema |
|---|---|---|
| Consulta inicial | Primera consulta | El sistema guia al medico a traves de las secciones establecidas por la normativa del expediente clinico. |
| Consulta inicial | Objetivo | Organizar de manera estructurada la captura de la informacion medica durante la primera atencion del paciente. |
| Registro clinico | Ficha de identificacion | Permite registrar los datos generales del paciente dentro del sistema. |
| Registro clinico | Antecedentes heredofamiliares | Permite documentar enfermedades presentes en familiares directos. |
| Registro clinico | Antecedentes personales patologicos | Permite registrar enfermedades previas o diagnosticos importantes del paciente. |
| Registro clinico | Antecedentes personales no patologicos | Registra informacion relacionada con habitos y condiciones de vida del paciente. |
| Registro clinico | Padecimiento actual | Describe el motivo de consulta y los sintomas que presenta el paciente. |
| Registro clinico | Exploracion fisica | Permite documentar los hallazgos obtenidos durante la exploracion medica. |
| Registro clinico | Resultados de estudios | Permite registrar estudios de laboratorio o gabinete relacionados con el caso. |
| Registro clinico | Diagnostico CIE-10 | El sistema almacena el diagnostico medico utilizando una clasificacion internacional estandarizada. |
| Registro clinico | Plan terapeutico | Registra el tratamiento indicado y las recomendaciones medicas. |
| Resumen clinico | Funcion del resumen | Antes de cada consulta el sistema muestra informacion importante del paciente. |
| Resumen clinico | Diagnosticos activos | Presenta las enfermedades actualmente registradas en el expediente. |
| Resumen clinico | Medicamentos actuales | Permite consultar los tratamientos farmacologicos vigentes. |
| Resumen clinico | Alergias registradas | Muestra sustancias o medicamentos que pueden causar reacciones adversas. |
| Resumen clinico | Ultimas notas medicas | Permite revisar rapidamente el contexto clinico reciente del paciente. |

---

# Formatos clinicos por especialidad

| Especialidad medica | Adaptacion del sistema |
|---|---|
| Medicina general | El sistema utiliza un formato clinico completo con antecedentes, exploracion fisica y diagnostico general. |
| Pediatria | El sistema habilita campos relacionados con crecimiento, vacunacion y desarrollo infantil. |
| Ginecologia | Se activan campos relacionados con ciclos menstruales, antecedentes obstetricos y estudios ginecologicos. |
| Urgencias | El sistema prioriza el registro de signos vitales, mecanismos de lesion y tiempo de evolucion. |
| Medicina interna | Se habilitan campos relacionados con enfermedades cronicas y seguimiento de tratamientos prolongados. |
| Cirugia | El sistema incorpora informacion relacionada con procedimientos quirurgicos y evaluacion preoperatoria. |
| Traumatologia | Se activan campos relacionados con lesiones oseas, mecanismos de trauma y estudios de imagen. |
| Cardiologia | El sistema habilita registros relacionados con estudios cardiacos y evaluacion funcional del paciente. |

---

# Algoritmo predictivo de captura

| Funcion del sistema | Descripcion |
|---|---|
| Expansion automatica de abreviaturas | Cuando el medico escribe una abreviatura reconocida, el sistema completa automaticamente el termino medico correspondiente. |
| Activacion automatica de campos | Dependiendo del diagnostico o termino utilizado, el sistema sugiere registrar informacion clinica adicional. |

| Ejemplo de funcionamiento | Resultado dentro del sistema |
|---|---|
| Registro de la abreviatura RD | El sistema reconoce el termino radiografia y habilita los campos correspondientes al estudio. |
| Registro de DM2 | El sistema sugiere registrar estudios relacionados con diabetes como hemoglobina glucosilada. |

---

# Catalogo de abreviaturas reconocidas

| Abreviatura | Significado | Abreviatura | Significado |
|---|---|---|---|
| RD | Radiografia | FC | Frecuencia cardiaca |
| ECG | Electrocardiograma | FR | Frecuencia respiratoria |
| TAC | Tomografia axial computarizada | Temp | Temperatura |
| RMN | Resonancia magnetica | SpO2 | Saturacion de oxigeno |
| US | Ultrasonido | Glasgow | Escala de coma Glasgow |
| BH | Biometria hematica | DM2 | Diabetes mellitus tipo 2 |
| QS | Quimica sanguinea | HTA | Hipertension arterial |
| EGO | Examen general de orina | IAM | Infarto agudo de miocardio |

| Caracteristica del sistema | Descripcion |
|---|---|
| Actualizacion del catalogo | El personal medico autorizado puede agregar o modificar abreviaturas segun las necesidades institucionales. |

---

# Control de acceso por roles

| Rol dentro del sistema | Acceso permitido | Funcion principal |
|---|---|---|
| Administrativo | Registro de pacientes y gestion de agenda | Administrar informacion demografica y operativa del sistema. |
| Medico | Acceso completo al expediente clinico | Registrar diagnosticos, tratamientos y notas medicas. |
| Enfermeria | Registro de signos vitales y notas de enfermeria | Apoyar la captura de informacion clinica durante la atencion del paciente. |

| Mecanismo de seguridad | Funcion |
|---|---|
| Control basado en roles | El sistema restringe el acceso a la informacion segun el perfil del usuario. |
| Registro de actividad | Todas las acciones realizadas dentro del sistema quedan registradas para fines de auditoria. |

---

# Sistema de urgencias y clasificacion triage

| Nivel de prioridad | Tiempo estimado de atencion | Interpretacion dentro del sistema |
|---|---|---|
| Nivel I | Inmediato | Paciente con riesgo vital que requiere atencion inmediata. |
| Nivel II | Menos de 15 minutos | Paciente con sintomas graves que requieren intervencion rapida. |
| Nivel III | Menos de 30 minutos | Paciente con condicion urgente pero estable. |
| Nivel IV | Menos de 60 minutos | Paciente con sintomas moderados. |
| Nivel V | Menos de 120 minutos | Paciente con sintomas leves o consulta no urgente. |

---

# Revision medica obligatoria en decisiones automaticas

| Elemento del sistema | Funcion |
|---|---|
| Clasificacion automatica | El sistema calcula automaticamente el nivel de prioridad utilizando los datos capturados. |
| Confirmacion medica | El medico debe validar o modificar la clasificacion antes de que quede registrada definitivamente. |
| Registro de modificaciones | Si el medico cambia el nivel de prioridad, el sistema solicita registrar el motivo del cambio. |

---

# Parametros utilizados por el sistema de triage

| Variable utilizada | Funcion dentro del sistema |
|---|---|
| Frecuencia cardiaca | Permite evaluar la estabilidad cardiovascular del paciente. |
| Frecuencia respiratoria | Indica el estado de la funcion respiratoria. |
| Tension arterial | Permite detectar alteraciones circulatorias importantes. |
| Temperatura corporal | Permite identificar procesos infecciosos o inflamatorios. |
| Saturacion de oxigeno | Evalua el nivel de oxigenacion del paciente. |
| Escala de Glasgow | Permite valorar el estado de conciencia. |
| Motivo de consulta | Ayuda a interpretar el contexto clinico del paciente. |
| Tiempo de evolucion | Permite evaluar la progresion de los sintomas. |
