export interface OrderItem {
  id: string;
  shopifyId: string;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  productTitle: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: string | null;
  lineTotal: string | null;
}

export interface Order {
  id: string;
  shopifyId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  orderedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  currencyCode: string;
  subtotal: string | null;
  total: string | null;
  tax: string | null;
  shipping: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: OrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    paid: number;
    pending: number;
    fulfilled: number;
    needsAttention: number;
  };
}

export interface OrderResponse {
  success: boolean;
  data: Order;
}
