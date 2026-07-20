import axios from "axios";
import { getCheckoutSession, saveCheckoutSession } from "@/lib/checkout-session";
import mollieClient from "@/lib/mollie";
import {
  isTerminalMollieOutcome,
  resolveMollieOrderOutcome,
  type MollieOrderOutcome,
} from "@/lib/mollie-payment-state";

type ReconcileInput = {
  orderReference?: string;
  paymentId?: string;
};

type ReconcileResult = {
  orderReference: string;
  status: MollieOrderOutcome;
};

const empireBaseUrl = () =>
  (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\/$/, "");

const paymentStatusSecret = () => {
  const secret = process.env.EMPIRE_PAYMENT_STATUS_SECRET;
  if (!secret) throw new Error("EMPIRE_PAYMENT_STATUS_SECRET is not configured");
  return secret;
};

export async function reconcileMollieOrder({
  orderReference: requestedOrderReference,
  paymentId: requestedPaymentId,
}: ReconcileInput): Promise<ReconcileResult> {
  const session = requestedOrderReference
    ? await getCheckoutSession(requestedOrderReference)
    : null;
  const paymentId = requestedPaymentId || session?.transaction_id;

  if (!paymentId) throw new Error("Mollie payment reference is missing");

  const payment = await mollieClient.payments.get(paymentId);
  const metadata = payment.metadata as Record<string, unknown> | null;
  const paymentOrderReference = String(metadata?.order_reference || metadata?.order_id || "");
  const orderReference = requestedOrderReference || paymentOrderReference;

  if (!orderReference || !paymentOrderReference || orderReference !== paymentOrderReference) {
    throw new Error("Mollie payment does not match the requested order");
  }
  if (session?.transaction_id && session.transaction_id !== payment.id) {
    throw new Error("Mollie payment does not match the checkout session");
  }

  const outcome = resolveMollieOrderOutcome(payment.status);
  if (!isTerminalMollieOutcome(outcome)) {
    return { orderReference, status: "pending" };
  }

  const endpoint = outcome === "processing" ? "payment-confirmed" : "payment-cancelled";

  await axios.post(
    `${empireBaseUrl()}/api/internal/orders/${encodeURIComponent(orderReference)}/${endpoint}`,
    {
      payment_id: payment.id,
      payment_status: payment.status,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Payment-Status-Secret": paymentStatusSecret(),
      },
    },
  );

  if (session) {
    const sanitizedSession = {
      ...session,
      status: outcome,
      mollie_status: payment.status,
      transaction_id: payment.id,
    };
    delete sanitizedSession.auth_token;
    await saveCheckoutSession(orderReference, sanitizedSession);
  }

  return { orderReference, status: outcome };
}
