export const MARKETPLACE_FEE_PERCENT = 10;

export function marketplaceFeeCents(totalCents: number) {
  return Math.round(totalCents * MARKETPLACE_FEE_PERCENT / 100);
}

export function partnerNetCents(totalCents: number) {
  return totalCents - marketplaceFeeCents(totalCents);
}
