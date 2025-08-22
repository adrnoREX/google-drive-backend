import express, { Router } from "express"
import { authmiddleware } from "../middleware/authmiddleware.js";
import { del, read, secure, update } from "../controllers/user.controller.js";

const router = express.Router();
router.get("/secure-data", authmiddleware, secure);
router.get("/users", read);
router.put("/users/:id", update);
router.delete("/users/:id", del);

export default router;