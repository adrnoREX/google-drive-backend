import express from "express"
import { storage } from "../controllers/storage.controller.js"

const router = express.Router();
router.get("/storage/info", storage);

export default router;