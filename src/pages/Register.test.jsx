import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { register } from "../api/auth";
import Register from "./Register";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
  logout: vi.fn(),
}));

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<div>dashboard ok</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

const fill = (container, { username, email, password }) => {
  fireEvent.change(container.querySelector('input[type="text"]'), {
    target: { value: username },
  });
  fireEvent.change(container.querySelector('input[type="email"]'), {
    target: { value: email },
  });
  fireEvent.change(container.querySelector('input[type="password"]'), {
    target: { value: password },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Register", () => {
  test("registro exitoso guarda token y navega", async () => {
    register.mockResolvedValue({ data: { accessToken: "tok-r" } });
    const { container } = renderRegister();
    fill(container, { username: "k", email: "a@b.com", password: "123456" });
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(await screen.findByText("dashboard ok")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("tok-r");
  });

  test("password corta muestra error y no llama a register", async () => {
    const { container } = renderRegister();
    fill(container, { username: "k", email: "a@b.com", password: "123" });
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(
      await screen.findByText(/al menos 6 caracteres/),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
