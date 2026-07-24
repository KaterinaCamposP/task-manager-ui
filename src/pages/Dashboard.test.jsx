import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { getProfile } from "../api/auth";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from "../api/tasks";
import Dashboard from "./Dashboard";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../api/tasks", () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTaskStatus: vi.fn(),
}));

const TASK = {
  id: 1,
  title: "T1",
  description: "",
  status: "PENDING",
  createdAt: "x",
  updatedAt: "x",
};

const mockList = () =>
  getTasks.mockImplementation((_t, params) => {
    const size = params && params.size;
    const status = params && params.status;
    if (size === 1) {
      const n = status === "PENDING" ? 1 : status === "COMPLETED" ? 0 : 1;
      return Promise.resolve({
        data: { content: [], totalElements: n, totalPages: 1 },
      });
    }
    return Promise.resolve({
      data: { content: [TASK], totalElements: 1, totalPages: 1 },
    });
  });

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "tok");
  getProfile.mockResolvedValue({
    data: { username: "katerina", email: "a@b.com" },
  });
  mockList();
  createTask.mockResolvedValue({ data: { ...TASK, id: 2 } });
  updateTask.mockResolvedValue({ data: { ...TASK, title: "T1 editada" } });
  deleteTask.mockResolvedValue({});
  toggleTaskStatus.mockResolvedValue({
    data: { ...TASK, status: "COMPLETED" },
  });
});

describe("Dashboard", () => {
  test("lista las tareas desde la API", async () => {
    renderDashboard();
    expect(await screen.findByText("T1")).toBeInTheDocument();
    expect(screen.getByText("Hola, katerina")).toBeInTheDocument();
  });

  test("crea una tarea y muestra toast de éxito", async () => {
    renderDashboard();
    await screen.findByText("T1");
    fireEvent.click(screen.getByRole("button", { name: /Crear tarea/ }));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 3 caracteres"), {
      target: { value: "Nueva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByText("Tarea creada")).toBeInTheDocument();
    expect(createTask).toHaveBeenCalled();
  });

  test("elimina una tarea tras confirmar", async () => {
    renderDashboard();
    await screen.findByText("T1");
    fireEvent.click(screen.getByTitle("Eliminar"));
    fireEvent.click(screen.getByRole("button", { name: "Sí" }));
    expect(await screen.findByText("Tarea eliminada")).toBeInTheDocument();
    expect(deleteTask).toHaveBeenCalledWith("tok", 1);
  });

  test("cambia el estado de una tarea", async () => {
    renderDashboard();
    await screen.findByText("T1");
    fireEvent.click(screen.getByTitle("Cambiar estado"));
    expect(await screen.findByText("Estado actualizado")).toBeInTheDocument();
    expect(toggleTaskStatus).toHaveBeenCalledWith("tok", 1);
  });

  test("edita una tarea", async () => {
    renderDashboard();
    await screen.findByText("T1");
    fireEvent.click(screen.getByTitle("Editar"));
    expect(await screen.findByText("Editar tarea")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Mínimo 3 caracteres"), {
      target: { value: "T1 editada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tarea actualizada")).toBeInTheDocument();
    expect(updateTask).toHaveBeenCalled();
  });
});
