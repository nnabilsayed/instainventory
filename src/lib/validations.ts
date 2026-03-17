import { z } from 'zod';
import { isValidEgyptianPhone } from './phone';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.01, 'Price must be greater than 0')
    .max(999999, 'Price too high'),
  is_active: z.boolean().default(true),
});

export const variantSchema = z
  .object({
    size: z.string().max(50, 'Size is too long').optional(),
    color: z.string().max(50, 'Color is too long').optional(),
    stock_qty: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
    price_override: z.coerce.number().min(0, 'Price override cannot be negative').optional().nullable(),
  })
  .refine((data) => data.size || data.color, {
    message: 'Variant must have at least a size or color',
    path: ['size'],
  });

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100, 'Name is too long'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(isValidEgyptianPhone, {
      message: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
    }),
  instagram: z.string().max(50, 'Instagram handle is too long').optional().nullable(),
  notes: z.string().max(500, 'Notes are too long').optional().nullable(),
});

export const settingsSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100, 'Name is too long'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp number is required')
    .refine(isValidEgyptianPhone, {
      message: 'Enter a valid Egyptian WhatsApp number (01xxxxxxxxx)',
    }),
  instapay_name: z.string().max(100, 'InstaPay name is too long').optional().nullable(),
  instapay_number: z.string().max(20, 'InstaPay number is too long').optional().nullable(),
  default_shipping_fee: z.coerce
    .number()
    .min(0, 'Shipping fee cannot be negative')
    .max(9999, 'Shipping fee too high'),
});

export const draftOrderSchema = z
  .object({
    customer_id: z.string().uuid('Please select a customer').optional(),
    new_customer: customerSchema.optional(),
  })
  .refine((data) => data.customer_id || data.new_customer, {
    message: 'Please select an existing customer or create a new one',
  });

export type ProductFormData = z.infer<typeof productSchema>;
export type VariantFormData = z.infer<typeof variantSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
