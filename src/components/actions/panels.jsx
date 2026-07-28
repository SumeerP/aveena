import React, { useState, useMemo } from 'react';
import { Panel, Btn, Field, inputCls, CheckGroup, AutofillHint, Badge } from '../common/ui.jsx';
import { CategoryFields } from '../common/CategoryFields.jsx';
import {
  ALLERGENS, CERTIFICATIONS, STORAGE_TEMPS, STABILITY_CHECKS,
  PROTOCOL_ATTESTATIONS, PROCESS_OPTIONS, CATEGORY_OPTIONS,
} from '../../constants/products.js';
import { STAGES, stageIndex } from '../../constants/stages.js';
import { RETURN_TARGETS } from '../../domain/workflow.js';
import { ROLES } from '../../constants/roles.js';
import { userName } from '../../domain/users.js';
import { now, fmtDate } from '../../domain/dates.js';
import {
  deriveDiscoveryContext, matchStorageTemp, resolveCategory,
  deriveCategoryDefaults, getShipments,
} from '../../domain/autofill.js';

export function DiscoveryActions({ opp, me, dispatch }) {
  const [note, setNote] = useState("");
  const [withForm, setWithForm] = useState(false);
  if (me.role !== "sales_poc" || opp.stage !== "discovery") return null;
  return (
    <Panel title="Discovery actions" hint="Owner: Sales POC">
      <Field label="Log a conversation">
        <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did the customer say?" />
      </Field>
      <div className="flex gap-2 mt-2">
        <Btn small tone="ghost" disabled={!note.trim()} onClick={() => { dispatch({ type: "ADD_CONVERSATION", payload: { id: opp.id, by: me.id, note } }); setNote(""); }}>
          Save note
        </Btn>
      </div>
      <div className="mt-4 pt-4 border-t border-stone-200">
        <label className="flex items-center gap-2 text-sm text-stone-700 mb-2">
          <input type="checkbox" checked={withForm} onChange={(e) => setWithForm(e.target.checked)} className="accent-red-700" />
          Also push to Formulations team simultaneously
        </label>
        <Btn tone="accent" onClick={() => dispatch({ type: "SEND_TO_SAMPLE_REQUEST", payload: { id: opp.id, by: me.id, withFormulations: withForm } })}>
          Customer wants a sample → send to Sample Request
        </Btn>
      </div>
    </Panel>
  );
}

export function SampleRequestActions({ opp, me, dispatch }) {
  const sr = opp.sampleRequest;
  const ctx = useMemo(() => deriveDiscoveryContext(opp), [opp.id]);
  const [form, setForm] = useState(() =>
    sr
      ? {
          qty: sr.qty || "",
          unitSize: sr.unitSize || sr.format || "",
          packFormat: sr.packFormat || "",
          allergens: Array.isArray(sr.allergens) ? sr.allergens : [],
          certifications: sr.certifications || [],
          shelfLife: sr.shelfLife || "",
          storage: sr.storage || STORAGE_TEMPS[0],
          needBy: sr.needBy || "",
          notes: sr.notes || "",
          categoryDetails: sr.categoryDetails || {},
        }
      : {
          qty: "",
          unitSize: ctx.unitSize,
          packFormat: ctx.packFormat,
          allergens: ctx.allergens,
          certifications: ctx.certifications,
          shelfLife: ctx.shelfLife,
          storage: ctx.storage || STORAGE_TEMPS[0],
          needBy: "",
          notes: ctx.notes.join("; "),
          categoryDetails: deriveCategoryDefaults(resolveCategory(opp), opp),
        }
  );
  if (me.role !== "sample_request" || opp.stage !== "sample_request") return null;
  const revising = !!sr;
  const category = resolveCategory(opp);
  const prefilled = revising
    ? []
    : [
        ctx.allergens.length && "allergens",
        ctx.certifications.length && "certifications",
        ctx.storage && "storage",
        ctx.shelfLife && "shelf life",
        ctx.unitSize && "unit size",
        ctx.packFormat && "pack format",
        ctx.notes.length && "notes",
      ].filter(Boolean);
  const ok = form.qty && form.unitSize && form.packFormat;
  return (
    <Panel title={revising ? "Revise sample request form" : "Sample request form"} hint="Owner: Sample Request team">
      <AutofillHint fields={prefilled} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Sample quantity *"><input className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="e.g. 2 dozen / 24 units" /></Field>
        <Field label="Unit size / net weight *"><input className={inputCls} value={form.unitSize} onChange={(e) => setForm({ ...form, unitSize: e.target.value })} placeholder="e.g. 85 g cookie, 4 oz whoopie pie" /></Field>
        <Field label="Pack format *"><input className={inputCls} value={form.packFormat} onChange={(e) => setForm({ ...form, packFormat: e.target.value })} placeholder="e.g. individually wrapped, 12-ct tray" /></Field>
        <Field label="Target shelf life"><input className={inputCls} value={form.shelfLife} onChange={(e) => setForm({ ...form, shelfLife: e.target.value })} placeholder="e.g. 21 days ambient" /></Field>
        <Field label="Storage / distribution">
          <select className={inputCls} value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })}>
            {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Sample needed by"><input className={inputCls} type="date" value={form.needBy} onChange={(e) => setForm({ ...form, needBy: e.target.value })} /></Field>
      </div>
      <div className="mt-3">
        <Field label="Allergens present">
          <CheckGroup options={ALLERGENS} value={form.allergens} onChange={(v) => setForm({ ...form, allergens: v })} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Certifications required">
          <CheckGroup options={CERTIFICATIONS} value={form.certifications} onChange={(v) => setForm({ ...form, certifications: v })} />
        </Field>
      </div>
      <CategoryFields category={category} values={form.categoryDetails || {}} onChange={(v) => setForm({ ...form, categoryDetails: v })} />
      <div className="mt-3">
        <Field label="Notes for Sample Creation"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. customer prefers visible inclusions, less sweet" /></Field>
      </div>
      <div className="mt-3">
        <Btn tone="accent" disabled={!ok} onClick={() => dispatch({ type: "SUBMIT_SAMPLE_REQUEST_FORM", payload: { id: opp.id, by: me.id, form } })}>
          {revising ? "Resubmit → push to Sample Creation" : "Submit → push to Sample Creation"}
        </Btn>
      </div>
    </Panel>
  );
}

export function FormulationActions({ opp, me, dispatch }) {
  const [notes, setNotes] = useState("");
  const [askInfo, setAskInfo] = useState(false);
  const [det, setDet] = useState({ baseRef: "", bakeTempTime: "", aw: "", ph: "", stability: [] });
  if (me.role !== "formulations" || !opp.formulations.requested) return null;
  if (opp.formulations.status === "blocked")
    return (
      <Panel title="Formulation work — blocked" hint="Waiting on opportunity owner">
        <div className="text-sm text-stone-700">
          Info requested: <span className="text-stone-900">{opp.formulations.infoRequest}</span>
        </div>
      </Panel>
    );
  if (opp.formulations.status !== "pending") return null;
  return (
    <Panel title="Formulation work" hint="Pushed simultaneously with sample request">
      {opp.formulations.infoResponse && (
        <div className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded p-2 mb-2">
          Info from owner: {opp.formulations.infoResponse}
        </div>
      )}
      {!askInfo ? (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Base formulation ref"><input className={inputCls} value={det.baseRef} onChange={(e) => setDet({ ...det, baseRef: e.target.value })} placeholder="e.g. F-CKY-114 rev C" /></Field>
            <Field label="Bake temp / time"><input className={inputCls} value={det.bakeTempTime} onChange={(e) => setDet({ ...det, bakeTempTime: e.target.value })} placeholder="e.g. 340°F · 14 min convection" /></Field>
            <Field label="Water activity (aw)"><input className={inputCls} value={det.aw} onChange={(e) => setDet({ ...det, aw: e.target.value })} placeholder="e.g. 0.62" /></Field>
            <Field label="pH"><input className={inputCls} value={det.ph} onChange={(e) => setDet({ ...det, ph: e.target.value })} placeholder="e.g. 6.8" /></Field>
          </div>
          <div className="mt-3">
            <Field label="Stability testing completed">
              <CheckGroup options={STABILITY_CHECKS} value={det.stability} onChange={(v) => setDet({ ...det, stability: v })} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Formulation notes *">
              <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Binder changes, inclusion ratio, mix time…" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn tone="accent" disabled={!notes.trim()} onClick={() => dispatch({ type: "COMPLETE_FORMULATION", payload: { id: opp.id, by: me.id, notes, details: det } })}>
              Mark formulation complete
            </Btn>
            <Btn tone="ghost" onClick={() => { setAskInfo(true); setNotes(""); }}>Missing info?</Btn>
          </div>
        </>
      ) : (
        <>
          <Field label="What's missing?">
            <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. target shelf life, allergen constraints…" />
          </Field>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn tone="danger" disabled={!notes.trim()} onClick={() => { dispatch({ type: "FORMULATION_NEEDS_INFO", payload: { id: opp.id, by: me.id, reason: notes } }); setNotes(""); setAskInfo(false); }}>
              Send back to owner for info
            </Btn>
            <Btn tone="ghost" onClick={() => { setAskInfo(false); setNotes(""); }}>Cancel</Btn>
          </div>
        </>
      )}
    </Panel>
  );
}

export function SampleCreationActions({ opp, me, dispatch }) {
  const [desc, setDesc] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [packFormat, setPackFormat] = useState("");
  if (me.role !== "sample_creation" || opp.stage !== "sample_creation" || opp.sampleFinalized) return null;
  const withCustomer = opp.samples.some((s) => s.status === "with_customer");
  const last = opp.samples[opp.samples.length - 1];
  const changes = last && last.status === "changes_requested" ? last : null;
  return (
    <Panel title="Create sample version" hint="Owner: Sample Creation team">
      {withCustomer ? (
        <div className="text-sm text-stone-600">
          Sample v{opp.samples.length} is with the customer. The Sales POC will send it back here with the customer's
          comments if changes are requested.
        </div>
      ) : (
        <>
          {changes && (
            <div className="text-sm bg-amber-100 border border-amber-300 rounded p-3 mb-3">
              <span className="font-medium text-amber-900">Customer requested changes on v{changes.version}</span>
              <span className="text-[11px] text-amber-800"> (via Sales POC)</span>
              <div className="text-stone-800 mt-1">{changes.feedback}</div>
            </div>
          )}
          <Field label={`Sample v${opp.samples.length + 1} description *`}>
            <textarea className={inputCls} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={changes ? "How this version addresses the requested changes…" : "What's in this version?"} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Field label="Bench batch code"><input className={inputCls} value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="e.g. BB-0718-03" /></Field>
            <Field label="Sample pack format"><input className={inputCls} value={packFormat} onChange={(e) => setPackFormat(e.target.value)} placeholder="e.g. 12-ct clamshell, dry ice" /></Field>
          </div>
          <div className="mt-3">
            <Btn tone="accent" disabled={!desc.trim()} onClick={() => { dispatch({ type: "ADD_SAMPLE_VERSION", payload: { id: opp.id, by: me.id, desc, batchCode, packFormat } }); setDesc(""); setBatchCode(""); setPackFormat(""); }}>
              Send v{opp.samples.length + 1} to customer → hand to Sales POC
            </Btn>
          </div>
        </>
      )}
    </Panel>
  );
}

export function PocSampleLoopActions({ opp, me, dispatch }) {
  const [fb, setFb] = useState("");
  if (me.role !== "sales_poc" || opp.stage !== "sample_creation") return null;
  const live = opp.samples.find((s) => s.status === "with_customer");
  return (
    <Panel title="Customer loop" hint="Owner: Sales POC">
      {live ? (
        <>
          <div className="text-sm text-stone-700 mb-2">
            Sample v{live.version} is with the customer — you own the customer conversation from here.
          </div>
          <Field label="Customer's requested changes">
            <textarea className={inputCls} rows={2} value={fb} onChange={(e) => setFb(e.target.value)} placeholder="e.g. less sweet, chewier crumb, smaller portion…" />
          </Field>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn small tone="ghost" disabled={!fb.trim()} onClick={() => { dispatch({ type: "RECORD_FEEDBACK", payload: { id: opp.id, by: me.id, version: live.version, feedback: fb } }); setFb(""); }}>
              Send changes → back to Sample Creation
            </Btn>
            <Btn small tone="green" onClick={() => dispatch({ type: "FINALIZE_SAMPLE", payload: { id: opp.id, by: me.id } })}>
              Customer approved — finalize sample
            </Btn>
          </div>
        </>
      ) : (
        <div className="text-sm text-stone-600">
          {opp.samples.length && opp.samples[opp.samples.length - 1].status === "changes_requested"
            ? `Changes on v${opp.samples.length} sent to Sample Creation — v${opp.samples.length + 1} will land back here when it ships.`
            : "No sample is currently with the customer."}
        </div>
      )}
      {opp.pricing.status === "not_requested" && opp.samples.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <div className="text-sm text-stone-700 mb-2">Conversation moving forward? Kick off pricing in parallel.</div>
          <Btn small onClick={() => dispatch({ type: "REQUEST_PRICING", payload: { id: opp.id, by: me.id } })}>
            Request pricing
          </Btn>
        </div>
      )}
    </Panel>
  );
}

export function PricingTeamActions({ opp, me, dispatch }) {
  const [base, setBase] = useState("");
  const [moq, setMoq] = useState("");
  const [basis, setBasis] = useState("per unit");
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");
  if (me.role !== "pricing" || opp.pricing.status !== "requested") return null;
  const v = parseFloat(base);
  return (
    <Panel title="Base pricing" hint="Owner: Pricing team">
      {!returning ? (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Base price (USD) *">
              <input className={inputCls} type="number" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} placeholder="1.42" />
            </Field>
            <Field label="Price basis">
              <select className={inputCls} value={basis} onChange={(e) => setBasis(e.target.value)}>
                <option>per unit</option>
                <option>per dozen</option>
                <option>per case</option>
              </select>
            </Field>
            <Field label="Minimum order qty">
              <input className={inputCls} value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="e.g. 500 units / 2 pallets" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn tone="accent" disabled={!(v > 0)} onClick={() => dispatch({ type: "SET_BASE_PRICE", payload: { id: opp.id, by: me.id, base: v, moq, basis } })}>
              Send base price to opportunity owner
            </Btn>
            <Btn tone="ghost" onClick={() => setReturning(true)}>Can't price — missing info</Btn>
          </div>
        </>
      ) : (
        <>
          <Field label="What's missing?">
            <textarea className={inputCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. volume commitment, packaging format, delivery frequency…" />
          </Field>
          <div className="flex gap-2 mt-3">
            <Btn tone="danger" disabled={!reason.trim()} onClick={() => dispatch({ type: "PRICING_RETURN", payload: { id: opp.id, by: me.id, reason } })}>
              Return to opportunity owner
            </Btn>
            <Btn tone="ghost" onClick={() => setReturning(false)}>Cancel</Btn>
          </div>
        </>
      )}
    </Panel>
  );
}

/* POC-side panels for parallel-track returns (pricing / formulations) */
export function PricingReturnedPanel({ opp, me, dispatch }) {
  if (me.role !== "sales_poc" || opp.pricing.status !== "returned") return null;
  return (
    <Panel title="Pricing returned" hint="Missing info">
      <div className="text-sm text-stone-700 mb-3">
        Pricing team ({userName(opp.pricing.returnedBy)}) couldn't price this yet:{" "}
        <span className="text-stone-900">{opp.pricing.returnReason}</span>
      </div>
      <div className="text-xs text-stone-500 mb-2">Add the missing details to the conversation log, then re-request.</div>
      <Btn small tone="accent" onClick={() => dispatch({ type: "REQUEST_PRICING", payload: { id: opp.id, by: me.id } })}>
        Re-request pricing
      </Btn>
    </Panel>
  );
}

export function FormulationInfoPanel({ opp, me, dispatch }) {
  const [note, setNote] = useState("");
  if (me.role !== "sales_poc" || opp.formulations.status !== "blocked") return null;
  return (
    <Panel title="Formulations needs info" hint="Blocking parallel track">
      <div className="text-sm text-stone-700 mb-2">
        {userName("u4")} asked: <span className="text-stone-900">{opp.formulations.infoRequest}</span>
      </div>
      <Field label="Provide the missing info">
        <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="mt-3">
        <Btn small tone="accent" disabled={!note.trim()} onClick={() => dispatch({ type: "FORMULATION_RESUME", payload: { id: opp.id, by: me.id, note } })}>
          Send info → resume formulation work
        </Btn>
      </div>
    </Panel>
  );
}

export function CommercialActions({ opp, me, dispatch }) {
  const [ship, setShip] = useState("");
  const [setup, setSetup] = useState("");
  const [units, setUnits] = useState("2000");
  const [po, setPo] = useState("");
  if (me.role !== "sales_poc") return null;
  const p = opp.pricing;

  if (opp.stage === "commercial" && p.status === "not_requested") {
    return (
      <Panel title="Pricing & PO" hint="Owner: Sales POC">
        <Btn tone="accent" onClick={() => dispatch({ type: "REQUEST_PRICING", payload: { id: opp.id, by: me.id } })}>Request pricing</Btn>
      </Panel>
    );
  }
  if (p.status === "requested" && (opp.stage === "commercial" || opp.stage === "sample_creation")) {
    return (
      <Panel title="Pricing & PO" hint="Waiting on Pricing team">
        <div className="text-sm text-stone-600">Base pricing requested {p.requestedAt ? fmtDate(p.requestedAt) : ""} — pending with June Castellanos.</div>
      </Panel>
    );
  }
  if (p.status === "base_set") {
    const s = parseFloat(ship) || 0;
    const su = parseFloat(setup) || 0;
    const u = parseInt(units, 10) || 0;
    const total = Math.round(p.base * u + s + su);
    return (
      <Panel title="Build invoice" hint="Base + your add-ons">
        <div className="text-sm text-stone-700 mb-3">Base price from Pricing team: <span className="font-mono font-semibold">${p.base}/unit</span></div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Units (first order)"><input className={inputCls} type="number" value={units} onChange={(e) => setUnits(e.target.value)} /></Field>
          <Field label="Shipping charges ($)"><input className={inputCls} type="number" value={ship} onChange={(e) => setShip(e.target.value)} /></Field>
          <Field label="Setup / other ($)"><input className={inputCls} type="number" value={setup} onChange={(e) => setSetup(e.target.value)} /></Field>
        </div>
        <div className="mt-3 text-sm text-stone-800">Invoice total: <span className="font-mono font-semibold">${total.toLocaleString()}</span></div>
        <div className="mt-3">
          <Btn tone="accent" disabled={total <= 0} onClick={() =>
            dispatch({
              type: "SEND_INVOICE",
              payload: {
                id: opp.id, by: me.id, total,
                addons: [
                  ...(s ? [{ label: "Shipping charges", amount: s }] : []),
                  ...(su ? [{ label: "Setup / other", amount: su }] : []),
                ],
              },
            })
          }>
            Send invoice to customer
          </Btn>
        </div>
      </Panel>
    );
  }
  if (p.status === "invoiced") {
    return (
      <Panel title="Record purchase order" hint="After customer payment">
        <div className="text-sm text-stone-700 mb-2">Invoice for <span className="font-mono">${(p.invoiceTotal || 0).toLocaleString()}</span> sent {fmtDate(p.invoiceSentAt)}.</div>
        <Field label="Customer PO number">
          <input className={inputCls} value={po} onChange={(e) => setPo(e.target.value)} placeholder="PO-XX-0000" />
        </Field>
        <div className="mt-3">
          <Btn tone="green" disabled={!po.trim()} onClick={() => dispatch({ type: "RECORD_PO", payload: { id: opp.id, by: me.id, poNumber: po.trim() } })}>
            Record PO & payment
          </Btn>
        </div>
      </Panel>
    );
  }
  if (opp.stage === "commercial" && p.status === "po_received") {
    const wasReturned = !!opp.returnInfo;
    return (
      <Panel title={wasReturned ? "Resolve return & resume onboarding" : "Send to onboarding"} hint="Owner: Sales POC — you decide when it's ready">
        <div className="text-sm text-stone-700 mb-2">
          PO <span className="font-mono">{p.poNumber}</span> received {fmtDate(p.poReceivedAt)}, sample finalized.
          {wasReturned
            ? " Fix the issue flagged in the return, correct the PO if needed, then resume."
            : " Kick off onboarding when you deem the deal ready."}
        </div>
        <Field label="PO number">
          <input className={inputCls} value={po || p.poNumber || ""} onChange={(e) => setPo(e.target.value)} />
        </Field>
        <div className="mt-3">
          <Btn tone="green" onClick={() => dispatch({ type: "START_ONBOARDING", payload: { id: opp.id, by: me.id, poNumber: (po || p.poNumber || "").trim() } })}>
            {wasReturned ? "Resolved → resume onboarding" : "Start onboarding → Product Spec"}
          </Btn>
        </div>
      </Panel>
    );
  }
  return null;
}

export function SpecActions({ opp, me, dispatch }) {
  const ctx = useMemo(() => deriveDiscoveryContext(opp), [opp.id]);
  const sr = opp.sampleRequest || {};
  const specD = opp.onboarding.specDetails || {};
  const [mode, setMode] = useState(null); // null | 'internal' | 'customer'
  // Autofill priority: sample request form > discovery context. Always editable.
  const [det, setDet] = useState(() => ({
    ingredients: "",
    allergens: Array.isArray(sr.allergens) ? sr.allergens.join(", ") : sr.allergens || ctx.allergens.join(", "),
    shelfLife: sr.shelfLife || ctx.shelfLife || "",
    storage: sr.storage || ctx.storage || "",
    netWeight: sr.unitSize || ctx.unitSize || "",
    casePack: "",
    certifications: sr.certifications || ctx.certifications || [],
    categoryDetails: sr.categoryDetails || deriveCategoryDefaults(resolveCategory(opp), opp),
  }));
  const oppCategory = resolveCategory(opp);
  const specPrefilled = [
    det.allergens && "allergens",
    det.shelfLife && "shelf life",
    det.storage && "storage",
    det.netWeight && "net weight",
    (det.certifications || []).length && "certifications",
  ].filter(Boolean);
  const [doc, setDoc] = useState("");
  const [labelCode, setLabelCode] = useState("");
  const [proc, setProc] = useState(PROCESS_OPTIONS[1]);
  const [cat, setCat] = useState(CATEGORY_OPTIONS[0]);
  const [artRef, setArtRef] = useState("");
  // Lot sheet autofill: line from metadata match, temp from spec/sample request, dating from shelf life.
  const specShelf = specD.shelfLife || sr.shelfLife || ctx.shelfLife;
  const [lotLine, setLotLine] = useState(() =>
    opp.onboarding.metadata && PROCESS_OPTIONS.includes(opp.onboarding.metadata.process)
      ? opp.onboarding.metadata.process
      : PROCESS_OPTIONS[1]
  );
  const [lotBatch, setLotBatch] = useState("");
  const [lotDating, setLotDating] = useState(() => (specShelf ? `Best by = bake date + ${specShelf}` : ""));
  const [lotTemp, setLotTemp] = useState(
    () => matchStorageTemp(specD.storage || specD.distributionTemp || sr.storage || ctx.storage) || STORAGE_TEMPS[0]
  );
  const lotPrefilled = [
    opp.onboarding.metadata && "production line",
    specShelf && "dating rule",
    matchStorageTemp(specD.storage || specD.distributionTemp || sr.storage || ctx.storage) && "storage temp",
  ].filter(Boolean);
  if (me.role !== "product_spec" && me.role !== "spec_team") return null;

  if (opp.stage === "spec") {
    if (me.role !== "product_spec") return null;
    const ob = opp.onboarding;

    // Workflow A/B choice
    if (ob.specStatus === "not_started" || !ob.specStatus) {
      if (!mode)
        return (
          <Panel title="Product specification" hint="Choose a workflow">
            <div className="text-sm text-stone-700 mb-3">
              Build the spec for this {opp.product.toLowerCase().includes("cookie") ? "cookie" : "product"} from the
              conversations the Sales POC recorded during discovery, or have the customer fill the spec form and
              upload documents in their portal.
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => setMode("internal")}>Create internally from discovery</Btn>
              <Btn tone="ghost" onClick={() => setMode("customer")}>Request from customer</Btn>
            </div>
          </Panel>
        );
      if (mode === "internal") {
        const ok = det.ingredients && det.shelfLife;
        return (
          <Panel title="Internal spec — from discovery" hint="Workflow A">
            <AutofillHint fields={specPrefilled} />
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
              Recorded conversations ({userName(opp.createdBy)})
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded p-3 mb-3 max-h-36 overflow-y-auto space-y-1.5">
              {opp.conversations.length ? (
                opp.conversations.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-mono text-[11px] text-stone-400">{fmtDate(c.at)}</span>{" "}
                    <span className="text-stone-800">{c.note}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-stone-500">No conversations recorded — consider requesting the spec from the customer instead.</div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Key ingredients *"><input className={inputCls} value={det.ingredients} onChange={(e) => setDet({ ...det, ingredients: e.target.value })} placeholder="Oats, maple, butter…" /></Field>
              <Field label="Allergens"><input className={inputCls} value={det.allergens} onChange={(e) => setDet({ ...det, allergens: e.target.value })} placeholder="Wheat, dairy…" /></Field>
              <Field label="Net weight / unit size"><input className={inputCls} value={det.netWeight || ""} onChange={(e) => setDet({ ...det, netWeight: e.target.value })} placeholder="e.g. 85 g / 3 oz" /></Field>
              <Field label="Case pack"><input className={inputCls} value={det.casePack || ""} onChange={(e) => setDet({ ...det, casePack: e.target.value })} placeholder="e.g. 48 ct / 4 trays of 12" /></Field>
              <Field label="Target shelf life *"><input className={inputCls} value={det.shelfLife} onChange={(e) => setDet({ ...det, shelfLife: e.target.value })} placeholder="14 days ambient" /></Field>
              <Field label="Storage / handling"><input className={inputCls} value={det.storage} onChange={(e) => setDet({ ...det, storage: e.target.value })} placeholder="Ambient, sealed" /></Field>
            </div>
            <div className="mt-3">
              <Field label="Certifications required">
                <CheckGroup options={CERTIFICATIONS} value={det.certifications || []} onChange={(v) => setDet({ ...det, certifications: v })} />
              </Field>
            </div>
            <CategoryFields category={oppCategory} values={det.categoryDetails || {}} onChange={(v) => setDet({ ...det, categoryDetails: v })} />
            <div className="flex gap-2 mt-3">
              <Btn tone="accent" disabled={!ok} onClick={() => dispatch({ type: "SET_SPEC_INTERNAL", payload: { id: opp.id, by: me.id, details: det } })}>
                Save spec → proceed to metadata matching
              </Btn>
              <Btn tone="ghost" onClick={() => setMode(null)}>Back</Btn>
            </div>
          </Panel>
        );
      }
      // customer workflow — step 1: send request
      return (
        <Panel title="Customer spec — send request" hint="Workflow B, step 1 of 2">
          <div className="text-sm text-stone-700 mb-3">
            Opens the spec form and document upload in {opp.contact.name}'s customer portal and notifies them at{" "}
            {opp.contact.email}. The system handles follow-ups until they submit.
          </div>
          <div className="flex gap-2">
            <Btn tone="accent" onClick={() => dispatch({ type: "REQUEST_CUSTOMER_SPEC", payload: { id: opp.id, by: me.id } })}>
              Send spec form & upload request
            </Btn>
            <Btn tone="ghost" onClick={() => setMode(null)}>Back</Btn>
          </div>
        </Panel>
      );
    }

    // customer workflow — step 2: awaiting portal submission
    if (ob.specStatus === "awaiting_customer") {
      return (
        <Panel title="Customer spec — awaiting submission" hint="Workflow B, step 2 of 2">
          <div className="text-sm text-stone-700 mb-2">
            Request sent {ob.specRequestedAt ? fmtDate(ob.specRequestedAt) : ""}. The customer fills the form and
            uploads documents in their portal — it completes here automatically. If they send it by email instead,
            log it manually below.
          </div>
          <Field label="Received document reference (manual fallback)">
            <input className={inputCls} value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="e.g. harborview-spec-v1.pdf" />
          </Field>
          <div className="mt-3">
            <Btn tone="ghost" disabled={!doc.trim()} onClick={() => dispatch({ type: "RECEIVE_CUSTOMER_SPEC", payload: { id: opp.id, by: me.id, doc: doc.trim() } })}>
              Log manual submission
            </Btn>
          </div>
        </Panel>
      );
    }

    // spec complete → assemble the package: forms + formulation details + artwork
    const comps = ob.specComponents;
    if (comps && (comps.formulation.status === "pending" || comps.artwork.status === "pending")) {
      return (
        <Panel title="Spec package" hint="Forms · formulation · artwork">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-red-100 pb-2">
              <div>
                <div className="text-sm font-medium text-stone-900">Spec forms</div>
                <div className="text-xs text-stone-500">{ob.specSource === "internal" ? "Internal draft from discovery" : ob.specDoc}</div>
              </div>
              <Badge tone="green">complete</Badge>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-red-100 pb-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-stone-900">Formulation details</div>
                {comps.formulation.status === "complete" ? (
                  <div className="text-xs text-stone-600 truncate">{comps.formulation.note}</div>
                ) : (
                  <div className="text-xs text-stone-500">
                    In progress with the Formulations team ({userName("u4")}) — flows in automatically when complete.
                  </div>
                )}
              </div>
              <Badge tone={comps.formulation.status === "complete" ? "green" : "amber"}>
                {comps.formulation.status === "complete" ? "complete" : "pending"}
              </Badge>
            </div>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-stone-900">Artwork</div>
                <Badge tone={comps.artwork.status === "complete" ? "green" : "amber"}>{comps.artwork.status}</Badge>
              </div>
              {comps.artwork.status === "pending" && (
                <div className="mt-2">
                  <div className="flex gap-2">
                    <input className={inputCls} value={artRef} onChange={(e) => setArtRef(e.target.value)} placeholder="e.g. packaging-artwork-v1.ai" />
                    <Btn small disabled={!artRef.trim()} onClick={() => { dispatch({ type: "SET_ARTWORK", payload: { id: opp.id, by: me.id, ref: artRef.trim() } }); setArtRef(""); }}>
                      Attach
                    </Btn>
                    <Btn small tone="ghost" onClick={() => dispatch({ type: "DEFER_ARTWORK", payload: { id: opp.id, by: me.id } })}>
                      Defer — add later
                    </Btn>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">Artwork can be added later — deferring won't block onboarding.</div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      );
    }

    // package resolved → metadata matching
    return (
      <Panel title="Match spec to internal metadata" hint="Identify the production process">
        <div className="text-sm text-stone-700 mb-3">
          Spec complete ({ob.specSource === "internal" ? "internal draft" : "customer submission"}
          {ob.specDoc ? ` · ${ob.specDoc}` : ""}). Match it to the internal process and category that production will
          run under.
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Production process">
            <select className={inputCls} value={proc} onChange={(e) => setProc(e.target.value)}>
              {PROCESS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Metadata category">
            <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Btn tone="accent" onClick={() => dispatch({ type: "MAP_METADATA", payload: { id: opp.id, by: me.id, process: proc, category: cat } })}>
            Confirm match → proceed to lot sheet
          </Btn>
        </div>
      </Panel>
    );
  }
  if (opp.stage === "labeling" && me.role !== "spec_team") return null;
  if (opp.stage === "labeling") {
    return (
      <Panel title="Create lot sheet" hint="Then route to Senior Manager">
        <AutofillHint fields={lotPrefilled} />
        {opp.onboarding.approval.status === "returned" && (
          <div className="text-sm text-red-700 mb-2 bg-red-50 border border-red-200 rounded p-2">
            Returned by Senior Manager: {opp.onboarding.approval.notes}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Lot sheet code *">
            <input className={inputCls} value={labelCode} onChange={(e) => setLabelCode(e.target.value)} placeholder="BBC-XXX-000-A1" />
          </Field>
          <Field label="Production line">
            <select className={inputCls} value={lotLine} onChange={(e) => setLotLine(e.target.value)}>
              {PROCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Batch size *">
            <input className={inputCls} value={lotBatch} onChange={(e) => setLotBatch(e.target.value)} placeholder="e.g. 350 lb dough / 1,200 units" />
          </Field>
          <Field label="Dating rule">
            <input className={inputCls} value={lotDating} onChange={(e) => setLotDating(e.target.value)} placeholder="e.g. Best by = bake date + 21 days" />
          </Field>
          <Field label="Storage temp">
            <select className={inputCls} value={lotTemp} onChange={(e) => setLotTemp(e.target.value)}>
              {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Btn
            tone="accent"
            disabled={!labelCode.trim() || !lotBatch.trim()}
            onClick={() =>
              dispatch({
                type: "CREATE_LABEL",
                payload: { id: opp.id, by: me.id, code: labelCode.trim(), line: lotLine, batchSize: lotBatch.trim(), datingRule: lotDating.trim(), storageTemp: lotTemp },
              })
            }
          >
            Create lot sheet → send for final approval
          </Btn>
        </div>
      </Panel>
    );
  }
  return null;
}

export function ApprovalActions({ opp, me, dispatch }) {
  const [notes, setNotes] = useState("");
  const [atts, setAtts] = useState([]);
  if (me.role !== "senior_manager" || opp.stage !== "approval" || opp.onboarding.approval.status !== "pending") return null;
  const allChecked = PROTOCOL_ATTESTATIONS.every((a) => atts.includes(a));
  return (
    <Panel title="Final approval" hint="Offline 200-point protocol review">
      <div className="text-sm text-stone-700 mb-3">
        Lot sheet <span className="font-mono">{opp.onboarding.label && opp.onboarding.label.code}</span> is ready.
        Complete your offline protocol checklist, then attest below.
      </div>
      <div className="space-y-2 mb-3">
        {PROTOCOL_ATTESTATIONS.map((a) => (
          <label key={a} className="flex items-start gap-2 text-sm text-stone-800 cursor-pointer">
            <input
              type="checkbox"
              className="accent-red-700 mt-0.5"
              checked={atts.includes(a)}
              onChange={(e) => setAtts(e.target.checked ? [...atts, a] : atts.filter((x) => x !== a))}
            />
            {a}
          </label>
        ))}
      </div>
      <Field label="Review notes">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Protocol findings, deviations, conditions…" />
      </Field>
      <div className="flex gap-2 mt-3">
        <Btn tone="green" disabled={!allChecked} onClick={() => dispatch({ type: "APPROVE", payload: { id: opp.id, by: me.id, notes: notes || "All protocol checks passed.", attestations: atts } })}>
          Approve → release to manufacturing
        </Btn>
      </div>
      {!allChecked && <div className="text-xs text-stone-500 mt-1">All four attestations are required before release.</div>}
      <div className="text-xs text-stone-500 mt-2">Found a gap? Use "Send back" below to return this to Lot Sheet or Spec with your findings.</div>
    </Panel>
  );
}

export function ManufacturingActions({ opp, me, dispatch }) {
  const lot = opp.onboarding.label || {};
  const today = new Date().toISOString().slice(0, 10);
  const shipInit = () => ({
    carrier: "Own fleet — AM route",
    tracking: "",
    boxes: "",
    shipDate: new Date().toISOString().slice(0, 10),
    eta: "",
    destination: opp.customer,
  });
  const [prod, setProd] = useState(() => ({
    lotNumber: lot.code ? `${lot.code}-${today.replace(/-/g, "").slice(2)}` : "",
    qtyProduced: "",
    producedAt: today,
    notes: "",
  }));
  const [ship, setShip] = useState(shipInit);
  const [openNext, setOpenNext] = useState(false);
  if (me.role !== "manufacturing" || (opp.stage !== "manufacturing" && opp.stage !== "shipped")) return null;
  const f = opp.fulfillment || {};
  const shipments = getShipments(opp);

  const shipmentForm = (label) => (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Carrier *">
          <select className={inputCls} value={ship.carrier} onChange={(e) => setShip({ ...ship, carrier: e.target.value })}>
            <option>Own fleet — AM route</option>
            <option>UPS Freight</option>
            <option>FedEx Freight</option>
            <option>LTL carrier (refrigerated)</option>
            <option>LTL carrier (frozen)</option>
          </select>
        </Field>
        <Field label="Tracking / PRO #">
          <input className={inputCls} value={ship.tracking} onChange={(e) => setShip({ ...ship, tracking: e.target.value })} placeholder="e.g. 1Z999AA10123456784" />
        </Field>
        <Field label="Boxes / cases in shipment *">
          <input className={inputCls} value={ship.boxes} onChange={(e) => setShip({ ...ship, boxes: e.target.value })} placeholder="e.g. 24 boxes (48 ct each)" />
        </Field>
        <Field label="Ship date *">
          <input className={inputCls} type="date" value={ship.shipDate} onChange={(e) => setShip({ ...ship, shipDate: e.target.value })} />
        </Field>
        <Field label="Customer receives by *">
          <input className={inputCls} type="date" value={ship.eta} onChange={(e) => setShip({ ...ship, eta: e.target.value })} />
        </Field>
        <Field label="Destination">
          <input className={inputCls} value={ship.destination} onChange={(e) => setShip({ ...ship, destination: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3">
        <Btn
          tone="green"
          disabled={!ship.shipDate || !ship.boxes.trim() || !ship.eta}
          onClick={() => {
            dispatch({ type: "RECORD_SHIPMENT", payload: { id: opp.id, by: me.id, shipment: ship } });
            setShip(shipInit());
            setOpenNext(false);
          }}
        >
          {label}
        </Btn>
      </div>
    </>
  );

  if (opp.stage === "manufacturing") {
    if (!f.production) {
      return (
        <Panel title="Production run" hint="Owner: Manufacturing team">
          <AutofillHint fields={[prod.lotNumber && "production lot (from lot sheet)", "production date"].filter(Boolean)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Production lot number *">
              <input className={inputCls} value={prod.lotNumber} onChange={(e) => setProd({ ...prod, lotNumber: e.target.value })} placeholder="e.g. BBC-EMB-095-C1-260718" />
            </Field>
            <Field label="Quantity produced *">
              <input className={inputCls} value={prod.qtyProduced} onChange={(e) => setProd({ ...prod, qtyProduced: e.target.value })} placeholder="e.g. 1,200 units / 100 cases" />
            </Field>
            <Field label="Production date">
              <input className={inputCls} type="date" value={prod.producedAt} onChange={(e) => setProd({ ...prod, producedAt: e.target.value })} />
            </Field>
            <Field label="Run notes">
              <input className={inputCls} value={prod.notes} onChange={(e) => setProd({ ...prod, notes: e.target.value })} placeholder="e.g. QA release passed, no deviations" />
            </Field>
          </div>
          <div className="mt-3">
            <Btn tone="accent" disabled={!prod.lotNumber.trim() || !prod.qtyProduced.trim()} onClick={() => dispatch({ type: "MARK_PRODUCTION_DONE", payload: { id: opp.id, by: me.id, production: prod } })}>
              Manufacturing done → prepare shipment
            </Btn>
          </div>
        </Panel>
      );
    }
    if (shipments.length === 0) {
      return (
        <Panel title="Shipment details" hint="Shown to the customer as their order status">
          <div className="text-sm text-stone-700 mb-3">
            Lot <span className="font-mono">{f.production.lotNumber}</span> · {f.production.qtyProduced} produced{" "}
            {f.production.producedAt}. Enter the shipment — the customer sees this in their portal.
          </div>
          {shipmentForm("Record shipment → mark shipped")}
        </Panel>
      );
    }
    return null;
  }

  // stage === "shipped": recurring deliveries
  return (
    <Panel title="Deliveries" hint="Standing / recurring shipments">
      <div className="text-sm text-stone-700 mb-2">
        {shipments.length} shipment{shipments.length > 1 ? "s" : ""} recorded. Each new delivery posts to the
        customer's portal as their latest status.
      </div>
      {!openNext ? (
        <Btn small tone="accent" onClick={() => setOpenNext(true)}>+ Record next shipment</Btn>
      ) : (
        <>
          {shipmentForm(`Record shipment #${shipments.length + 1}`)}
          <div className="mt-2">
            <Btn small tone="ghost" onClick={() => setOpenNext(false)}>Cancel</Btn>
          </div>
        </>
      )}
    </Panel>
  );
}

export function SpecAddendaPanel({ opp, me, dispatch }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("specification");
  const [text, setText] = useState("");
  if (me.role !== "product_spec" || opp.onboarding.specStatus !== "complete") return null;
  const addenda = opp.onboarding.specAddenda || [];
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base text-stone-900">Spec addenda</h3>
          <div className="text-xs text-stone-500">
            {opp.onboarding.specSource === "customer"
              ? "The customer's submission stays intact — your additions are recorded separately."
              : "Internal additions to the spec, recorded separately."}
          </div>
        </div>
        {!open && <Btn small tone="ghost" onClick={() => setOpen(true)}>Add details…</Btn>}
      </div>
      {addenda.length > 0 && (
        <div className="mt-3 space-y-2">
          {addenda.map((a, i) => (
            <div key={i} className="text-sm border-l-2 border-stone-300 pl-3">
              <div className="flex items-baseline gap-2">
                <Badge tone={a.category === "formulation" ? "blue" : "stone"}>
                  {a.category === "formulation" ? "formulation" : "specification"}
                </Badge>
                <span className="text-[11px] text-stone-400">{fmtDate(a.at)} · {userName(a.by)}</span>
              </div>
              <div className="text-stone-800 mt-0.5">{a.text}</div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="mt-3 space-y-3">
          <Field label="Category">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="specification">Specification detail</option>
              <option value="formulation">Formulation detail</option>
            </select>
          </Field>
          <Field label="Detail to add">
            <textarea className={inputCls} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. bake temperature tolerance ±5°F; customer's stated shelf life assumes chilled transit…" />
          </Field>
          <div className="flex gap-2">
            <Btn small tone="accent" disabled={!text.trim()} onClick={() => { dispatch({ type: "ADD_SPEC_ADDENDUM", payload: { id: opp.id, by: me.id, category, text: text.trim() } }); setText(""); }}>
              Add to spec
            </Btn>
            <Btn small tone="ghost" onClick={() => { setOpen(false); setText(""); }}>Done</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtworkFollowUp({ opp, me, dispatch }) {
  const [ref, setRef] = useState("");
  const comps = opp.onboarding.specComponents;
  if (me.role !== "product_spec" || !comps || comps.artwork.status !== "deferred") return null;
  return (
    <Panel title="Deferred artwork" hint="Outstanding from spec package">
      <div className="text-sm text-stone-700 mb-2">
        Artwork was deferred during spec assembly. Attach it whenever it's ready — the rest of onboarding continues
        in the meantime.
      </div>
      <div className="flex gap-2">
        <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. packaging-artwork-final.ai" />
        <Btn small tone="accent" disabled={!ref.trim()} onClick={() => { dispatch({ type: "SET_ARTWORK", payload: { id: opp.id, by: me.id, ref: ref.trim() } }); setRef(""); }}>
          Attach artwork
        </Btn>
      </div>
    </Panel>
  );
}

export function SendBackPanel({ opp, me, dispatch }) {
  const cfg = RETURN_TARGETS[opp.stage];
  const [target, setTarget] = useState(cfg ? cfg.targets[0] : "");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (!cfg || cfg.role !== me.role) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base text-stone-900">Something missing?</h3>
          <div className="text-xs text-stone-500">Send this back to an earlier step with a reason.</div>
        </div>
        {!open && <Btn small tone="ghost" onClick={() => setOpen(true)}>Send back…</Btn>}
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          <Field label="Return to">
            <select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
              {cfg.targets.map((t) => (
                <option key={t} value={t}>
                  {STAGES[stageIndex(t)].label} ({ROLES[STAGES[stageIndex(t)].owner].short})
                </option>
              ))}
            </select>
          </Field>
          <Field label="What's missing / why?">
            <textarea className={inputCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required — the receiving team sees this." />
          </Field>
          <div className="flex gap-2">
            <Btn small tone="danger" disabled={!reason.trim()} onClick={() => { dispatch({ type: "RETURN_TO_STAGE", payload: { id: opp.id, by: me.id, toStage: target, reason } }); setOpen(false); setReason(""); }}>
              Send back
            </Btn>
            <Btn small tone="ghost" onClick={() => { setOpen(false); setReason(""); }}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
