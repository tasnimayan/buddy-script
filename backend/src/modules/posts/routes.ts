import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import { createPostSchema, postIdParamsSchema } from "./posts.schema.js";
import { create, getById, remove } from "./posts.controller.js";
import { likersQuerySchema } from "../likes/likes.schema.js";
import {
  putPostLike,
  deletePostLike,
  getPostLikers,
} from "../likes/likes.controller.js";
import {
  createCommentSchema,
  commentListQuerySchema,
} from "../comments/comments.schema.js";
import {
  create as createComment,
  listForPost as listComments,
} from "../comments/comments.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate({ body: createPostSchema }), create);
router.get("/:id", validate({ params: postIdParamsSchema }), getById);
router.delete("/:id", validate({ params: postIdParamsSchema }), remove);

// Post Likes routes
router.put("/:id/like", validate({ params: postIdParamsSchema }), putPostLike);
router.delete(
  "/:id/like",
  validate({ params: postIdParamsSchema }),
  deletePostLike,
);
router.get(
  "/:id/likes",
  validate({ params: postIdParamsSchema, query: likersQuerySchema }),
  getPostLikers,
);

// Post Comments routes
router.post(
  "/:id/comments",
  validate({ params: postIdParamsSchema, body: createCommentSchema }),
  createComment,
);
router.get(
  "/:id/comments",
  validate({ params: postIdParamsSchema, query: commentListQuerySchema }),
  listComments,
);

export default router;
