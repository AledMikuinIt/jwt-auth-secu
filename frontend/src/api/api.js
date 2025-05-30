import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/auth',
  withCredentials: true, // pour envoyer les cookies (refresh token)
});

// Flag pour éviter les multiples refresh simultanés
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si 401 et pas déjà en refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si refresh déjà en cours, on attend
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/refresh'); 
        const newAccessToken = response.data.accessToken;

        // Met à jour le header de la requête originale
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

        // Propagation vers les requêtes en attente
        processQueue(null, newAccessToken);

        // Met à jour localStorage ou ton contexte
        localStorage.setItem('token', newAccessToken);

        isRefreshing = false;

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        // Eventuellement logout ou redirection
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
