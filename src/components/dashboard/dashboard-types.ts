export type DashboardRecentOrder = {
  id: string;
  order_number: string | number;
  status: string;
  total: string | number;
  created_at?: string | null;
  expires_at?: string | null;
  customers?: { name?: string } | { name?: string }[] | null;
};

export type DashboardMetricsState = {
  activeOrders: number;
  revenue: number;
  revenueChange: string | null;
  revenueOrderCount: number;
  lowStock: number;
};
