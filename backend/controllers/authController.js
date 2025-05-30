import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import jwtKeys from '../config/jwtKeys.js';
import redis from '../config/redisClient.js';
import { validationResult } from 'express-validator';
import { encryptPayload, decryptPayload} from '../utils/jwtCrypto.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();



const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword, role: role || 'user' });
  await newUser.save();
  res.status(201).json({ message: 'User registered' });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.status === 'banned') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Chiffrement avec clé dérivée
    const accessPayload = encryptPayload({ id: user.id, email: user.email }, jwtKeys.derivedAccess);

    // Signature avec clé brute (string)
    const accessToken = jwt.sign(
      {
        data: accessPayload,
        role: user.role,
      },
      jwtKeys.access,  // clé brute string pour JWT
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshPayload = await encryptPayload({ id: user.id }, jwtKeys.derivedRefresh);

    const refreshToken = jwt.sign(
      { data: refreshPayload },
      jwtKeys.refresh, // clé brute string pour JWT
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erreur interne lors du login' });
  }
};





const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.sendStatus(204);
    }

    // Vérification de la signature du token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtKeys.current); 
    } catch (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }

    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: 'Token invalide (exp manquant)' });
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
    }

    const userId = (await decryptPayload(decoded.data, jwtKeys.derivedAccess))?.id; 
    if (userId) {
      await redis.del(`refresh:${userId}`);
    }

    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Erreur lors du logout' });
  }
};





const refresh = async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) return res.status(401).json({ message: 'Refresh token manquant' });

  try {
    const decoded = jwt.verify(oldToken, jwtKeys.refresh); // clé brute
    const decrypted = await decryptPayload(decoded.data, jwtKeys.derivedRefresh); 
    const userId = decrypted.id;

    const stored = await redis.get(`refresh:${userId}`);
    if (!stored || stored !== oldToken) {
      return res.status(403).json({ message: 'Refresh token invalide ou expiré' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const accessPayload = encryptPayload({ id: user.id, email: user.email }, jwtKeys.derivedAccess); 
    const newAccessToken = jwt.sign(
      {
        data: accessPayload,
        role: user.role,
      },
      jwtKeys.access, // clé brute
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshPayload = encryptPayload({ id: userId }, jwtKeys.derivedRefresh); 

    const newRefreshToken = jwt.sign(
      { data: refreshPayload },
      jwtKeys.refresh, // clé brute
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(403).json({ message: 'Refresh token invalide' });
  }
};



const decodeJWT = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.sendStatus(401);
  const isBlacklisted = await redis.get(`blacklist:${token}`);

  if (isBlacklisted) return res.status(403).json({ message: 'Token invalide (blacklisté)' });
  

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtKeys.access);
    } catch (err) {
      for (const oldKey of jwtKeys.previous) {
        try {
          decoded = jwt.verify(token, oldKey);
          break;
        } catch (_) {}
      }
      if (!decoded) return res.status(403).json({ message: 'Token invalide' });
    }

    // Initialise et récupère la clé dérivée avant décryptage
    const decrypted = await decryptPayload(decoded.data, jwtKeys.derivedAccess); 
    const user = await User.findById(decrypted.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ user });

  } catch (err) {
    console.error('Erreur lors du décryptage ou autre:', err);
    res.status(403).json({ message: 'Invalid token' });
  }
};


export { register, login, logout, decodeJWT, refresh };
