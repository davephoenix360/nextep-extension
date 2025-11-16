import { ApplicationEntry, UserProfile, composeFullName } from '../storage/types';

export interface TailoredResumeMetadata {
  id: string;
  applicationEntryId: string;
  generatedAt: string;
  latexSource?: string;
  pdfUrl?: string;
}

/**
 * Generates a pseudo-random metadata identifier for tailored resume artifacts.
 */
function generateMetadataId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Returns placeholder LaTeX content representing a tailored resume for the entry.
 */
export async function generateTailoredResumeLatex(
  userProfile: UserProfile,
  generalResumeText: string,
  application: ApplicationEntry
): Promise<string> {
  // TODO: integrate with actual AI backend (e.g., OpenAI) that generates LaTeX.
  // For now, return a placeholder LaTeX document string.
  return `\\documentclass{article}
\\begin{document}
% Nextep Apply placeholder tailored resume
\\section*{${composeFullName(userProfile) || 'Candidate'}}
\\subsection*{Target Role: ${application.jobTitle}}
This is a placeholder resume generated for ${application.company}.\\
\\subsection*{Profile}
${generalResumeText || 'General resume content placeholder.'}
\\end{document}`;
}

/**
 * Pretends to compile LaTeX into PDF output and returns stub metadata.
 */
export async function compileLatexToPdf(latexSource: string, applicationEntryId?: string): Promise<TailoredResumeMetadata> {
  // TODO: integrate with a LaTeX compilation backend.
  // For now, pretend compilation succeeded and return stub metadata.
  return {
    id: generateMetadataId(),
    applicationEntryId: applicationEntryId ?? 'unknown',
    generatedAt: new Date().toISOString(),
    latexSource,
    pdfUrl: 'data:application/pdf;base64,'
  };
}
