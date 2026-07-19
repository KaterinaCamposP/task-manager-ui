# Task Manager UI

Frontend React para la API de gestión de tareas personales.

**Stack:** React 18 · Vite · React Router DOM · Axios · lucide-react

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

## Decisiones técnicas y desviaciones del backlog

### lucide-react para íconos (Sprint 2)
El backlog no especifica cómo representar los botones de acción (cambiar
estado, editar, eliminar). Se probó primero con caracteres Unicode (↺, ✎, 🗑)
pero no renderizaban de forma consistente según el sistema operativo/fuentes
instaladas. Se optó por `lucide-react`, que usa SVG puro y se ve idéntico
en cualquier entorno.

### Estilos inline en vez de CSS (Sprint 1 y 2)
Por velocidad de desarrollo, los estilos de los componentes se manejan con
objetos JS inline (`style={...}`) en vez de archivos `.css` separados. Esto
generó un bug real en Sprint 2: botones sin `color` explícito heredaban
estilos globales inesperados de Vite y quedaban invisibles (texto blanco
sobre fondo blanco). Se corrigió agregando `color` explícito a cada estilo.
**Migrar a CSS separado (o CSS Modules) queda pendiente para Sprint 4**,
dentro de la tarea "Pulir UI/UX", ya que resolvería este tipo de bugs de
raíz y permitiría hover states, media queries y reutilización de estilos.

### Soft delete — sin tachado visual de "eliminada" (Sprint 2)
El backlog pide que una tarea eliminada se muestre "tachada en gris" en
el listado. Como el backend implementa soft delete con `@SQLRestriction`,
las tareas eliminadas quedan excluidas del listado directamente en la
consulta SQL — nunca llegan al frontend. Por lo tanto no es posible
mostrarlas tachadas sin cambiar el comportamiento del backend (traer
también las eliminadas y filtrarlas en el cliente, lo cual no está en
el alcance actual). El tachado gris sí se implementó, pero para tareas
con estado **COMPLETED**, que es el otro caso de feedback visual de
estado que pide el backlog.

### Feedback visual — pendiente para Sprint 4 (Sprint 2)
Loading spinners y toasts de éxito/error no se implementaron en Sprint 2.
Actualmente el feedback es texto plano ("Cargando tareas...", "..." en
botones ocupados). El Sprint 4 ya incluye la tarea "Feedback visual:
Snackbars/Toasts, skeleton loading" donde se abordará correctamente.

---

## Estructura
```text
src/
├── api/                 # Llamadas axios al backend
│   ├── auth.js
│   └── tasks.js
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

## Funcionalidades Sprint 2

- Listado de tareas conectado al backend real (GET /api/tasks)
- Crear tarea (POST /api/tasks)
- Editar tarea en modal (PUT /api/tasks/{id})
- Cambiar estado con botón toggle (PATCH /api/tasks/{id}/status)
- Eliminar tarea con confirmación inline (DELETE /api/tasks/{id})
- Tachado visual para tareas completadas
- Botones de acción con íconos SVG (lucide-react)

### Sprint 2 — Pendiente (movido a Sprint 4)
- [ ] Loading spinners
- [ ] Toasts de éxito/error
- [ ] Migración de estilos inline a CSS

---

## Conexión con el backend

La URL base está en `src/api/auth.js` y `src/api/tasks.js`:
const API_URL = 'http://localhost:8080/api'

Para producción cambiar por la URL de Render/Railway.