import { UserProfile, composeFullName } from '../storage/types';

export type FieldIdentifier =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'postalCode'
  | 'linkedinUrl'
  | 'githubUrl'
  | 'websiteUrl';

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  field: FieldIdentifier;
  score: number;
}

const FIELD_PATTERNS: Array<{ field: FieldIdentifier; patterns: RegExp[] }> = [
  { field: 'firstName', patterns: [/first.?name/i, /given/i] },
  { field: 'lastName', patterns: [/last.?name/i, /family/i, /surname/i] },
  { field: 'fullName', patterns: [/name/i, /full.?name/i, /applicant/i] },
  { field: 'email', patterns: [/email/i, /e-mail/i] },
  { field: 'phone', patterns: [/phone/i, /mobile/i, /tel/i] },
  { field: 'address', patterns: [/address/i, /street/i] },
  { field: 'city', patterns: [/city/i, /town/i] },
  { field: 'postalCode', patterns: [/postal/i, /zip/i] },
  { field: 'linkedinUrl', patterns: [/linkedin/i] },
  { field: 'githubUrl', patterns: [/github/i] },
  { field: 'websiteUrl', patterns: [/portfolio/i, /website/i, /url/i] }
];

/**
 * Scores a potential field based on how well its attributes match the supplied patterns.
 */
function computeScore(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, patterns: RegExp[]): number {
  const attributes = [field.name, field.id, field.getAttribute('aria-label')].filter(Boolean) as string[];
  if ('placeholder' in field && field.placeholder) {
    attributes.push(field.placeholder);
  }
  const labelText = getLabelText(field);
  if (labelText) {
    attributes.push(labelText);
  }
  return attributes.reduce((score, attr) => {
    for (const pattern of patterns) {
      if (pattern.test(attr)) {
        return score + 1;
      }
    }
    return score;
  }, 0);
}

/**
 * Attempts to resolve a friendly label string for the given form element.
 */
function getLabelText(field: Element): string | undefined {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    if (field.labels && field.labels.length > 0) {
      return Array.from(field.labels)
        .map((label) => label.innerText.trim())
        .filter(Boolean)
        .join(' ');
    }
  }
  const id = field.getAttribute('id');
  if (!id) {
    return undefined;
  }
  const label = field.ownerDocument.querySelector(`label[for="${id}"]`);
  return label?.textContent?.trim() || undefined;
}

/**
 * Detects likely job application form fields using heuristic pattern matching.
 */
export function findFormFields(document: Document): DetectedField[] {
  const fields = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')
  ).filter((element) => !element.disabled && element.type !== 'hidden');

  const detected: DetectedField[] = [];

  for (const field of fields) {
    for (const { field: fieldName, patterns } of FIELD_PATTERNS) {
      const score = computeScore(field, patterns);
      if (score > 0) {
        detected.push({ element: field, field: fieldName, score });
      }
    }
  }

  detected.sort((a, b) => b.score - a.score);
  return detected;
}

/**
 * Resolves the string value that should be injected for a detected field.
 */
export function getValueForField(profile: UserProfile, field: FieldIdentifier): string | undefined {
  if (field === 'fullName') {
    return composeFullName(profile);
  }
  const value = profile[field as keyof UserProfile];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? undefined;
}
