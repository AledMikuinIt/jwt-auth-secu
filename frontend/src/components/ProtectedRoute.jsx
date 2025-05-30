import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { userToken, userRole } = useContext(AuthContext);

  if (!userToken) {
    return <Navigate to="/login-user" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login-user" replace />;
  }

  return children;
}
