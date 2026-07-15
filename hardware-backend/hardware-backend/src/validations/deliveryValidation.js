import { z } from 'zod';

export const createDeliverySchema = z.object({
  body: z.object({
    saleId: z.string().uuid(),
    driverName: z.string().optional(),
    vehicleNo: z.string().optional(),
    address: z.string().min(3),
    scheduledDate: z.coerce.date().optional(),
    notes: z.string().optional(),
  }),
});

export const updateDeliveryStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']) }),
});
