import type { Request, Response } from "express";
import type { FeedQuery } from "./feed.schema.js";
import { getFeed } from "./feed.service.js";
import { ResponseHandler } from "../../lib/response.js";

export async function feed(req: Request, res: Response): Promise<void> {
  const { cursor, limit } = req.query as unknown as FeedQuery;
  const page = await getFeed(req.userId!, cursor, limit);
  ResponseHandler.success(res, "Feed", page.items, 200, {
    nextCursor: page.nextCursor,
    limit,
  });
}
