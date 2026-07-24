# Task Manager UI

Frontend React para la API de gestión de tareas personales.

**Stack:** React 18 · Vite · React Router DOM · Axios · lucide-react · Vitest · React Testing Library

**Repositorio backend:** https://github.com/KaterinaCamposP/task-manager-api

---

## Requisitos

- Node.js 18+
- Backend task-manager-api corriendo en localhost:8080 (no es necesario para correr los tests)

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
La migración a CSS separado se realizó en Sprint 4 (ver "Migración de estilos
inline a CSS (Sprint 4)"), resolviendo este tipo de bugs de raíz y habilitando
hover states, media queries y reutilización de estilos.

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

### Feedback visual — resuelto en Sprint 4 (Sprint 2)

Loading spinners y toasts de éxito/error no se implementaron en Sprint 2
(el feedback era texto plano: "Cargando tareas...", "..." en botones
ocupados). Se abordaron en Sprint 4 con toasts y skeleton loading (ver
"Toasts y skeleton loading con ToastContext (Sprint 4)").

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
retrocede una página sola (`setPage(page - 1)`) para no quedar mostrando
una página vacía.

### Responsive vía Flexbox, pixel-perfect en Sprint 4 (Sprint 3)

El backlog pide adaptar el diseño a móvil/tablet/escritorio "con
Grid/Flexbox". Como los estilos eran inline (ver decisión de Sprint 1 y 2)
y los estilos inline no soportan media queries, el responsive de Sprint 3
se resolvió vía Flexbox: `flex-wrap` en el encabezado y en las barras de
filtros/resumen, `min-width` en las tarjetas para que se apilen solas en
pantallas chicas, y `width: 90%` + `max-width` + `box-sizing: border-box`
en el modal para que nunca se salga de la pantalla. El reflow pixel-perfect
con media queries (filas de tareas que pasan a columna, header que se
reacomoda, modal al 90% del ancho) se implementó en Sprint 4 en
`dashboard.css`, junto con la migración a CSS.

### Migración de estilos inline a CSS (Sprint 4)

Se migraron los estilos inline a archivos CSS separados, resolviendo de raíz
el bug de Sprint 2 (botones que heredaban estilos globales de Vite) y
habilitando hover states, media queries y reutilización. Login y Register
comparten `auth.css`; Dashboard usa `dashboard.css`. Se limpió el CSS por
defecto de Vite en `index.css` (reset con `box-sizing` y color de texto
oscuro en `:root`, que era la causa raíz del texto blanco sobre blanco) y
se vació `App.css`. Los colores condicionales (tarjetas de resumen y badges)
pasaron a clases dedicadas (`stat-total/pending/completed`,
`badge-pending/completed`) en vez de `style={{...}}` inline.

### Toasts y skeleton loading con ToastContext (Sprint 4)

Se implementó el feedback visual que estaba pendiente desde Sprint 2. Un
`ToastContext` (con `useToast`) expone `showToast(message, type)`; el
`ToastProvider` envuelve la app en `App.jsx` y renderiza los toasts fuera de
las rutas, para que persistan entre navegaciones. Los toasts tienen
auto-dismiss (~3s) con animación de entrada/salida vía keyframes CSS y son
responsive (de lado a lado bajo 600px). El listado de tareas muestra un
skeleton loading (3 filas con pulso) mientras carga, en vez del texto plano
"Cargando tareas...". Los botones de acción, crear y cancelar tienen estado
`disabled` visible.

### Tests de integración del frontend con Vitest + React Testing Library (Sprint 4)

Se agregaron tests de integración que cubren el flujo completo registro →
login → CRUD (la tarjeta del backlog "Tests integración frontend"). Se usó
Vitest + React Testing Library + jsdom, mockeando los módulos `api/auth` y
`api/tasks` con `vi.mock`, así los tests ejercitan componente + contexto +
router sin depender del backend levantado. Dos detalles de configuración con
`globals: false`: (1) el setup importa `@testing-library/jest-dom/vitest`
(en vez del import genérico, que revienta con "expect is not defined" porque
no hay `expect` global), y (2) se registra un `afterEach` con `cleanup()` en
`src/test/setup.js`, porque sin `globals` RTL no auto-desmonta el DOM entre
tests y las queries encontraban elementos duplicados del test anterior.

---

## Estructura

```text
src/
 ├── api/                 # Llamadas axios al backend
 │   ├── auth.js
 │   └── tasks.js
 ├── assets/
 ├── components/          # Componentes reutilizables
 ├── context/             # Contextos globales
 │   ├── AuthContext.jsx
 │   ├── ToastContext.jsx
 │   └── toast.css
 ├── pages/
 │   ├── Dashboard.jsx
 │   ├── Dashboard.test.jsx
 │   ├── dashboard.css
 │   ├── Login.jsx
 │   ├── Login.test.jsx
 │   ├── Register.jsx
 │   ├── Register.test.jsx
 │   └── auth.css
 ├── test/
 │   └── setup.js
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

### Sprint 2 — Movido a Sprint 4 (completado)

- [x] Loading spinners (skeleton loading)
- [x] Toasts de éxito/error
- [x] Migración de estilos inline a CSS

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

## Funcionalidades Sprint 4

- Migración de estilos inline a CSS (auth.css compartido por Login/Register,
  dashboard.css para Dashboard; reset global en index.css)
- Toasts de éxito/error (ToastContext, auto-dismiss con animación, responsive)
- Skeleton loading en el listado de tareas
- Botones con estado disabled visible
- Responsive pixel-perfect con media queries en dashboard.css (bajo 600px:
  header, filas de tareas y modal se reacomodan)
- Tests de integración del frontend (10 tests: login, registro y CRUD con
  axios mockeado)

---

## Testing

### Ejecutar tests

npm test

### Tests incluidos — Sprint 4

Los tests de integración usan Vitest + React Testing Library con jsdom y
mockean los módulos de API (`vi.mock`), así que corren sin el backend levantado.

**Login (3):**

- Renderiza el formulario
- Login exitoso guarda token y navega a dashboard
- Login fallido muestra error y no navega

**Register (2):**

- Registro exitoso guarda token y navega
- Contraseña corta muestra error y no llama a la API

**Dashboard (5):**

- Lista las tareas desde la API
- Crea una tarea y muestra toast de éxito
- Elimina una tarea tras confirmar
- Cambia el estado de una tarea
- Edita una tarea

### Notas técnicas

- Con `globals: false`, el setup importa `@testing-library/jest-dom/vitest`
  (el import genérico falla con "expect is not defined") y registra `cleanup()`
  en un `afterEach` (RTL no auto-desmonta el DOM sin globals)

---

## Conexión con el backend

La URL base está en `src/api/auth.js` y `src/api/tasks.js`:

const API_URL = 'http://localhost:8080/api'

Para producción cambiar por la URL de Render/Railway.
