import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { login } from "../api/auth";
import Login from "./Login";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
  logout: vi.fn(),
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>dashboard ok</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Login", () => {
  test("renderiza el formulario", () => {
    renderLogin();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  test("login exitoso guarda token y navega a dashboard", async () => {
    login.mockResolvedValue({ data: { accessToken: "token-123" } });
    const { container } = renderLogin();
    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText("dashboard ok")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("token-123");
    expect(login).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  test("login fallido muestra error y no navega", async () => {
    login.mockRejectedValue(new Error("bad"));
    const { container } = renderLogin();
    fireEvent.change(container.querySelector('input[type="email"]'), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(
      await screen.findByText(/Credenciales incorrectas/),
    ).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
