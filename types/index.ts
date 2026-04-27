export interface OrderItem {
  id: string;
  order_id: string;
  mango_id: number;
  mango_name: string;
  quantity_dozens: number;
  price_per_dozen: number;
  subtotal: number;
  box_type: string;
  size: string | null;
}

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  mobile: string;
  address: string;
  pincode?: string;
  district: string;
  delivery_charge: number;
  total_amount: number;
  payment_mode: "cod" | "online";
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  order_items: OrderItem[];
}

export interface PaymentConfirmation {
  id: string;
  created_at: string;
  order_id: string;
  utr_number: string;
  screenshot_url: string;
  verified: boolean;
  orders: {
    customer_name: string;
    mobile: string;
    total_amount: number;
    district: string;
  };
}

export interface InventoryItem {
  mango_id: number;
  in_stock: boolean;
}

export interface Mango {
  id: number;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  origin: string;
  season: string;
  inStock: boolean;
}
