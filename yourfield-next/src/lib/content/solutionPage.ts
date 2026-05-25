export type SolutionPageSource = Readonly<{
  features: readonly string[];
  href: string;
  id: string;
  image: string;
  order: number;
  productTags: readonly string[];
  summary: string;
  title: string;
}>;

export type SolutionDetailCard = Readonly<{
  features: readonly string[];
  id: string;
  image: string;
  imageAlt: string;
  productTags: readonly string[];
  text: string;
  title: string;
}>;

export type SolutionsPageSections = Readonly<{
  detailCards: readonly SolutionDetailCard[];
  isEmpty: boolean;
}>;

function sortSolutions(solutions: readonly SolutionPageSource[]) {
  return [...solutions].sort(
    (left, right) =>
      left.order - right.order || left.title.localeCompare(right.title, 'zh-Hans-CN'),
  );
}

function toDetailCard(solution: SolutionPageSource): SolutionDetailCard {
  return {
    features: solution.features,
    id: solution.id,
    image: solution.image,
    imageAlt: solution.title,
    productTags: solution.productTags,
    text: solution.summary,
    title: solution.title,
  };
}

export function buildSolutionsPageSections(
  solutions: readonly SolutionPageSource[],
): SolutionsPageSections {
  const sortedSolutions = sortSolutions(solutions);

  return {
    detailCards: sortedSolutions.map(toDetailCard),
    isEmpty: sortedSolutions.length === 0,
  };
}
