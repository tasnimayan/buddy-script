import { z } from "zod/v4";
import { limitField } from "../../lib/validation.js";

export const likersQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: limitField(20, 50),
});

export type LikersQuery = z.infer<typeof likersQuerySchema>;
