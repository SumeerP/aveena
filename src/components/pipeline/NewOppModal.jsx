import React, { useState, useMemo } from 'react';
import { Btn, Field, inputCls } from '../common/ui.jsx';
import { BUSINESS_TYPES, PRODUCT_CATEGORIES } from '../../constants/products.js';

export function NewOppModal({ me, dispatch, onClose, opps }) {
  const [f, setF] = useState({
    customer: "", contactName: "", contactEmail: "", product: "",
    businessType: BUSINESS_TYPES[0], category: PRODUCT_CATEGORIES[0], estVolume: "", leadSource: "",
  });
  const [existing, setExisting] = useState("");
  // Unique customers from every prior workflow — repeat business starts here.
  const knownCustomers = useMemo(() => {
    const seen = {};
    (opps || []).forEach((o) => {
      const k = o.contact.email.toLowerCase();
      if (!seen[k]) seen[k] = { customer: o.customer, contactName: o.contact.name, contactEmail: o.contact.email, count: 0 };
      seen[k].count += 1;
    });
    return Object.values(seen).sort((a, b) => a.customer.localeCompare(b.customer));
  }, [opps]);
  const ok = f.customer && f.contactName && f.product;
  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="font-serif text-xl text-stone-900">New opportunity</h2>
        <p className="text-sm text-stone-500 mb-4">
          Creates an opportunity ID the moment a customer is identified — or starts a new sample cycle for an
          existing customer.
        </p>
        <div className="space-y-3">
          <Field label="Customer">
            <select
              className={inputCls}
              value={existing}
              onChange={(e) => {
                const v = e.target.value;
                setExisting(v);
                if (v) {
                  const c = knownCustomers.find((k) => k.contactEmail === v);
                  if (c) setF({ ...f, customer: c.customer, contactName: c.contactName, contactEmail: c.contactEmail });
                } else {
                  setF({ ...f, customer: "", contactName: "", contactEmail: "" });
                }
              }}
            >
              <option value="">— New customer —</option>
              {knownCustomers.map((c) => (
                <option key={c.contactEmail} value={c.contactEmail}>
                  {c.customer} · {c.contactName} ({c.count} workflow{c.count > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </Field>
          {existing && (
            <div className="text-xs text-red-900 bg-red-50 border border-red-100 rounded px-3 py-2">
              Returning customer — this starts a new, independent sample cycle. Their previous workflows and history
              stay linked on the customer record.
            </div>
          )}
          <Field label="Customer / company"><input className={inputCls} value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} /></Field>
          <Field label="Contact name"><input className={inputCls} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
          <Field label="Contact email"><input className={inputCls} value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label="Product interest"><input className={inputCls} value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} placeholder="e.g. private-label whoopie pie" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business type">
              <select className={inputCls} value={f.businessType} onChange={(e) => setF({ ...f, businessType: e.target.value })}>
                {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Product category">
              <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Est. volume">
              <input className={inputCls} value={f.estVolume} onChange={(e) => setF({ ...f, estVolume: e.target.value })} placeholder="e.g. 4,000 units/mo" />
            </Field>
            <Field label="Lead source">
              <input className={inputCls} value={f.leadSource} onChange={(e) => setF({ ...f, leadSource: e.target.value })} placeholder="e.g. IBIE expo, referral" />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn tone="ghost" onClick={onClose}>Cancel</Btn>
          <Btn tone="accent" disabled={!ok} onClick={() => { dispatch({ type: "CREATE_OPP", payload: { ...f, profile: { businessType: f.businessType, category: f.category, estVolume: f.estVolume, leadSource: f.leadSource }, by: me.id } }); onClose(); }}>
            Create opportunity ID
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pipeline list ---------- */
