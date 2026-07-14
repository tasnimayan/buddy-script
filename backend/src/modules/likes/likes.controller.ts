import type { Request, Response } from "express";
import type { LikersQuery } from "./likes.schema.js";
import {
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
  listPostLikers,
  listCommentLikers,
} from "./likes.service.js";
import { ResponseHandler } from "../../lib/response.js";

interface IdParams {
  id: bigint;
}

function idOf(req: Request): bigint {
  return (req.params as unknown as IdParams).id;
}

function likersQuery(req: Request): LikersQuery {
  return req.query as unknown as LikersQuery;
}

export async function putPostLike(req: Request, res: Response): Promise<void> {
  await likePost(req.userId!, idOf(req));
  ResponseHandler.noContent(res);
}

export async function deletePostLike(
  req: Request,
  res: Response,
): Promise<void> {
  await unlikePost(req.userId!, idOf(req));
  ResponseHandler.noContent(res);
}

export async function getPostLikers(
  req: Request,
  res: Response,
): Promise<void> {
  const { cursor, limit } = likersQuery(req);
  const page = await listPostLikers(req.userId!, idOf(req), cursor, limit);
  ResponseHandler.success(res, "Post likers", page.items, 200, {
    nextCursor: page.nextCursor,
    limit,
  });
}

export async function putCommentLike(
  req: Request,
  res: Response,
): Promise<void> {
  await likeComment(req.userId!, idOf(req));
  ResponseHandler.noContent(res);
}

export async function deleteCommentLike(
  req: Request,
  res: Response,
): Promise<void> {
  await unlikeComment(req.userId!, idOf(req));
  ResponseHandler.noContent(res);
}

export async function getCommentLikers(
  req: Request,
  res: Response,
): Promise<void> {
  const { cursor, limit } = likersQuery(req);
  const page = await listCommentLikers(req.userId!, idOf(req), cursor, limit);
  ResponseHandler.success(res, "Comment likers", page.items, 200, {
    nextCursor: page.nextCursor,
    limit,
  });
}
