import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import { feedQuerySchema } from "./feed.schema.js";
import { feed } from "./feed.controller.js";

const router = Router();

router.get("/", requireAuth, validate({ query: feedQuerySchema }), feed);

export default router;
