import { Router } from "express";
import { register, login, refresh, logout, me } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import {
  registerRateLimit,
  refreshRateLimit,
} from "../../middleware/rate-limit.js";

const router = Router();

router.post(
  "/register",
  registerRateLimit,
  validate({ body: registerSchema }),
  register,
);

// Login rate limiting counts failures only, so it lives in the controller
router.post("/login", validate({ body: loginSchema }), login);

router.post("/refresh", refreshRateLimit, refresh);

router.post("/logout", requireAuth, logout);

router.get("/me", requireAuth, me);

export default router;
