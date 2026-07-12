import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod/v4";

export interface RequestSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Route-boundary validation. Parses body/query/params with zod
 * ZodErrors propagate to the central error handler, which maps them to a 400
 * with flattened field errors in `details.fields`.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express v5 exposes req.query via a getter; redefine instead of assign.
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
