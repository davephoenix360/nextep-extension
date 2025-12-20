/**
 * Heuristic DOM extraction for a job posting page.
 * Works "best-effort" across common job boards.
 */
export function extractJobPostingFromDom(doc: Document) {
  const title =
    pickText(doc, [
      'h1[data-testid="job-title"]',
      'h1',
      '[data-testid="jobTitle"]',
      '[class*="jobsearch-JobInfoHeader-title"]',
      '[class*="jobTitle"]'
    ]) || documentTitleFallback(doc);

  const company =
    pickText(doc, [
      '[data-testid="company-name"]',
      '[class*="jobsearch-CompanyInfoContainer"] a',
      '[class*="jobsearch-CompanyInfoContainer"]',
      '[class*="companyName"]',
      'a[href*="company"]'
    ]) || "";

  const description =
    pickText(doc, [
      '#jobDescriptionText',
      '[data-testid="jobDescriptionText"]',
      '[class*="jobsearch-jobDescriptionText"]',
      'article',
      'main'
    ]) || "";

  return {
    jobTitle: title?.trim() ?? "",
    company: company?.trim() ?? "",
    jobDescription: normalizeWhitespace(description),
  };
}

function pickText(doc: Document, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const txt = el?.textContent?.trim();
    if (txt && txt.length > 0) return txt;
  }
  return null;
}

function documentTitleFallback(doc: Document): string {
  const raw = doc.title ?? "";
  return raw.replace(/\s*[-|•].*$/, "").trim();
}

function normalizeWhitespace(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim();
}
