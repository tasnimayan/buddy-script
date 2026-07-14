import type { Request, Response } from "express";
import type {
  CreateCommentInput,
  CommentListQuery,
} from "./comments.schema.js";
import {
  createComment,
  listTopLevelComments,
  listReplies,
  deleteComment,
} from "./comments.service.js";
import { ResponseHandler } from "../../lib/response.js";

interface IdParams {
  id: bigint;
}

function idOf(req: Request): bigint {
  return (req.params as unknown as IdParams).id;
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateCommentInput;
  const comment = await createComment({
    viewerId: req.userId!,
    postId: idOf(req),
    ...body,
  });
  ResponseHandler.success(res, "Comment created", comment, 201);
}

export async function listForPost(req: Request, res: Response): Promise<void> {
  const { cursor, limit } = req.query as unknown as CommentListQuery;
  const page = await listTopLevelComments(
    req.userId!,
    idOf(req),
    cursor,
    limit,
  );

  ResponseHandler.success(res, "Top level comments", page.items, 200, {
    nextCursor: page.nextCursor,
    limit,
  });
}

export async function listCommentReplies(
  req: Request,
  res: Response,
): Promise<void> {
  const { cursor, limit } = req.query as unknown as CommentListQuery;
  const page = await listReplies(req.userId!, idOf(req), cursor, limit);
  ResponseHandler.success(res, "Comment replies", page.items, 200, {
    nextCursor: page.nextCursor,
    limit,
  });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteComment(req.userId!, idOf(req));
  ResponseHandler.noContent(res);
}
