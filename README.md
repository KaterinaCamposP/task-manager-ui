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
estado, editar, eliminar). Se probó primero con caracteres Unicode (↺, ✎, )
pero no renderizaban de forma consistente según el sistema operativo/fuentes
instaladas. Se optó por `lucide-react`, que usa SVG puro y se ve idéntico
en cualquier entorno.

### Estilos inline en vez de CSS (Sprint 1 y 2)

Por velocidad de desarrollo, los estilos de los componentes se manejan con
objetos JS inline (`style={...}`) en vez de archivos `.css` separados. Esto
generó un bug real en Sprint 2: botones sin `color` explícito heredaban
estilos globales inesperados de Vite y quedaban invisibles (texto blanco
sobre fondo blanco). Se corrigió agregando `color` explícito a cada estilo.
Migrar a CSS separado (o CSS Modules) queda pendiente para Sprint 4,
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
con estado COMPLETED, que es el otro caso de feedback visual de
estado que pide el backlog.

### Feedback visual — pendiente para Sprint 4 (Sprint 2)

Loading spinners y toasts de éxito/error no se implementaron en Sprint 2.
Actualmente el feedback es texto plano ("Cargando tareas...", "..." en
botones ocupados). El Sprint 4 ya incluye la tarea "Feedback visual:
Snackbars/Toasts, skeleton loading" donde se abordará correctamente.

### Logout con invalidación en backend — Opción 1 (Sprint 3)

El backlog pide que el botón de cerrar sesión llame a `/api/auth/logout`.
Se implementó la opción que invalida el token de verdad: el frontend llama
a `POST /api/auth/logout` con el token actual (el backend lo agrega a la
blacklist de Redis) y recién después limpia `localStorage` y el estado.
El `logout` del `AuthContext` es fail-safe: si la llamada al backend falla
(Redis caído, red cortada, etc.), el `catch` registra el error pero igual
limpia la sesión local, para que el usuario nunca quede "atrapado" sin
poder salir. `handleLogout` en el Dashboard es `async` y espera a que
`logout()` termine antes de redirigir a `/login`.

### Consumo del objeto Page del backend (Sprint 3)

En Sprint 3 el backend cambió `GET /api/tasks` de devolver un array plano
a devolver un objeto `Page` (`{ content, totalElements, totalPages, ... }`).
El frontend se adaptó: `getTasks` ahora acepta un segundo argumento `params`
(`page`, `size`, `sort`, `status`) y el Dashboard lee las tareas con
`setTasks(res.data.content || [])`. El `|| []` es un blindaje para que
`tasks.map(...)` nunca reviente si el body viniera sin `content`.

### Tarjetas resumen con llamadas livianas y total global (Sprint 3)

Las tarjetas (Totales / Pendientes / Completadas) necesitan conteos globales,
independientes del filtro activo. Para no tocar el backend, se obtienen con
3 llamadas en paralelo a `GET /api/tasks` con `size: 1` (el `content` trae
1 elemento pero `totalElements` trae el conteo real) y se leen los
`totalElements` de cada una. Por diseño, el resumen es global: al aplicar
un filtro la lista se filtra pero las tarjetas siguen mostrando el total
general. `fetchStats()` se invoca desde dentro de `fetchTasks()` (sin
`await`, para no bloquear el pintado de la lista) para que los contadores
se mantengan sincronizados automáticamente tras crear, editar, eliminar o
cambiar estado, sin tener que repetir la llamada en cada handler.

### Paginación sin ellipsis (Sprint 3)

Los controles de paginación renderizan un botón por cada página más las
flechas de anterior/siguiente (con `ChevronLeft`/`ChevronRight` de
lucide-react). No se implementó el `...` (ellipsis) para colapsar páginas
intermedias cuando hay muchas: con el volumen de datos de este proyecto no
se justifica la complejidad extra. Queda como mejora opcional. Además, al
eliminar la única tarea de una página que no es la primera, el Dashboard
retrocede una página solo (`setPage(page - 1)`) para no quedar mostrando
una página vacía.

### Responsive vía Flexbox, pixel-perfect en Sprint 4 (Sprint 3)

El backlog pide adaptar el diseño a móvil/tablet/escritorio "con
Grid/Flexbox". Como los estilos son inline (ver decisión de Sprint 1 y 2)
y los estilos inline no soportan media queries, el responsive de Sprint 3
se resolvió vía Flexbox: `flex-wrap` en el encabezado y en las barras de
filtros/resumen, `min-width` en las tarjetas para que se apilen solas en
pantallas chicas, y `width: 90%` + `max-width` + `box-sizing: border-box`
en el modal para que nunca se salga de la pantalla. Estas propiedades
sobreviven a la futura migración a CSS (en CSS también se usarían
`flex-wrap` y `max-width`), así que no es trabajo descartable. El reflow
pixel-perfect con media queries (filas de tareas que pasan a columna,
grid centrado en 1 columna, paddings y fuentes adaptados) queda para
Sprint 4, junto con la migración a CSS — es el mismo límite honesto que
ya se documentó para los estilos inline.

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

## Funcionalidades Sprint 3

- Cerrar sesión invalidando el token en el backend (POST /api/auth/logout,
  blacklist Redis) con limpieza local fail-safe
- Paginación de la lista con controles de página (flechas + números);
  retrocede de página al eliminar la última tarea de una página
- Filtros por estado (Todas / Pendientes / Completadas)
- Ordenamiento (Más recientes / Más antiguas / Título A-Z / Título Z-A);
  vuelve a la página 1 al cambiar filtro u orden
- Tarjetas resumen con total, pendientes y completadas (conteo global,
  no afectado por el filtro activo)
- Mensaje distinto para "sin tareas" vs "sin resultados con este filtro"
- Layout responsive vía Flexbox (modal, encabezado y barras se reacomodan
  en pantallas chicas)

---

## Conexión con el backend

La URL base está en `src/api/auth.js` y `src/api/tasks.js`:

const API_URL = 'http://localhost:8080/api'

Para producción cambiar por la URL de Render/Railway.
