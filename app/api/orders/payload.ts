const VALID_PAYMENT_MODES = ["cod", "online"] as const;
const VALID_PAYMENT_STATUS = ["pending", "paid"] as const;
const VALID_STATUS = ["pending", "confirmed", "delivered", "cancelled"] as const;
const VALID_BOX_TYPES = ["dozen", "5kg"] as const;

type ItemIn = {
  mango_id?: unknown;
  mango_name?: unknown;
  quantity_dozens?: unknown;
  price_per_dozen?: unknown;
  box_type?: unknown;
  size?: unknown;
};

type HeaderIn = {
  customer_name?: unknown;
  mobile?: unknown;
  address?: unknown;
  district?: unknown;
  delivery_charge?: unknown;
  payment_mode?: unknown;
  payment_status?: unknown;
  status?: unknown;
  items?: unknown;
};

export type ParsedOrder = {
  header: {
    customer_name: string;
    mobile: string;
    address: string;
    district: string;
    delivery_charge: number;
    total_amount: number;
    payment_mode: "cod" | "online";
    payment_status: "pending" | "paid";
    status: "pending" | "confirmed" | "delivered" | "cancelled";
  };
  items: {
    mango_id: number;
    mango_name: string;
    quantity_dozens: number;
    price_per_dozen: number;
    subtotal: number;
    box_type: "dozen" | "5kg";
    size: string | null;
  }[];
};

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export function validateOrderPayload(raw: unknown): ParsedOrder | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid payload." };
  const b = raw as HeaderIn;

  const customer_name = str(b.customer_name, 100);
  if (!customer_name) return { error: "Invalid customer name." };

  const mobileRaw = typeof b.mobile === "string" ? b.mobile.trim() : "";
  if (!/^\d{10}$/.test(mobileRaw)) return { error: "Invalid mobile number." };

  const address = str(b.address, 500);
  if (!address) return { error: "Invalid address." };

  const district = str(b.district, 60);
  if (!district) return { error: "Invalid district." };

  const delivery_charge = num(b.delivery_charge ?? 0, 0, 100000);
  if (delivery_charge === null) return { error: "Invalid delivery charge." };

  const payment_mode = VALID_PAYMENT_MODES.find((m) => m === b.payment_mode);
  if (!payment_mode) return { error: "Invalid payment mode." };

  const payment_status = (VALID_PAYMENT_STATUS.find((s) => s === b.payment_status) ?? "pending") as typeof VALID_PAYMENT_STATUS[number];
  const status = (VALID_STATUS.find((s) => s === b.status) ?? "pending") as typeof VALID_STATUS[number];

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    return { error: "Order must have 1–50 items." };
  }

  const items: ParsedOrder["items"] = [];
  for (const raw of b.items as ItemIn[]) {
    const mango_name = str(raw.mango_name, 100);
    if (!mango_name) return { error: "Invalid item name." };
    const mango_id = num(raw.mango_id ?? 0, 0, 1_000_000);
    if (mango_id === null) return { error: "Invalid mango id." };
    const quantity_dozens = num(raw.quantity_dozens, 0.01, 10_000);
    if (quantity_dozens === null) return { error: "Invalid item quantity." };
    const price_per_dozen = num(raw.price_per_dozen, 0, 1_000_000);
    if (price_per_dozen === null) return { error: "Invalid item price." };
    const box_type = VALID_BOX_TYPES.find((t) => t === raw.box_type) ?? "dozen";
    const sizeCandidate = typeof raw.size === "string" && raw.size.trim() ? raw.size.trim().slice(0, 20) : null;

    items.push({
      mango_id,
      mango_name,
      quantity_dozens,
      price_per_dozen,
      subtotal: Math.round(quantity_dozens * price_per_dozen * 100) / 100,
      box_type,
      size: sizeCandidate,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total_amount = Math.round((subtotal + delivery_charge) * 100) / 100;

  return {
    header: {
      customer_name,
      mobile: mobileRaw,
      address,
      district,
      delivery_charge,
      total_amount,
      payment_mode,
      payment_status,
      status,
    },
    items,
  };
}
