# Requisitos Funcionales y No Funcionales 

## Requerimientos funcionales

| ID | Nombre del requerimiento | Descripcion |
|---|---|---|
| RF01 | Registro de primera consulta | El sistema debe permitir registrar la historia clinica inicial del paciente, incluyendo ficha de identificacion, antecedentes heredofamiliares, antecedentes personales patologicos y no patologicos, padecimiento actual, exploracion fisica, diagnostico y plan terapeutico. |
| RF02 | Generacion de resumen del expediente | El sistema debe generar automaticamente un resumen del expediente que incluya diagnosticos activos, medicamentos registrados, alergias y las ultimas cinco notas clinicas. |
| RF03 | Formularios por especialidad | El sistema debe cargar formularios clinicos con campos especificos segun la especialidad seleccionada: medicina general, pediatria, ginecologia, urgencias, cirugia, cardiologia, traumatologia y medicina interna. |
| RF04 | Expansion de abreviaturas medicas | Cuando el usuario escriba una abreviatura registrada en el catalogo del sistema, esta debe expandirse automaticamente a su nombre completo y habilitar los campos asociados. |
| RF05 | Sugerencia de informacion clinica | El sistema debe sugerir campos adicionales de registro cuando se detecten diagnosticos o condiciones medicas especificas previamente registradas. |
| RF06 | Control de acceso por roles | El sistema debe implementar tres roles de usuario: administrativo, medico y enfermeria, cada uno con permisos diferenciados de lectura y edicion dentro del expediente clinico. |
| RF07 | Visualizacion del expediente | El sistema debe permitir visualizar el expediente clinico completo en formato estructurado antes de finalizar una consulta. |
| RF08 | Edicion por rol | El sistema debe restringir la edicion de informacion segun el rol del usuario: administrativo (datos demograficos), enfermeria (signos vitales y notas de enfermeria) y medico (diagnostico, estudios y tratamiento). |
| RF09 | Registro inicial en urgencias | El sistema debe permitir crear un registro inicial del paciente en urgencias mediante un formulario reducido que contenga al menos identificacion, motivo de consulta y signos vitales. |
| RF10 | Calculo de nivel de Triage | A partir de los signos vitales y el motivo de consulta, el sistema debe calcular automaticamente un nivel de Triage de cinco categorias basado en los criterios configurados. |
| RF11 | Confirmacion medica del Triage | El medico responsable debe poder confirmar o modificar el nivel de Triage sugerido por el sistema antes de cerrar la consulta. |
| RF12 | Cierre de consulta | El medico debe poder cerrar una consulta y registrar la fecha y hora del cierre junto con el identificador del profesional responsable. |
| RF13 | Exportacion del expediente | El sistema debe permitir exportar el expediente clinico completo en formato PDF. |
| RF14 | Registro de auditoria | El sistema debe registrar todas las modificaciones realizadas en el expediente, incluyendo usuario, rol, fecha, hora y tipo de accion realizada. |
| RF15 | Notas de evolucion | El sistema debe permitir agregar notas de evolucion a expedientes existentes sin modificar los registros clinicos previos. |
| RF16 | Busqueda de diagnosticos | El sistema debe permitir buscar diagnosticos medicos mediante autocompletado basado en el catalogo CIE-10. |
| RF17 | Gestion de pacientes | El sistema debe permitir crear, consultar, actualizar y desactivar registros de pacientes. |
| RF18 | Alerta de prioridad critica | Cuando el nivel de Triage calculado sea el mas alto, el sistema debe mostrar una alerta visual en la interfaz del medico responsable. |
| RF19 | Catalogo de abreviaturas | El sistema debe permitir agregar, modificar y eliminar abreviaturas medicas dentro del catalogo utilizado por el algoritmo de expansion. |

---

# Requerimientos no funcionales

| ID | Nombre del requerimiento | Descripcion |
|---|---|---|
| RNF01 | Tiempo de carga de formularios | El formulario de consulta debe mostrarse completamente en un tiempo menor a 3 segundos despues de que el usuario acceda al modulo. |
| RNF02 | Tiempo de respuesta del sistema | El sistema debe mostrar resultados de busqueda y sugerencias en un tiempo menor a 1 segundo despues de que el usuario ingrese un termino. |
| RNF03 | Tiempo de calculo del Triage | El sistema debe mostrar el resultado del calculo de Triage en un tiempo menor a 1 segundo despues de registrar los signos vitales requeridos. |
| RNF04 | Disponibilidad del sistema | El sistema debe estar disponible al menos el 99% del tiempo durante cada periodo de 30 dias. |
| RNF05 | Seguridad de datos almacenados | Los datos de pacientes deben almacenarse utilizando un mecanismo de cifrado con una longitud de clave minima de 256 bits. |
| RNF06 | Seguridad de comunicaciones | Toda comunicacion entre cliente y servidor debe realizarse mediante HTTPS utilizando TLS version 1.2 o superior. |
| RNF07 | Autenticacion de usuarios | El sistema debe requerir autenticacion mediante usuario y contraseña antes de permitir el acceso a cualquier informacion clinica. |
| RNF08 | Validacion de permisos | El servidor debe verificar los permisos del usuario en cada solicitud que implique lectura o modificacion de informacion clinica. |
| RNF09 | Compatibilidad de navegadores | La interfaz debe funcionar correctamente en las versiones actuales de Chrome, Firefox, Safari y Edge. |
| RNF10 | Resolucion minima de interfaz | La interfaz debe mostrarse correctamente en pantallas con resolucion minima de 768 pixeles de ancho sin requerir desplazamiento horizontal. |
| RNF11 | Guardado automatico | Durante la captura de informacion clinica, el sistema debe guardar automaticamente el contenido del formulario cada 60 segundos. |
| RNF12 | Copias de seguridad | La base de datos debe generar una copia de seguridad automatica al menos una vez cada 24 horas. |
| RNF13 | Retencion de respaldos | Las copias de seguridad deben conservarse durante un periodo minimo de 30 dias. |
| RNF14 | Registro de errores | El sistema debe registrar en archivos de log los errores del servidor junto con fecha, hora y descripcion del evento. |
| RNF15 | Confidencialidad de la informacion | Los datos clinicos solo deben ser accesibles para usuarios autenticados con permisos asociados al expediente correspondiente. |
