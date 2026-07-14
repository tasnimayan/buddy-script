import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import {
  commentIdParamsSchema,
  commentListQuerySchema,
} from "./comments.schema.js";
import { listCommentReplies, remove } from "./comments.controller.js";
import { likersQuerySchema } from "../likes/likes.schema.js";
import {
  putCommentLike,
  deleteCommentLike,
  getCommentLikers,
} from "../likes/likes.controller.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/:id/replies",
  validate({ params: commentIdParamsSchema, query: commentListQuerySchema }),
  listCommentReplies,
);
router.delete("/:id", validate({ params: commentIdParamsSchema }), remove);

router.put(
  "/:id/like",
  validate({ params: commentIdParamsSchema }),
  putCommentLike,
);
router.delete(
  "/:id/like",
  validate({ params: commentIdParamsSchema }),
  deleteCommentLike,
);
router.get(
  "/:id/likes",
  validate({ params: commentIdParamsSchema, query: likersQuerySchema }),
  getCommentLikers,
);

export default router;
