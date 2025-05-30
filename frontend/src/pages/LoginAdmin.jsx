import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, userToken, userRole, loading, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userToken && userRole === "admin") {
      navigate("/admin-dashboard");
    }
    return () => setError(null);
  }, [userToken, userRole, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="container">
      <h1>Connexion Admin</h1>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="link">
      <Link to="/login-user">Connexion Utilisatuer</Link>
      </div>
    </div>
  );
}
