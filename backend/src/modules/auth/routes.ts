import { Router } from "express";
import { register, me } from "./auth.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router = Router();

router.post("/register", register);
router.get("/me", requireAuth, me);

export default router;
