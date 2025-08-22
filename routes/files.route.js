import express from "express"
import multer from "multer";
import { access, copy, del, download, empty, fetch, preview, rename, restore, search, share, trash, uploadfile } from "../controllers/files.controller.js";
import { authmiddleware } from "../middleware/authmiddleware.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
router.post("/upload", upload.array("files"), uploadfile);
router.get("/files", fetch);
router.get("/files/trash", trash);
router.get("/preview/:id", preview);
router.delete("/files/trash/empty", empty);
router.put("/files/:id/rename", rename);
router.put("/files/:id/delete", del);
router.get("/files/:id/download", download);
router.post("/files/:id/copy", copy);
router.put("/files/:id/restore", restore);
router.post("/share", authmiddleware, share);
router.get("/share/:token", authmiddleware, access);
router.get("/files/search", search);

export default router;