import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const { register, userToken, loading, error, setError } = useContext(AuthContext);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (userToken) navigate("/register");
    return () => setError(null);
  }, [userToken, navigate, setError]);


const handleSubmit = async (e) => {
  e.preventDefault();
  const success = await register(email, password);
  if (success) {
    setSuccessMessage("Inscription réussie !");
    setEmail("");
    setPassword("");
  }
};


  return (
    <div className="container">
      <h1>Inscription</h1>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Inscription en cours..." : "S'inscrire"}
        </button>
        {successMessage && <div className="success">{successMessage}</div>}

      </form>
      <div className="link">
        Déjà un compte ? <Link to="/login-user">Connexion</Link>
      </div>
    </div>
  );
}
