import { z } from 'zod';

const InsuranceInfoSchema = z.object({
  provider: z.string().optional(),
  plan: z.string().optional(),
  memberId: z.string().optional(),
});

const MedicalHistorySchema = z.object({
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
});

export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  dateOfBirth: z.string().date().optional(),
  insurance: InsuranceInfoSchema.optional(),
  medicalHistory: MedicalHistorySchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const PatientArraySchema = z.array(PatientSchema);
