import { ApplicationEntry } from '../storage/types';

/**
 * Fetches trimmed textContent for a selector when available.
 */
function textContent(selector: string, root: Document): string | undefined {
  const element = root.querySelector<HTMLElement>(selector);
  const text = element?.textContent?.trim();
  return text || undefined;
}

/**
 * Attempts to pull a reasonable job description block from common DOM regions.
 */
function guessJobDescription(root: Document): string | undefined {
  const selectors = [
    '[class*="description" i]',
    '[class*="job-desc" i]',
    '[data-testid*="description" i]'
  ];
  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) {
      return element.innerText.trim();
    }
  }
  const paragraphs = Array.from(root.querySelectorAll('p'))
    .map((p) => p.innerText.trim())
    .filter(Boolean)
    .slice(0, 8);
  return paragraphs.join('\n\n') || undefined;
}

/**
 * Tries to guess the company name based on semantic selectors.
 */
function guessCompany(root: Document): string | undefined {
  const selectors = [
    '[data-company-name]',
    '[class*="company" i]',
    'h3'
  ];
  for (const selector of selectors) {
    const text = textContent(selector, root);
    if (text) {
      return text;
    }
  }
  return undefined;
}

/**
 * Attempts to infer the job title from headings or data attributes.
 */
function guessJobTitle(root: Document): string | undefined {
  const selectors = [
    'h1',
    '[class*="title" i]',
    '[data-testid*="jobTitle" i]'
  ];
  for (const selector of selectors) {
    const text = textContent(selector, root);
    if (text) {
      return text;
    }
  }
  return undefined;
}

/**
 * Attempts to infer the job location using class and meta tags.
 */
function guessLocation(root: Document): string | undefined {
  const selectors = [
    '[class*="location" i]',
    '[data-testid*="location" i]'
  ];
  for (const selector of selectors) {
    const text = textContent(selector, root);
    if (text) {
      return text;
    }
  }
  const metaLocation = root.querySelector('meta[property="jobLocation"]')?.getAttribute('content');
  return metaLocation || undefined;
}

/**
 * Extracts a best-effort job posting summary from a job details DOM document.
 */
export function extractJobPostingFromDom(document: Document): Partial<ApplicationEntry> {
  const jobTitle = guessJobTitle(document);
  const company = guessCompany(document);
  const location = guessLocation(document);
  const jobDescription = guessJobDescription(document);

  const postingUrl = document.location?.href;

  return {
    jobTitle,
    company,
    location,
    jobDescription,
    postingUrl
  };
}
