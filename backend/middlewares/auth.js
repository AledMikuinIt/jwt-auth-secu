import jwt from 'jsonwebtoken';
import redis from '../config/redisClient.js';
import { decryptPayload } from '../utils/jwtCrypto.js';
import jwtKeys from '../config/jwtKeys.js';

const isBlacklisted = async (token) => {
  return await redis.exists(`blacklist:${token}`);
};

export default async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    if (await isBlacklisted(token)) {
      return res.status(403).json({ message: 'Token révoqué' });
    }

    let decoded;
    let verified = false;
    let usedKey = null;
    const allKeys = [jwtKeys.current, ...jwtKeys.previous];

    for (const key of allKeys) {
      try {
        decoded = jwt.verify(token, key);
        verified = true;
        usedKey = key;
        break;
      } catch (_) {}
    }

    if (!verified || !decoded) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }

    // Passer la clé utilisée pour déchiffrer
    try {
req.user = await decryptPayload(decoded.data, jwtKeys.derivedAccess); 

} catch (err) {
  console.error('Erreur decryptPayload:', err);
  return res.status(500).json({ message: 'Erreur interne lors du décryptage' });
}

    next();
  } catch (err) {
    console.error('Middleware auth error:', err);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
};
