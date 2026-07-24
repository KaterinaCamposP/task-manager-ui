import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/auth";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from "../api/tasks";
import {
  RotateCcw,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./dashboard.css";

export default function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = crear, objeto = editar
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null); // id pendiente de confirmar borrado
  const [busyTaskId, setBusyTaskId] = useState(null); // id con acción en curso (toggle/delete)

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    getProfile(token)
      .then((res) => setUser(res.data))
      .catch(() => {
        logout();
        navigate("/login");
      });
  }, [token]);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token, page, statusFilter, sortBy]);

  const fetchStats = async () => {
    try {
      const [all, pending, completed] = await Promise.all([
        getTasks(token, { page: 0, size: 1 }),
        getTasks(token, { page: 0, size: 1, status: "PENDING" }),
        getTasks(token, { page: 0, size: 1, status: "COMPLETED" }),
      ]);
      setStats({
        total: all.data.totalElements || 0,
        pending: pending.data.totalElements || 0,
        completed: completed.data.totalElements || 0,
      });
    } catch (err) {
      console.error("Error al cargar el resumen", err);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await getTasks(token, {
        page,
        size: 10,
        sort: sortBy,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setTasks(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      fetchStats(); // sin await: recalcula el resumen global en paralelo, sin bloquear la lista
    } catch (err) {
      console.error("Error al cargar tareas", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setPage(0);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(0);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({ title: "", description: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description || "" });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setFormError("El título debe tener al menos 3 caracteres.");
      return;
    }
    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(token, editingTask.id, {
          title: formData.title,
          description: formData.description,
          status: editingTask.status,
        });
      } else {
        await createTask(token, {
          title: formData.title,
          description: formData.description,
        });
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      setFormError("No se pudo guardar la tarea. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (taskId) => {
    setBusyTaskId(taskId);
    try {
      await toggleTaskStatus(token, taskId);
      await fetchTasks();
    } catch (err) {
      console.error("Error al cambiar estado", err);
    } finally {
      setBusyTaskId(null);
    }
  };

  const confirmDelete = (taskId) => {
    setDeletingId(taskId);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const handleDelete = async (taskId) => {
    setBusyTaskId(taskId);
    try {
      await deleteTask(token, taskId);
      if (tasks.length === 1 && page > 0) {
        setPage(page - 1); // era la única tarea de la página: vuelve a la anterior (el useEffect recarga)
      } else {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Error al eliminar tarea", err);
    } finally {
      setBusyTaskId(null);
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Task Manager</h1>
        <div className="dashboard-header-right">
          {user && (
            <span className="dashboard-username">Hola, {user.username}</span>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number stat-total">{stats.total}</span>
            <span className="stat-label">Totales</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-pending">{stats.pending}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-completed">
              {stats.completed}
            </span>
            <span className="stat-label">Completadas</span>
          </div>
        </div>

        <div className="tasks-toolbar">
          <h2 className="tasks-section-title">Mis tareas</h2>
          <button onClick={openCreateModal} className="create-btn">
            + Crear tarea
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            {[
              { label: "Todas", value: "" },
              { label: "Pendientes", value: "PENDING" },
              { label: "Completadas", value: "COMPLETED" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`filter-btn ${statusFilter === opt.value ? "filter-btn-active" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="createdAt,desc">Más recientes</option>
            <option value="createdAt,asc">Más antiguas</option>
            <option value="title,asc">Título A-Z</option>
            <option value="title,desc">Título Z-A</option>
          </select>
        </div>

        {loadingTasks ? (
          <p className="tasks-empty">Cargando tareas...</p>
        ) : tasks.length === 0 ? (
          <p className="tasks-empty">
            {statusFilter
              ? "No hay tareas con este filtro."
              : "No tienes tareas aún. ¡Crea una!"}
          </p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const isBusy = busyTaskId === task.id;
              const isCompleted = task.status === "COMPLETED";
              return (
                <li key={task.id} className="task-item">
                  <div className="task-info">
                    <strong
                      className={isCompleted ? "task-title-done" : undefined}
                    >
                      {task.title}
                    </strong>
                    {task.description && (
                      <p
                        className={`task-desc ${isCompleted ? "task-title-done" : ""}`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="task-actions">
                    <span
                      className={`task-badge ${isCompleted ? "badge-completed" : "badge-pending"}`}
                    >
                      {isCompleted ? "Completada" : "Pendiente"}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(task.id)}
                      disabled={isBusy}
                      className="icon-btn"
                      title="Cambiar estado"
                    >
                      <RotateCcw size={16} />
                    </button>

                    <button
                      onClick={() => openEditModal(task)}
                      disabled={isBusy}
                      className="icon-btn"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>

                    {deletingId === task.id ? (
                      <span className="confirm-box">
                        <span className="confirm-text">¿Eliminar?</span>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={isBusy}
                          className="confirm-yes"
                        >
                          Sí
                        </button>
                        <button onClick={cancelDelete} className="confirm-no">
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmDelete(task.id)}
                        disabled={isBusy}
                        className="icon-btn"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loadingTasks}
              className={`page-btn ${page === 0 ? "page-btn-disabled" : ""}`}
              title="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                disabled={loadingTasks}
                className={`page-btn ${i === page ? "page-btn-active" : ""}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loadingTasks}
              className={`page-btn ${page >= totalPages - 1 ? "page-btn-disabled" : ""}`}
              title="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              {editingTask ? "Editar tarea" : "Nueva tarea"}
            </h3>
            {formError && <p className="form-error">{formError}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Mínimo 3 caracteres"
                />
              </div>
              <div className="form-field">
                <label>Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-input form-textarea"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="create-btn">
                  {saving
                    ? "Guardando..."
                    : editingTask
                      ? "Guardar cambios"
                      : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
