# Backend Auth JWT avec Payload Encrypté, Rotation de Clés, et Rate Limiting

Ce projet est un backend d’authentification complet construit avec Node.js, Express, MongoDB et Redis, qui utilise des tokens JWT sécurisés avec payload encrypté, gestion des rôles, blacklist de tokens, rotation des clés JWT et rate limiting.

---

## Fonctionnalités principales

- **Inscription et connexion sécurisées** avec validation des données et gestion des erreurs  
- **JWT avec payload encrypté** pour protéger les données sensibles dans le token  
- **Gestion des rôles** (user/admin) pour sécuriser les accès aux routes  
- **Rotation des clés JWT** pour renforcer la sécurité des tokens  
- **Blacklist des tokens** pour gérer le logout et invalider les tokens  
- **Rate limiting** pour limiter le nombre de requêtes et éviter les abus  
- **Protection des routes privées** avec vérification du token et des droits d’accès  
- **Tests automatisés** couvrant tous les cas critiques (15 tests avec jest)  
- Utilisation de **Redis** pour la gestion des tokens blacklistés et du rate limiting  
- Connexion à **MongoDB** via Mongoose pour la gestion des utilisateurs  

---

## Prérequis

- Node.js (version 18+ recommandée)  
- MongoDB (accessible via URI)  
- Redis (pour gestion de blacklist et cache)  
- Un fichier `.env` configuré (déjà présent dans les dossiers backend et frontend)  

---

## Installation

1. Clonez ce dépôt :

   ```bash
   git clone https://github.com/AledMikuinIt/node.git
   cd node
   
2. Installez les dépendances backend :

   ```bash
   cd backend
   npm install
   
3. Installez les dépendances backend :

   ```bash
   cd ../frontend
   npm install

4. Lancement en mode développement :

   Ouvrez deux terminaux
   Dans le premier terminal, lancez le backend :
   ```bash
   cd backend
   npm run dev
   ```
   Dans le deuxième terminal, lancez le frontend :
   ```bash
   cd frontend
   npm run dev
   ```
5. Lancement des tests :

   ```bash
   cd backend
   npm test
   ```

Note : Assurez-vous que vos variables .env sont correctement configurées, notamment les URI MongoDB et Redis ainsi que les secrets JWT avant de lancer l’application.


⚠️ Ce projet est un starter kit destiné aux développeurs expérimentés.
Pour une mise en production sécurisée, une personnalisation adaptée à vos besoins, et un support professionnel, contactez-moi.
