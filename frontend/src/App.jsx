import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthProvider';
import LoginUser from "./pages/LoginUser";
import LoginAdmin from "./pages/LoginAdmin";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pages publiques */}
          <Route path="/login-user" element={<LoginUser />} />
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées avec rôle user */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées avec rôle admin */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirection vers login user par défaut */}
          {<Route path="*" element={<LoginUser />} />}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
