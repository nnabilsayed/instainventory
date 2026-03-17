import { toast } from 'sonner';

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (toastId?: string | number) => toast.dismiss(toastId),

  productSaved: () => toast.success('Product saved'),
  productUpdated: () => toast.success('Product updated'),
  productDeleted: () => toast.success('Product deleted'),
  productError: () => toast.error('Failed to save product - please try again'),

  orderConfirmed: () => toast.success('Order confirmed'),
  orderShipped: () => toast.success('Order marked as shipped'),
  orderDelivered: () => toast.success('Order marked as delivered'),
  orderCancelled: () => toast.success('Order cancelled'),
  orderError: () => toast.error('Failed to update order - please try again'),
  draftCreated: () => toast.success('Draft created - link is ready to share'),

  customerSaved: () => toast.success('Customer saved'),
  customerError: () => toast.error('Failed to save customer'),

  settingsSaved: () => toast.success('Settings saved'),
  settingsError: () => toast.error('Failed to save settings - please try again'),

  linkCopied: () => toast.success('Link copied to clipboard'),
  copied: () => toast.success('Copied to clipboard'),

  stockUpdated: () => toast.success('Stock updated'),
  stockError: () => toast.error('Failed to update stock'),
};
