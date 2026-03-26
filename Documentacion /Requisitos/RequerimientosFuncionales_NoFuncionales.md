# REQUERIMIENTOS FUNCIONALES

| ID   | Nombre del requerimiento | Descripción |
|------|--------------------------|-------------|
| RF01 | Registro de primera consulta | El sistema debe permitir registrar la historia clínica inicial del paciente, incluyendo ficha de identificación, antecedentes heredofamiliares, antecedentes personales patológicos y no patológicos, padecimiento actual, exploración física, diagnóstico y plan terapéutico. |
| RF02 | Generación de resumen del expediente | El sistema debe generar automáticamente un resumen del expediente que incluya diagnósticos activos, medicamentos registrados, alergias y las últimas cinco notas clínicas. |
| RF03 | Formatos por especialidad | El sistema debe cargar formatos clínicos con campos específicos según la especialidad seleccionada: medicina general, pediatría, ginecología, urgencias, cirugía, cardiología, traumatología y medicina interna. |
| RF04 | Expansión de abreviaturas médicas | Cuando el usuario escriba una abreviatura registrada en el catálogo del sistema, esta debe expandirse automáticamente a su nombre completo y habilitar los campos asociados. |
| RF05 | Sugerencia de información clínica | El sistema debe sugerir campos adicionales de registro cuando se detecten diagnósticos o condiciones médicas específicas previamente registradas. |
| RF06 | Visualización del expediente | El sistema debe permitir visualizar el expediente clínico completo en formato estructurado antes de finalizar una consulta. |
| RF07 | Visualización por carpetas | El sistema debe permitir reflejar los expedientes registrados por carpetas, de modo que cada una contenga el expediente correspondiente a cada consulta así como documentos de otras áreas o instituciones. |
| RF08 | Registro inicial en urgencias | El sistema debe permitir crear un registro inicial del paciente en urgencias mediante un formulario reducido que contenga al menos identificación, motivo de consulta y signos vitales. |
| RF09 | Cálculo de nivel de Triage | El sistema debe calcular automáticamente un nivel de Triage con cinco categorías: Rojo (Emergencia), Naranja (Urgencia), Amarillo (Urgencia menor), Verde (Consulta prioritaria), Azul (Consulta externa). |
| RF10 | Confirmación médica del Triage | El médico responsable debe poder confirmar o modificar el nivel de Triage sugerido por el sistema antes de cerrar la consulta. |
| RF11 | Cierre de consulta | El médico debe poder cerrar una consulta y registrar fecha, hora y el identificador del profesional responsable. |
| RF12 | Exportación del expediente | El sistema debe permitir exportar el expediente clínico completo en PDF. Dependiendo del uso, se imprimirá sin abreviaturas o como palabra (abreviatura). |
| RF13 | Registro de auditoría | El sistema debe registrar todas las modificaciones realizadas en el expediente, incluyendo usuario, rol, fecha, hora y tipo de acción. |
| RF14 | Notas de evolución | El sistema debe permitir agregar notas de evolución sin modificar registros clínicos previos. |
| RF15 | Búsqueda de diagnósticos | El sistema debe permitir buscar diagnósticos mediante autocompletado basado en CIE-10. |
| RF16 | Gestión de pacientes | El sistema debe permitir crear, consultar, actualizar y desactivar registros de pacientes. |
| RF17 | Alerta de prioridad crítica | Cuando el nivel de Triage sea el más alto, el sistema debe mostrar una alerta visual. |
| RF18 | Catálogo de abreviaturas | El sistema debe permitir agregar, modificar y eliminar abreviaturas médicas. |
| RF19 | Catálogo de diagnósticos | El sistema debe permitir consultar y actualizar el catálogo de diagnósticos basado en CIE-10. |

---

# REQUERIMIENTOS NO FUNCIONALES

| ID    | Nombre del requerimiento | Descripción |
|-------|--------------------------|-------------|
| RNF01 | Tiempo de carga de formularios | El formulario debe mostrarse en menos de 3 segundos. |
| RNF02 | Tiempo de respuesta del sistema | Resultados y sugerencias deben aparecer en menos de 1 segundo. |
| RNF03 | Tiempo de cálculo del Triage | El cálculo debe mostrarse en menos de 1 segundo. |
| RNF04 | Disponibilidad del sistema | El sistema debe estar disponible al 99% del tiempo (o 24/7 con mantenimiento controlado). |
| RNF05 | Seguridad de datos almacenados | Los datos deben cifrarse con clave mínima de 256 bits. |
| RNF06 | Seguridad de comunicaciones | Comunicación mediante HTTPS con TLS 1.2 o superior. |
| RNF07 | Autenticación de usuarios | Acceso mediante usuario y contraseña (o correo). |
| RNF08 | Compatibilidad de navegadores | Compatible con Opera, Firefox, Safari, Edge y Chrome. |
| RNF09 | Resolución de interfaz | Debe adaptarse a dispositivos móviles y computadoras. |
| RNF10 | Guardado automático | Guardado cada 30 segundos y en eventos importantes. |
| RNF11 | Copias de seguridad | Backup automático al menos cada 24 horas. |
| RNF12 | Retención de respaldos | Las copias deben conservarse mínimo 5 años. |
| RNF13 | Registro de errores | Registro en logs con fecha, hora y descripción. |
| RNF14 | Confidencialidad | Acceso solo para usuarios autorizados. |
| RNF15 | Concordancia normativa | Debe cumplir con la NOM-004-SSA3-2012. |
