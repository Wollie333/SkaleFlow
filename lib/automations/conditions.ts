import { StepConfig } from './types';

interface ContactData {
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  value_cents: number;
  custom_fields: Record<string, unknown>;
  [key: string]: unknown;
}

export function evaluateCondition(config: StepConfig, contact: ContactData): boolean {
  const { field, operator, value } = config;
  if (!field || !operator) return false;

  let fieldValue: unknown;

  if (field.startsWith('custom_fields.')) {
    const customKey = field.replace('custom_fields.', '');
    fieldValue = contact.custom_fields?.[customKey];
  } else {
    fieldValue = contact[field];
  }

  const strValue = String(fieldValue ?? '');
  const compareValue = value ?? '';

  switch (operator) {
    case 'equals':
      return strValue === compareValue;
    case 'not_equals':
      return strValue !== compareValue;
    case 'contains':
      return strValue.toLowerCase().includes(compareValue.toLowerCase());
    case 'not_contains':
      return !strValue.toLowerCase().includes(compareValue.toLowerCase());
    case 'is_empty':
      return !fieldValue || strValue === '';
    case 'is_not_empty':
      return !!fieldValue && strValue !== '';
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);
    case 'less_than':
      return Number(fieldValue) < Number(compareValue);
    default:
      return false;
  }
}
