import React, { useState, useMemo, useContext } from 'react';
import { AppCtx } from '../../state/context.js';
import { Badge, Btn, Field, inputCls, CheckGroup } from '../common/ui.jsx';
import { CategoryFields } from '../common/CategoryFields.jsx';
import { STORAGE_TEMPS, CERTIFICATIONS } from '../../constants/products.js';
import { stageIndex } from '../../constants/stages.js';
import { ROLES } from '../../constants/roles.js';
import { userName } from '../../domain/users.js';
import { fmtDate } from '../../domain/dates.js';
import {
  deriveDiscoveryContext, matchStorageTemp, resolveCategory, getShipments, fmtBoxes,
} from '../../domain/autofill.js';

export const CUSTOMER_PHASES = [
  { label: "Sample development", stages: ["discovery", "sample_request", "sample_creation"] },
  { label: "Pricing & ordering", stages: ["commercial"] },
  { label: "Onboarding", stages: ["spec", "labeling", "approval"] },
  { label: "In production", stages: ["manufacturing"] },
  { label: "Shipped", stages: ["shipped"] },
];
const phaseIndex = (stage) => CUSTOMER_PHASES.findIndex((p) => p.stages.includes(stage));

function CustomerSpecForm({ opp, me, dispatch }) {
  const sr = opp.sampleRequest || {};
  const ctx = useMemo(() => deriveDiscoveryContext(opp), [opp.id]);
  const [det, setDet] = useState(() => ({
    ingredients: "",
    allergens: Array.isArray(sr.allergens) ? sr.allergens.join(", ") : sr.allergens || ctx.allergens.join(", "),
    shelfLife: sr.shelfLife || ctx.shelfLife || "",
    storage: sr.storage || ctx.storage || "",
    netWeight: sr.unitSize || ctx.unitSize || "",
    distributionTemp: matchStorageTemp(sr.storage || ctx.storage) || STORAGE_TEMPS[0],
    certifications: sr.certifications || ctx.certifications || [],
    categoryDetails: sr.categoryDetails || {},
    notes: "",
  }));
  const custCategory = resolveCategory(opp);
  const prefilled = [
    det.allergens && "allergens",
    det.shelfLife && "shelf life",
    det.netWeight && "size",
    (det.certifications || []).length && "certifications",
  ].filter(Boolean);
  const [docName, setDocName] = useState("");
  const [docs, setDocs] = useState([]);
  const ok = det.ingredients && det.allergens && det.shelfLife;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
      <h3 className="font-serif text-lg text-stone-900">Product specifications needed</h3>
      <p className="text-sm text-stone-600 mt-1 mb-4">
        Boston Baking Company has requested your product specifications for <span className="font-medium">{opp.product}</span>.
        Fill in the details below and attach any supporting documentation.
      </p>
      {prefilled.length > 0 && (
        <div className="text-xs text-red-900 bg-white border border-red-200 rounded px-2.5 py-1.5 mb-3">
          We prefilled {prefilled.join(", ")} from what you discussed with our team — please review and correct
          anything that has changed.
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Key ingredients / requirements *">
          <input className={inputCls} value={det.ingredients} onChange={(e) => setDet({ ...det, ingredients: e.target.value })} placeholder="e.g. rolled oats, real maple syrup" />
        </Field>
        <Field label="Allergen requirements *">
          <input className={inputCls} value={det.allergens} onChange={(e) => setDet({ ...det, allergens: e.target.value })} placeholder="e.g. nut-free facility required" />
        </Field>
        <Field label="Required shelf life *">
          <input className={inputCls} value={det.shelfLife} onChange={(e) => setDet({ ...det, shelfLife: e.target.value })} placeholder="e.g. 14 days at room temp" />
        </Field>
        <Field label="Storage & handling">
          <input className={inputCls} value={det.storage} onChange={(e) => setDet({ ...det, storage: e.target.value })} placeholder="e.g. delivered chilled" />
        </Field>
        <Field label="Target net weight / size">
          <input className={inputCls} value={det.netWeight || ""} onChange={(e) => setDet({ ...det, netWeight: e.target.value })} placeholder="e.g. 4 oz whoopie pie" />
        </Field>
        <Field label="Distribution temperature">
          <select className={inputCls} value={det.distributionTemp || STORAGE_TEMPS[0]} onChange={(e) => setDet({ ...det, distributionTemp: e.target.value })}>
            {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Certifications you require">
          <CheckGroup options={CERTIFICATIONS} value={det.certifications || []} onChange={(v) => setDet({ ...det, certifications: v })} />
        </Field>
      </div>
      <CategoryFields category={custCategory} values={det.categoryDetails || {}} onChange={(v) => setDet({ ...det, categoryDetails: v })} />
      <div className="mt-3">
        <Field label="Anything else we should know">
          <textarea className={inputCls} rows={2} value={det.notes} onChange={(e) => setDet({ ...det, notes: e.target.value })} placeholder="Labeling requirements, certifications, packaging preferences…" />
        </Field>
      </div>
      <div className="mt-4 pt-4 border-t border-red-100">
        <div className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">Supporting documents</div>
        <div className="flex gap-2">
          <input className={inputCls} value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. nutrition-panel.pdf, brand-guidelines.pdf" onKeyDown={(e) => { if (e.key === "Enter" && docName.trim()) { setDocs([...docs, docName.trim()]); setDocName(""); } }} />
          <Btn small tone="ghost" disabled={!docName.trim()} onClick={() => { setDocs([...docs, docName.trim()]); setDocName(""); }}>
            Attach
          </Btn>
        </div>
        {docs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {docs.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs font-mono bg-white border border-stone-300 rounded px-2 py-1">
                📎 {d}
                <button className="text-stone-400 hover:text-red-600 ml-1" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4">
        <Btn tone="accent" disabled={!ok} onClick={() => dispatch({ type: "CUSTOMER_SUBMIT_SPEC", payload: { id: opp.id, by: me.id, details: det, docs } })}>
          Submit specifications{docs.length ? ` + ${docs.length} document${docs.length > 1 ? "s" : ""}` : ""}
        </Btn>
        {!ok && <div className="text-xs text-stone-500 mt-1">Fields marked * are required.</div>}
      </div>
    </div>
  );
}

export function CustomerPortal() {
  const { state, dispatch } = useContext(AppCtx);
  const me = state.session;
  const [openId, setOpenId] = useState(null);
  const mine = state.opportunities.filter((o) => o.contact.email.toLowerCase() === me.email.toLowerCase());
  const open = mine.find((o) => o.id === openId);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-red-900 text-red-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg">Boston Baking Co.</span>
            <span className="font-mono text-[10px] tracking-widest text-red-200 uppercase">Customer portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm">{me.name}</div>
              <div className="text-[11px] text-red-200">{me.company}</div>
            </div>
            <button onClick={() => dispatch({ type: "LOGOUT" })} className="text-xs border border-red-700 rounded px-2 py-1 hover:bg-red-800">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {open ? (
          <div key={open.id}>
            <button onClick={() => setOpenId(null)} className="text-sm text-stone-500 hover:text-stone-800 mb-3">← Back to my requests</button>
            <div className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
              <div className="font-mono text-xs text-red-800 tracking-widest">{open.id}</div>
              <h2 className="font-serif text-2xl text-stone-900">{open.product}</h2>
              <div className="mt-4 flex items-center gap-1">
                {CUSTOMER_PHASES.map((p, i) => {
                  const cur = phaseIndex(open.stage);
                  return (
                    <div key={p.label} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i < cur ? "bg-red-700" : i === cur ? "bg-red-400" : "bg-stone-200"}`} />
                      <div className={`text-[11px] mt-1 ${i === cur ? "font-semibold text-stone-900" : "text-stone-400"}`}>{p.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {open.stage === "manufacturing" && (open.fulfillment || {}).production && (
              <div className="mb-4 bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-900">
                <div className="font-medium">Production complete — preparing your shipment</div>
                <div className="mt-1">
                  Lot <span className="font-mono">{open.fulfillment.production.lotNumber}</span> ·{" "}
                  {open.fulfillment.production.qtyProduced} produced on {open.fulfillment.production.producedAt}. We'll
                  post tracking details here as soon as it ships.
                </div>
              </div>
            )}
            {open.stage === "manufacturing" && !(open.fulfillment || {}).production && (
              <div className="mb-4 bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-900">
                Your order is in production at our SQF-certified facility. We'll update this page when it's baked,
                packed, and on its way.
              </div>
            )}
            {open.stage === "shipped" && getShipments(open).length > 0 && (() => {
              const list = getShipments(open);
              const latest = list[list.length - 1];
              return (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="font-serif text-lg text-emerald-900">Your order is on its way 🚚</div>
                  <div className="grid grid-cols-2 gap-y-1 text-sm text-stone-700 mt-2">
                    <span className="text-stone-500">Carrier</span><span>{latest.carrier}</span>
                    {latest.tracking && (
                      <><span className="text-stone-500">Tracking #</span><span className="font-mono">{latest.tracking}</span></>
                    )}
                    {latest.boxes && (
                      <><span className="text-stone-500">Boxes you'll receive</span><span>{fmtBoxes(latest.boxes)}</span></>
                    )}
                    <span className="text-stone-500">Shipped</span><span>{latest.shipDate}</span>
                    {latest.eta && (
                      <><span className="text-stone-500">Arriving by</span><span>{latest.eta}</span></>
                    )}
                    <span className="text-stone-500">Ship to</span><span>{latest.destination}</span>
                    {open.fulfillment.production && (
                      <><span className="text-stone-500">Production lot</span><span className="font-mono">{open.fulfillment.production.lotNumber}</span></>
                    )}
                  </div>
                  {list.length > 1 && (
                    <div className="mt-3 pt-2 border-t border-emerald-200">
                      <div className="text-xs uppercase tracking-wider text-emerald-800 mb-1">Previous deliveries</div>
                      {list
                        .slice(0, -1)
                        .reverse()
                        .map((sh, i) => (
                          <div key={i} className="text-xs text-stone-600">
                            {sh.shipDate} · {fmtBoxes(sh.boxes)} · {sh.carrier}
                            {sh.eta ? ` · received by ${sh.eta}` : ""}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })()}
                        {open.stage === "spec" && open.onboarding.specStatus === "awaiting_customer" && (
              <div className="mb-4">
                <CustomerSpecForm opp={open} me={me} dispatch={dispatch} />
              </div>
            )}
            {open.onboarding.specStatus === "complete" && open.onboarding.specSource === "customer" && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
                Specifications submitted{open.onboarding.specDoc ? ` (${open.onboarding.specDoc})` : ""}. The Boston
                Baking team is reviewing them — nothing further is needed from you right now.
              </div>
            )}

            {open.samples.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <h3 className="font-serif text-base text-stone-900 mb-2">Your samples</h3>
                <div className="space-y-2">
                  {open.samples.map((s) => (
                    <div key={s.version} className="text-sm border-l-2 border-red-600 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-stone-500">v{s.version} · {fmtDate(s.at)}</span>
                        <Badge tone={s.status === "finalized" ? "green" : s.status === "with_customer" ? "blue" : "stone"}>
                          {s.status === "with_customer" ? "on its way to you" : s.status === "finalized" ? "approved" : "revised"}
                        </Badge>
                      </div>
                      <div className="text-stone-800">{s.desc}</div>
                      {s.feedback && <div className="text-stone-500 text-xs mt-0.5">Your feedback: {s.feedback}</div>}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-stone-500 mt-3">
                  Questions or feedback on a sample? Reach out to {userName(open.createdBy)} — they'll take it from there.
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="font-serif text-xl text-stone-900 mb-3">Your requests with Boston Baking</h2>
            {mine.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-300 rounded-lg p-10 text-center text-stone-500 text-sm">
                No active requests found for {me.email}.
              </div>
            ) : (
              <div className="space-y-2">
                {mine.map((o) => {
                  const needsSpec = o.stage === "spec" && o.onboarding.specStatus === "awaiting_customer";
                  return (
                    <button key={o.id} onClick={() => setOpenId(o.id)} className="w-full text-left bg-white border border-stone-200 hover:border-red-400 rounded-lg p-4 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs text-red-800 mr-3">{o.id}</span>
                          <span className="font-serif text-lg text-stone-900">{o.product}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {needsSpec && <Badge tone="amber">action needed — specifications</Badge>}
                          <Badge tone={o.stage === "shipped" ? "green" : o.stage === "manufacturing" ? "blue" : "stone"}>
                            {CUSTOMER_PHASES[phaseIndex(o.stage)].label}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- Shell / Dashboard ---------- */
