import express from 'express'
import { authmiddleware } from '../middleware/authmiddleware.js';
import { login, logout, me, signup } from '../controllers/auth.controller.js';

const router = express.Router();
router.post("/signup", signup)
router.get("/me", authmiddleware, me);
router.post("/login", login);
router.post("/logout", logout);

export default router;