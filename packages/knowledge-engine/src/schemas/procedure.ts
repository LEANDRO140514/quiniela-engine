import { z } from 'zod';

const PriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.literal('MXN'),
});

export const ProcedureSchema = z.object({
  id: z.string().regex(/^proc-\d{3}$/),
  category: z.literal('procedure'),
  name: z.string().min(3),
  durationMinutes: z.number().int().min(10),
  description: z.string().min(10),
  preparation: z.string().optional(),
  aftercare: z.string().optional(),
  priceRange: PriceRangeSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export type Procedure = z.infer<typeof ProcedureSchema>;

export const ProcedureArraySchema = z.array(ProcedureSchema);
