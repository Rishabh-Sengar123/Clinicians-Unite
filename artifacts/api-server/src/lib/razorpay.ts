import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required");
}

export const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

export interface CreateOrderOptions {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createOrder(opts: CreateOrderOptions) {
  return razorpay.orders.create({
    amount: opts.amountInPaise,
    currency: "INR",
    receipt: opts.receipt,
    notes: opts.notes ?? {},
  });
}

export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", keySecret!)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export const RAZORPAY_KEY_ID = keyId;
