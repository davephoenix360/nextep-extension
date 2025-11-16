import { findFormFields, getValueForField, FieldIdentifier } from './fieldDetection';
import { UserProfile } from '../storage/types';

export interface AutofillResult {
  filledFields: Array<{ field: FieldIdentifier; value: string }>;
  skippedFields: FieldIdentifier[];
}

/**
 * Ensures a shared highlight style is injected so autofilled fields are visually obvious.
 */
function ensureHighlightStyle(document: Document) {
  const existing = document.getElementById('nextep-autofill-style');
  if (existing) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'nextep-autofill-style';
  style.textContent = `
    .nextep-autofill-highlight {
      outline: 2px solid #2563eb;
      transition: outline 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Applies a value to any supported form field type and dispatches appropriate events.
 */
function applyValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'select') {
    const option = Array.from((element as HTMLSelectElement).options).find(
      (opt) => opt.value === value || opt.text === value
    );
    if (option) {
      (element as HTMLSelectElement).value = option.value;
    } else {
      (element as HTMLSelectElement).value = value;
    }
  } else {
    (element as HTMLInputElement | HTMLTextAreaElement).value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Performs autofill across the detected fields using the stored user profile data.
 */
export function autofillForm(document: Document, profile: UserProfile): AutofillResult {
  ensureHighlightStyle(document);
  const detected = findFormFields(document);
  const filledFields: Array<{ field: FieldIdentifier; value: string }> = [];
  const skippedFields: FieldIdentifier[] = [];

  detected.forEach(({ element, field }) => {
    const value = getValueForField(profile, field);
    if (!value) {
      skippedFields.push(field);
      return;
    }
    element.classList.add('nextep-autofill-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    applyValue(element, value);
    filledFields.push({ field, value });
    setTimeout(() => element.classList.remove('nextep-autofill-highlight'), 1000);
  });

  return { filledFields, skippedFields };
}
