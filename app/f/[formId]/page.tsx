'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  is_required: boolean;
  options: string[] | null;
  mapping: string;
  sort_order: number;
}

interface BrandTheme {
  colors: {
    primary: string;
    darkBase: string;
    accent: string;
    light: string;
    neutral: string;
  };
  fonts: {
    heading: string;
    body: string;
    headingWeight: string;
    bodyWeight: string;
  };
  googleFontsUrl: string;
}

interface PublicFormData {
  id: string;
  name: string;
  description: string | null;
  submit_button_text: string;
  success_message: string;
  fields: FormField[];
  theme: BrandTheme | null;
}

// Default SkaleFlow theme
const DEFAULT_THEME: BrandTheme = {
  colors: {
    primary: '#1E6B63',
    darkBase: '#0F1F1D',
    accent: '#C8A86E',
    light: '#F0ECE4',
    neutral: '#7A756D',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    headingWeight: '700',
    bodyWeight: '400',
  },
  googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
};

export default function PublicFormPage() {
  const params = useParams();
  const formSlug = params.formId as string;

  const [form, setForm] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await fetch(`/api/forms/${formSlug}`);
        if (res.ok) {
          const data = await res.json();
          setForm(data);
          // Initialize values
          const initial: Record<string, string> = {};
          for (const field of data.fields) {
            initial[field.id] = field.field_type === 'checkbox' ? '' : '';
          }
          setValues(initial);
        } else {
          setError('Form not found');
        }
      } catch {
        setError('Failed to load form');
      }
      setLoading(false);
    };
    loadForm();
  }, [formSlug]);

  const theme = form?.theme || DEFAULT_THEME;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Client-side validation
    for (const field of form.fields) {
      if (field.is_required) {
        const val = values[field.id];
        if (!val || val.trim() === '') {
          setSubmitError(`${field.label} is required`);
          return;
        }
      }
      // Email format validation
      if (field.field_type === 'email' && values[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values[field.id])) {
          setSubmitError(`Please enter a valid email address`);
          return;
        }
      }
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/forms/${formSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to submit form');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.light }}>
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0ECE4' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Not Found</h1>
          <p className="text-gray-600">This form may have been removed or is not published.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Google Fonts */}
      {theme.googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={theme.googleFontsUrl} />
      )}

      <div
        className="min-h-screen py-8 px-4"
        style={{
          backgroundColor: theme.colors.light,
          fontFamily: `"${theme.fonts.body}", sans-serif`,
        }}
      >
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div
              className="rounded-2xl p-8 text-center shadow-sm"
              style={{ backgroundColor: '#fff' }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${theme.colors.primary}15` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme.colors.primary} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{
                  color: theme.colors.darkBase,
                  fontFamily: `"${theme.fonts.heading}", sans-serif`,
                  fontWeight: theme.fonts.headingWeight,
                }}
              >
                Submitted!
              </h2>
              <p style={{ color: theme.colors.neutral }}>{form.success_message}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-8 shadow-sm"
              style={{ backgroundColor: '#fff' }}
            >
              {form.name && (
                <h1
                  className="text-2xl mb-2"
                  style={{
                    color: theme.colors.darkBase,
                    fontFamily: `"${theme.fonts.heading}", sans-serif`,
                    fontWeight: theme.fonts.headingWeight,
                  }}
                >
                  {form.name}
                </h1>
              )}
              {form.description && (
                <p className="mb-6" style={{ color: theme.colors.neutral, fontSize: '0.95rem' }}>
                  {form.description}
                </p>
              )}

              <div className="space-y-5">
                {form.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.colors.darkBase }}
                    >
                      {field.label}
                      {field.is_required && (
                        <span style={{ color: '#ef4444' }} className="ml-0.5">*</span>
                      )}
                    </label>

                    {field.field_type === 'textarea' ? (
                      <textarea
                        value={values[field.id] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || ''}
                        rows={4}
                        className="w-full px-4 py-2.5 text-sm rounded-lg transition-colors"
                        style={{
                          border: `1px solid ${theme.colors.neutral}40`,
                          outline: 'none',
                          color: theme.colors.darkBase,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}15`; }}
                        onBlur={(e) => { e.target.style.borderColor = `${theme.colors.neutral}40`; e.target.style.boxShadow = 'none'; }}
                      />
                    ) : field.field_type === 'select' ? (
                      <select
                        value={values[field.id] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        className="w-full px-4 py-2.5 text-sm rounded-lg bg-white transition-colors"
                        style={{
                          border: `1px solid ${theme.colors.neutral}40`,
                          outline: 'none',
                          color: theme.colors.darkBase,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.primary; }}
                        onBlur={(e) => { e.target.style.borderColor = `${theme.colors.neutral}40`; }}
                      >
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.field_type === 'checkbox' ? (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={values[field.id] === 'true'}
                          onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.checked ? 'true' : '' }))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: theme.colors.primary }}
                        />
                        <span className="text-sm" style={{ color: theme.colors.darkBase }}>
                          {field.placeholder || field.label}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={field.field_type === 'phone' ? 'tel' : field.field_type}
                        value={values[field.id] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || ''}
                        className="w-full px-4 py-2.5 text-sm rounded-lg transition-colors"
                        style={{
                          border: `1px solid ${theme.colors.neutral}40`,
                          outline: 'none',
                          color: theme.colors.darkBase,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}15`; }}
                        onBlur={(e) => { e.target.style.borderColor = `${theme.colors.neutral}40`; e.target.style.boxShadow = 'none'; }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 px-4 py-3 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
              >
                {submitting ? 'Submitting...' : form.submit_button_text}
              </button>
            </form>
          )}

          {/* Powered by */}
          <p className="text-center mt-6 text-xs" style={{ color: theme.colors.neutral }}>
            Powered by SkaleFlow
          </p>
        </div>
      </div>
    </>
  );
}
