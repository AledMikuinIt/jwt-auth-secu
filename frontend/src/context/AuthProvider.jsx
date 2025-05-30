import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser } from "../api/auth";
import { jwtDecode } from "jwt-decode";

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(() => localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Met à jour le rôle quand le token change (ex : au démarrage ou après login)
  useEffect(() => {
    if (userToken) {
      localStorage.setItem("token", userToken);
      try {
        const decoded = jwtDecode(userToken);
        setUserRole(decoded.role || null);
      } catch {
        setUserRole(null);
      }
    } else {
      localStorage.removeItem("token");
      setUserRole(null);
    }
  }, [userToken]);

  const login = async (email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({ email, password, role });
      setUserToken(res.data.accessToken);
      const decoded = jwtDecode(res.data.accessToken);
      setUserRole(decoded.role);
      
    } catch (err) {
      setError(err.response?.data?.message || "Erreur connexion");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser({ email, password, role });
      setUserToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return true;
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const backendMessage = err.response?.data?.message;

      if (validationErrors && validationErrors.length > 0) {
        const messages = validationErrors.map((e) => e.msg).join(" | ");
        setError(messages);
      } else {
        setError(backendMessage || "Erreur d'inscription");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUserToken(null);
  };

  async function refreshToken() {
    try {
      const response = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Refresh token invalide ou expiré");
      }

      const data = await response.json();
      setUserToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error("Erreur refresh token:", error);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userRole, 
        login,
        register,
        logout,
        loading,
        error,
        setError,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
