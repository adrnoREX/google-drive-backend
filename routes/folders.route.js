import express, { Router } from "express"
import { copy, del, empty, fetch, getfiles, list, rename, restore, uploadfolder } from "../controllers/folders.controller.js";

const router = express.Router();
router.post("/folders", uploadfolder);
router.get("/folders/:id/files", getfiles);
router.get("/folders", list);
router.post("/folders/:id/copy", copy);
router.put("/folders/:id/delete", del);
router.put("/folders/:id/rename", rename);
router.get("/folders/trash", fetch);
router.put("/folders/:id/restore", restore);
router.delete("/folders/trash/empty", empty);

export default router;