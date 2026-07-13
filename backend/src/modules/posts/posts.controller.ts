import type { Request, Response } from "express";
import type { CreatePostInput } from "./posts.schema.js";
import { createPost, getPost, deletePost } from "./posts.service.js";
import { ResponseHandler } from "../../lib/response.js";

interface IdParams {
  id: bigint;
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreatePostInput;
  const post = await createPost({ authorId: req.userId!, ...body });
  ResponseHandler.success(res, "Post created successfully", post, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParams;
  const post = await getPost(req.userId!, id);
  ResponseHandler.success(res, "Post retrieved successfully", post, 200);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParams;
  await deletePost(req.userId!, id);
  ResponseHandler.success(res, "Post deleted successfully", undefined, 204);
}
