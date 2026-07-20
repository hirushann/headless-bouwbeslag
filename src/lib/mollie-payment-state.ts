export type MolliePaymentStatus =
  | "paid"
  | "canceled"
  | "failed"
  | "expired"
  | "open"
  | "pending"
  | "authorized"
  | string;

export type MollieOrderOutcome = "processing" | "cancelled" | "failed" | "pending";

export const resolveMollieOrderOutcome = (status: MolliePaymentStatus): MollieOrderOutcome => {
  if (status === "paid") return "processing";
  if (status === "canceled") return "cancelled";
  if (status === "failed" || status === "expired") return "failed";
  return "pending";
};

export const isTerminalMollieOutcome = (outcome: MollieOrderOutcome) => outcome !== "pending";
