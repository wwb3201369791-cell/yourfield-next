export type ProductDetailNavCandidate = Readonly<{
  id: string;
  label: string;
  show: boolean;
}>;

export type ProductDetailNavItem = Readonly<{
  id: string;
  label: string;
}>;

export function buildProductDetailNavItems(
  candidates: readonly ProductDetailNavCandidate[],
): ProductDetailNavItem[] {
  return candidates
    .filter((candidate) => candidate.show && candidate.id.trim() && candidate.label.trim())
    .map((candidate) => ({
      id: candidate.id.trim(),
      label: candidate.label.trim(),
    }));
}
