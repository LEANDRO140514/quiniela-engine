import { z } from 'zod';

export const FaqSchema = z.object({
  id: z.string().regex(/^faq-\d{3}$/),
  category: z.literal('faq'),
  question: z.string().min(5),
  answer: z.string().min(10),
  tags: z.array(z.string()).optional(),
});

export type Faq = z.infer<typeof FaqSchema>;

export const FaqArraySchema = z.array(FaqSchema);
