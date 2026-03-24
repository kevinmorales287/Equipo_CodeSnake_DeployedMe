# Equipo CodeSnake - DeployedMe

Este proyecto es un sistema de gestión que utiliza un modelo de datos híbrido para garantizar su funcionamiento tanto en entornos locales con infraestructura completa como en dispositivos ligeros sin bases de datos tradicionales.

## Descripción

El sistema permite gestionar un catálogo de conceptos médicos y diagnósticos (CIE-10). La característica principal es su capacidad de **fallback automático**: si detecta un servidor MySQL, lo utiliza; si no, cambia instantáneamente a modo offline leyendo archivos JSON pre-generados.

## Requisitos

- **Node.js** (versión 14 o superior)
- **MySQL** (Opcional: solo necesario si deseas modificar o regenerar los datos originales)

## Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [URL-DEL-REPO]
   cd Equipo_CodeSnake_DeployedMe
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (Opcional):**
   Si tienes MySQL instalado, copia el archivo de ejemplo y completa tus datos:
   ```bash
   cp .env.example .env
   ```
   *Si no tienes MySQL, puedes omitir este paso; el proyecto funcionará automáticamente en modo JSON.*

4. **Verificar la conexión:**
   ```bash
   npm run test-connection
   ```

5. **Iniciar el servidor:**
   ```bash
   npm start
   ```

## Cómo funciona el modo offline

Cuando el servidor arranca, `Db.js` intenta establecer una conexión con MySQL. Si la conexión falla (porque no hay servidor o los datos en `.env` son incorrectos), el sistema activa el **Modo JSON**. En este modo, el backend consulta directamente los archivos ubicados en la carpeta `database/`.

## Regeneración de datos

Si realizas cambios en la base de datos MySQL y deseas actualizar los archivos JSON para el modo offline, ejecuta:
```bash
npm run export-db
```
*Nota: Esto requiere una conexión MySQL válida en el archivo `.env`.*

## Estructura de carpetas

- `/api`: Endpoints de la API Express.
- `/database`: Archivos JSON para el modo offline y scripts de inicialización SQL.
- `Db.js`: Lógica principal de conexión híbrida.
- `export_db.js`: Script de exportación MySQL -> JSON.
- `Server.js`: Punto de entrada de la aplicación.
- `public/`: Archivos estáticos del frontend (HTML, CSS, JS).