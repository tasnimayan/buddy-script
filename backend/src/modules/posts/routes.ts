import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import { createPostSchema, postIdParamsSchema } from "./posts.schema.js";
import { create, getById, remove } from "./posts.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate({ body: createPostSchema }), create);
router.get("/:id", validate({ params: postIdParamsSchema }), getById);
router.delete("/:id", validate({ params: postIdParamsSchema }), remove);

export default router;
