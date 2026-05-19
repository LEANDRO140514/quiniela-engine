import { z } from 'zod';

export const AppointmentStatus = z.enum([
  'scheduled',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
  'no-show',
]);

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  dateTime: z.string().datetime(),
  procedureId: z.string(),
  doctorId: z.string().optional(),
  status: AppointmentStatus,
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const AppointmentArraySchema = z.array(AppointmentSchema);
