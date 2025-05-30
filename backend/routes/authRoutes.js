import express from 'express';
import { body } from 'express-validator';
const router = express.Router();

import * as authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';



router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court')
  ],
  authController.register
);

router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refresh);

router.get('/me', authMiddleware, authController.decodeJWT);

export default router;