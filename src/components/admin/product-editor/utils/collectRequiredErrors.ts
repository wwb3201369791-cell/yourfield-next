import type { FormState as Fields } from 'payload';

export type RequiredError = Readonly<{
  label: string;
  path: string;
  section: string;
}>;

const sectionByPath: Array<readonly [RegExp, string]> = [
  [/^(name|model|description|images)/, 'hero'],
  [/^(materials|features|applications)/, 'intro'],
  [/^sellingPoints/, 'selling-points'],
  [/^specifications/, 'specifications'],
  [/^sizeGuide/, 'size-guide'],
  [/^scenarios/, 'scenarios'],
  [/^visualGroups/, 'visual-groups'],
  [/^(qualityEvidence|certifications)/, 'evidence'],
  [/^careInstructions/, 'care'],
  [/^(productFaqs|faqs)/, 'faq'],
];

export function sectionForFieldPath(path: string) {
  return sectionByPath.find(([pattern]) => pattern.test(path))?.[1] ?? 'identity';
}

export function collectRequiredErrors(fields: Fields): RequiredError[] {
  return Object.entries(fields)
    .filter(([, field]) => field?.valid === false)
    .map(([path, field]) => ({
      label: field?.errorMessage ?? path,
      path,
      section: sectionForFieldPath(path),
    }));
}
