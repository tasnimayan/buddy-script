import type { Request, Response } from "express";
import { ResponseHandler } from "../lib/response.js";

export function notFoundHandler(_req: Request, res: Response): void {
  ResponseHandler.notFound(res);
}
