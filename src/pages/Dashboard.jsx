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
import { RotateCcw, Pencil, Trash2 } from "lucide-react";

export default function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

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
  }, [token]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await getTasks(token);
      setTasks(res.data.content || []);
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
      await fetchTasks();
    } catch (err) {
      console.error("Error al eliminar tarea", err);
    } finally {
      setBusyTaskId(null);
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Task Manager</h1>
        <div style={styles.headerRight}>
          {user && <span style={styles.username}>Hola, {user.username}</span>}
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <h2 style={styles.sectionTitle}>Mis tareas</h2>
          <button onClick={openCreateModal} style={styles.createBtn}>
            + Crear tarea
          </button>
        </div>

        {loadingTasks ? (
          <p style={styles.empty}>Cargando tareas...</p>
        ) : tasks.length === 0 ? (
          <p style={styles.empty}>No tienes tareas aún. ¡Crea una!</p>
        ) : (
          <ul style={styles.taskList}>
            {tasks.map((task) => {
              const isBusy = busyTaskId === task.id;
              const isCompleted = task.status === "COMPLETED";
              return (
                <li key={task.id} style={styles.taskItem}>
                  <div style={styles.taskInfo}>
                    <strong style={isCompleted ? styles.titleDone : undefined}>
                      {task.title}
                    </strong>
                    {task.description && (
                      <p
                        style={{
                          ...styles.taskDesc,
                          ...(isCompleted ? styles.titleDone : {}),
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div style={styles.taskActions}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: isCompleted ? "#22c55e" : "#f59e0b",
                      }}
                    >
                      {isCompleted ? "Completada" : "Pendiente"}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(task.id)}
                      disabled={isBusy}
                      style={styles.iconBtn}
                      title="Cambiar estado"
                    >
                      <RotateCcw size={16} />
                    </button>

                    <button
                      onClick={() => openEditModal(task)}
                      disabled={isBusy}
                      style={styles.iconBtn}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>

                    {deletingId === task.id ? (
                      <span style={styles.confirmBox}>
                        <span style={styles.confirmText}>¿Eliminar?</span>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={isBusy}
                          style={styles.confirmYes}
                        >
                          Sí
                        </button>
                        <button onClick={cancelDelete} style={styles.confirmNo}>
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmDelete(task.id)}
                        disabled={isBusy}
                        style={styles.iconBtn}
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
      </main>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingTask ? "Editar tarea" : "Nueva tarea"}
            </h3>
            {formError && <p style={styles.error}>{formError}</p>}
            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  style={styles.input}
                  placeholder="Mínimo 3 caracteres"
                />
              </div>
              <div style={styles.field}>
                <label>Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{
                    ...styles.input,
                    height: "80px",
                    resize: "vertical",
                  }}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.createBtn}
                >
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

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  header: {
    backgroundColor: "#4f46e5",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "white", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  username: { color: "white", fontSize: "0.9rem" },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "1px solid white",
    color: "white",
    padding: "0.4rem 0.8rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  main: { maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  sectionTitle: { margin: 0, color: "#333" },
  createBtn: {
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  empty: { color: "#888", textAlign: "center", marginTop: "3rem" },
  taskList: {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  taskItem: {
    backgroundColor: "white",
    padding: "1rem 1.5rem",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  taskInfo: { flex: 1, minWidth: 0 },
  taskDesc: { margin: "0.25rem 0 0", color: "#666", fontSize: "0.9rem" },
  titleDone: { color: "#999", textDecoration: "line-through" },
  taskActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexShrink: 0,
  },
  badge: {
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
  },
  iconBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: "4px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
  },
  confirmBox: { display: "flex", alignItems: "center", gap: "0.4rem" },
  confirmText: { fontSize: "0.8rem", color: "#666" },
  confirmYes: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "0.3rem 0.6rem",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  confirmNo: {
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "0.3rem 0.6rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#333",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    width: "400px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  modalTitle: { margin: "0 0 1rem", color: "#333" },
  field: {
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  cancelBtn: {
    backgroundColor: "white",
    border: "1px solid #ccc",
    padding: "0.6rem 1.2rem",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#333",
  },
  error: { color: "red", fontSize: "0.9rem", marginBottom: "1rem" },
};
