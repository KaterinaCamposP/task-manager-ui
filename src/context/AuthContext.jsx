import { createContext, useContext, useState } from "react";
import { logout as logoutApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const saveToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutApi(token);
      } catch (err) {
        // Si el backend falla (Redis caído, red, etc.), igual limpiamos
        // la sesión local — no queremos que el usuario quede "atrapado"
        console.error("Error al invalidar el token en el backend", err);
      }
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
