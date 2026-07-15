# Task Manager UI

Frontend React para la API de gestión de tareas personales.

**Stack:** React 18 · Vite · React Router DOM · Axios

**Repositorio backend:** https://github.com/KaterinaCamposP/task-manager-api

---

## Requisitos

- Node.js 18+
- Backend task-manager-api corriendo en localhost:8080

## Instalación
npm install

## Ejecutar en desarrollo
npm run dev

La app levanta en http://localhost:5173

---

## Estructura
```text
src/
├── api/                 # Llamadas axios al backend
│   └── auth.js
├── assets/
├── components/          # Componentes reutilizables
├── context/             # AuthContext (token, logout)
│   └── AuthContext.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── App.css
├── App.jsx
├── index.css
└── main.jsx
```
---

## Funcionalidades Sprint 1

- Registro de usuario con validación
- Login con JWT
- Dashboard con lista de tareas
- Modal para crear tarea con título y descripción
- Cerrar sesión
- Rutas protegidas (redirige a login si no hay token)

---

## Conexión con el backend

La URL base está en `src/api/auth.js`:
const API_URL = 'http://localhost:8080/api'

Para producción cambiar por la URL de Render/Railway.