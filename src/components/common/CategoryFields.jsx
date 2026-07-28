import React from 'react';
import { Field, inputCls } from './ui.jsx';
import { CATEGORY_FIELDS } from '../../constants/products.js';

export function CategoryFields({ category, values, onChange }) {
  const fields = category && CATEGORY_FIELDS[category];
  if (!fields) return null;
  return (
    <div className="mt-3 pt-3 border-t border-red-100">
      <div className="text-xs font-medium uppercase tracking-wider text-red-900 mb-2">{category} — product-specific</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "select" ? (
              <select className={inputCls} value={values[f.key] || ""} onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}>
                <option value="">— select —</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className={inputCls} value={values[f.key] || ""} onChange={(e) => onChange({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} />
            )}
          </Field>
        ))}
      </div>
    </div>
  );
}
