import { z } from "zod/v4";
import { limitField } from "../../lib/validation.js";

export const FEED_DEFAULT_LIMIT = 20;

export const feedQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: limitField(FEED_DEFAULT_LIMIT, 50),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
