import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { getProtectedData } from "../api/auth";

export default function UserDashboard() {
  const { userToken, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProtected = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProtectedData(userToken);
        setData(res.data);
      } catch {
        setError("Accès refusé ou erreur réseau");
      } finally {
        setLoading(false);
      }
    };
    fetchProtected();
  }, [userToken]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl mb-6">Dashboard Utilisateur</h1>
      {loading && <p>Chargement des données utilisateur...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-48">{JSON.stringify(data, null, 2)}</pre>
      )}
      <button
        onClick={logout}
        className="mt-6 bg-red-600 text-white p-2 rounded hover:bg-red-700"
      >
        Se déconnecter
      </button>
    </div>
  );
}
