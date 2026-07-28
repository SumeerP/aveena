import React from 'react';
import { Badge } from '../common/ui.jsx';
import { ProofingRail } from '../common/ProofingRail.jsx';
import { Discussion } from './Discussion.jsx';
import {
  DiscoveryActions, SampleRequestActions, FormulationActions, SampleCreationActions,
  PocSampleLoopActions, PricingTeamActions, PricingReturnedPanel, FormulationInfoPanel,
  CommercialActions, SpecActions, ApprovalActions, ManufacturingActions,
  SpecAddendaPanel, ArtworkFollowUp, SendBackPanel,
} from '../actions/panels.jsx';
import { STAGES, stageIndex } from '../../constants/stages.js';
import { PROTOCOL_ATTESTATIONS } from '../../constants/products.js';
import { userName } from '../../domain/users.js';
import { now, daysBetween, fmtDate } from '../../domain/dates.js';
import { pendingForRole } from '../../domain/queue.js';
import { getShipments, fmtBoxes, resolveCategory } from '../../domain/autofill.js';
import { CATEGORY_FIELDS } from '../../constants/products.js';

export function Detail({ opp, me, dispatch, onBack, onOpen, allOpps }) {
  const totalDays = daysBetween(opp.createdAt, opp.stage === "shipped" ? opp.stageEnteredAt : now());
  const myTasks = pendingForRole(opp, me.role);
  const otherWorkflows = (allOpps || []).filter(
    (o) => o.id !== opp.id && o.contact.email.toLowerCase() === opp.contact.email.toLowerCase()
  );
  return (
    <div>
      <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-800 mb-3">← Back to pipeline</button>
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-red-800 tracking-widest">{opp.id}</div>
            <h2 className="font-serif text-2xl text-stone-900">{opp.customer}</h2>
            <div className="text-sm text-stone-600 mt-0.5">{opp.product}</div>
            {opp.profile && (
              <div className="text-xs text-stone-500 mt-0.5">
                {opp.profile.category} · {opp.profile.businessType}
                {opp.profile.estVolume ? ` · est. ${opp.profile.estVolume}` : ""}
                {opp.profile.leadSource ? ` · via ${opp.profile.leadSource}` : ""}
              </div>
            )}
            <div className="text-xs text-stone-500 mt-1">
              {opp.contact.name} · {opp.contact.email} · owner {userName(opp.createdBy)}
              {otherWorkflows.length > 0 && (
                <span className="ml-2"><Badge tone="stone">repeat customer · {otherWorkflows.length + 1} workflows</Badge></span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl text-stone-900">{totalDays}<span className="text-sm text-stone-500">d</span></div>
            <div className="text-xs text-stone-500">in pipeline · target 7d</div>
            {opp.formulations.requested && (
              <div className="mt-1">
                <Badge tone={opp.formulations.status === "done" ? "green" : "amber"}>
                  Formulations {opp.formulations.status === "done" ? "done" : "pending"}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-stone-100 pt-3">
          <ProofingRail opp={opp} />
        </div>
      </div>

      {opp.returnInfo && opp.stage === opp.returnInfo.to && (
        <div className="mt-3 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="font-semibold text-red-800">
            Returned from {userRoleShort(opp.returnInfo.by)} — {userName(opp.returnInfo.by)}
          </span>
          <span className="text-red-700"> · {STAGES[stageIndex(opp.returnInfo.from)].label} stage · {fmtDate(opp.returnInfo.at)}</span>
          <div className="text-stone-800 mt-0.5">{opp.returnInfo.reason}</div>
        </div>
      )}

      {myTasks.length > 0 && (
        <div className="mt-3 text-sm text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-4 py-2">
          Waiting on you: {myTasks.join(" · ")}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mt-4" key={opp.id}>
        <div className="space-y-4">
          <DiscoveryActions opp={opp} me={me} dispatch={dispatch} />
          <SampleRequestActions opp={opp} me={me} dispatch={dispatch} />
          <FormulationActions opp={opp} me={me} dispatch={dispatch} />
          <FormulationInfoPanel opp={opp} me={me} dispatch={dispatch} />
          <SampleCreationActions opp={opp} me={me} dispatch={dispatch} />
          <PocSampleLoopActions opp={opp} me={me} dispatch={dispatch} />
          <PricingTeamActions opp={opp} me={me} dispatch={dispatch} />
          <PricingReturnedPanel opp={opp} me={me} dispatch={dispatch} />
          <CommercialActions opp={opp} me={me} dispatch={dispatch} />
          <SpecActions opp={opp} me={me} dispatch={dispatch} />
          <SpecAddendaPanel opp={opp} me={me} dispatch={dispatch} />
          <ArtworkFollowUp opp={opp} me={me} dispatch={dispatch} />
          <ApprovalActions opp={opp} me={me} dispatch={dispatch} />
          <ManufacturingActions opp={opp} me={me} dispatch={dispatch} />
          <SendBackPanel opp={opp} me={me} dispatch={dispatch} />
          {opp.stage === "manufacturing" && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-900">
              In production since {fmtDate(opp.stageEnteredAt)} — approved by {userName(opp.onboarding.approval.by)}.
              {(opp.fulfillment || {}).production
                ? " Production complete; awaiting shipment details."
                : " Awaiting production confirmation from the Manufacturing team."}
            </div>
          )}
          {opp.stage === "shipped" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
              Shipped {fmtDate(opp.stageEnteredAt)} via {getShipments(opp).length ? getShipments(opp)[getShipments(opp).length - 1].carrier : ""}.
              {getShipments(opp).length > 1 ? ` ${getShipments(opp).length} deliveries to date.` : ""} Full cycle:{" "}
              {daysBetween(opp.createdAt, opp.stageEnteredAt)} days.
            </div>
          )}

          {/* Read-only context blocks */}
          {opp.sampleRequest && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-sm">
              <h3 className="font-serif text-base text-stone-900 mb-2">Sample request</h3>
              <div className="grid grid-cols-2 gap-y-1 text-stone-700">
                <span className="text-stone-500">Quantity</span><span>{opp.sampleRequest.qty}</span>
                <span className="text-stone-500">Unit size</span><span>{opp.sampleRequest.unitSize || opp.sampleRequest.format || "—"}</span>
                {opp.sampleRequest.packFormat && (<><span className="text-stone-500">Pack format</span><span>{opp.sampleRequest.packFormat}</span></>)}
                {opp.sampleRequest.shelfLife && (<><span className="text-stone-500">Shelf life</span><span>{opp.sampleRequest.shelfLife}</span></>)}
                {opp.sampleRequest.storage && (<><span className="text-stone-500">Storage</span><span>{opp.sampleRequest.storage}</span></>)}
                {opp.sampleRequest.needBy && (<><span className="text-stone-500">Needed by</span><span>{opp.sampleRequest.needBy}</span></>)}
                {opp.sampleRequest.allergens && (Array.isArray(opp.sampleRequest.allergens) ? opp.sampleRequest.allergens.length > 0 : true) && (
                  <><span className="text-stone-500">Allergens</span><span>{Array.isArray(opp.sampleRequest.allergens) ? opp.sampleRequest.allergens.join(", ") : opp.sampleRequest.allergens}</span></>
                )}
                {(opp.sampleRequest.certifications || []).length > 0 && (
                  <><span className="text-stone-500">Certifications</span><span>{opp.sampleRequest.certifications.join(", ")}</span></>
                )}
                {opp.sampleRequest.notes && (<><span className="text-stone-500">Notes</span><span>{opp.sampleRequest.notes}</span></>)}
                {opp.sampleRequest.categoryDetails &&
                  Object.entries(opp.sampleRequest.categoryDetails)
                    .filter(([, v]) => v)
                    .map(([k, v]) => {
                      const cat = resolveCategory(opp);
                      const def = cat && (CATEGORY_FIELDS[cat] || []).find((f) => f.key === k);
                      return (
                        <React.Fragment key={k}>
                          <span className="text-stone-500">{def ? def.label : k}</span>
                          <span>{v}</span>
                        </React.Fragment>
                      );
                    })}
              </div>
            </div>
          )}
          {opp.samples.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <h3 className="font-serif text-base text-stone-900 mb-2">Sample versions</h3>
              <div className="space-y-2">
                {opp.samples.map((s) => (
                  <div key={s.version} className="text-sm border-l-2 border-red-600 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-stone-500">v{s.version} · {fmtDate(s.at)}</span>
                      <Badge tone={s.status === "finalized" ? "green" : s.status === "with_customer" ? "blue" : s.status === "changes_requested" ? "amber" : "stone"}>
                        {s.status === "with_customer" ? "with customer" : s.status === "changes_requested" ? "changes requested" : s.status}
                      </Badge>
                    </div>
                    <div className="text-stone-800">
                      {s.desc}
                      {s.batchCode && <span className="font-mono text-xs text-stone-400"> · lot {s.batchCode}</span>}
                    </div>
                    {s.feedback && <div className="text-stone-500 text-xs mt-0.5">Feedback: {s.feedback}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {opp.pricing.status !== "not_requested" && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-sm">
              <h3 className="font-serif text-base text-stone-900 mb-2">Commercial</h3>
              <div className="grid grid-cols-2 gap-y-1 text-stone-700">
                <span className="text-stone-500">Base price</span><span className="font-mono">{opp.pricing.base ? `$${opp.pricing.base} ${opp.pricing.basis || "per unit"}` : "pending"}</span>
                {opp.pricing.moq && (<><span className="text-stone-500">Min. order</span><span>{opp.pricing.moq}</span></>)}
                {opp.pricing.addons.map((a, i) => (
                  <React.Fragment key={i}>
                    <span className="text-stone-500">{a.label}</span><span className="font-mono">${a.amount}</span>
                  </React.Fragment>
                ))}
                {opp.pricing.invoiceTotal && (<><span className="text-stone-500">Invoice total</span><span className="font-mono font-semibold">${opp.pricing.invoiceTotal.toLocaleString()}</span></>)}
                {opp.pricing.poNumber && (<><span className="text-stone-500">PO</span><span className="font-mono">{opp.pricing.poNumber} · {fmtDate(opp.pricing.poReceivedAt)}</span></>)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {otherWorkflows.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <h3 className="font-serif text-base text-stone-900 mb-2">Customer history</h3>
              <div className="space-y-1.5">
                {otherWorkflows
                  .slice()
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((o) => (
                    <button
                      key={o.id}
                      onClick={() => onOpen && onOpen(o.id)}
                      className="w-full flex items-center justify-between gap-2 text-left text-sm rounded px-2 py-1.5 hover:bg-red-50"
                    >
                      <span className="min-w-0">
                        <span className="font-mono text-xs text-red-800 mr-2">{o.id}</span>
                        <span className="text-stone-800">{o.product}</span>
                      </span>
                      <Badge tone={o.stage === "manufacturing" ? "green" : "stone"}>
                        {STAGES[stageIndex(o.stage)].label}
                      </Badge>
                    </button>
                  ))}
              </div>
              <div className="text-xs text-stone-500 mt-2">
                Same customer, independent workflows — each sample cycle has its own ID, SLA clock, and audit trail.
              </div>
            </div>
          )}
          <Discussion opp={opp} me={me} dispatch={dispatch} />
          {opp.onboarding.specStatus && opp.onboarding.specStatus !== "not_started" && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-sm">
              <h3 className="font-serif text-base text-stone-900 mb-2">Onboarding</h3>
              <div className="grid grid-cols-2 gap-y-1 text-stone-700">
                <span className="text-stone-500">Spec source</span>
                <span>{opp.onboarding.specSource === "internal" ? "Internal (from discovery)" : "Customer submission"}</span>
                <span className="text-stone-500">Spec status</span>
                <span>{opp.onboarding.specStatus === "awaiting_customer" ? "Awaiting customer" : opp.onboarding.specStatus}</span>
                {opp.onboarding.specDoc && (<><span className="text-stone-500">Document</span><span className="font-mono text-xs pt-0.5">{opp.onboarding.specDoc}</span></>)}
                {opp.onboarding.specDetails && (<><span className="text-stone-500">Shelf life</span><span>{opp.onboarding.specDetails.shelfLife}</span></>)}
                {(opp.onboarding.specAddenda || []).length > 0 && (
                  <>
                    <span className="text-stone-500">Addenda</span>
                    <span>{opp.onboarding.specAddenda.length} internal addition{opp.onboarding.specAddenda.length > 1 ? "s" : ""}</span>
                  </>
                )}
                {opp.onboarding.specComponents && (
                  <>
                    <span className="text-stone-500">Formulation</span>
                    <span>{opp.onboarding.specComponents.formulation.status === "complete" ? "In package" : "Pending"}</span>
                    <span className="text-stone-500">Artwork</span>
                    <span>
                      {opp.onboarding.specComponents.artwork.status === "complete"
                        ? opp.onboarding.specComponents.artwork.ref
                        : opp.onboarding.specComponents.artwork.status === "deferred"
                        ? "Deferred — to be added"
                        : "Pending"}
                    </span>
                  </>
                )}
                {opp.onboarding.metadata && (
                  <>
                    <span className="text-stone-500">Process</span><span>{opp.onboarding.metadata.process}</span>
                    <span className="text-stone-500">Category</span><span>{opp.onboarding.metadata.category}</span>
                  </>
                )}
                {opp.onboarding.label && (<><span className="text-stone-500">Lot sheet</span><span className="font-mono">{opp.onboarding.label.code}</span></>)}
                {opp.onboarding.label && opp.onboarding.label.batchSize && (<><span className="text-stone-500">Batch</span><span>{opp.onboarding.label.batchSize}</span></>)}
                {opp.onboarding.label && opp.onboarding.label.datingRule && (<><span className="text-stone-500">Dating</span><span>{opp.onboarding.label.datingRule}</span></>)}
                {opp.onboarding.label && opp.onboarding.label.storageTemp && (<><span className="text-stone-500">Storage</span><span>{opp.onboarding.label.storageTemp}</span></>)}
                {(opp.onboarding.approval.attestations || []).length > 0 && (
                  <><span className="text-stone-500">Attestations</span><span>{opp.onboarding.approval.attestations.length} of {PROTOCOL_ATTESTATIONS.length} signed</span></>
                )}
              </div>
            </div>
          )}
          {opp.fulfillment && (opp.fulfillment.production || getShipments(opp).length > 0) && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 text-sm">
              <h3 className="font-serif text-base text-stone-900 mb-2">Fulfillment</h3>
              {opp.fulfillment.production && (
                <div className="grid grid-cols-2 gap-y-1 text-stone-700 mb-2">
                  <span className="text-stone-500">Production lot</span><span className="font-mono">{opp.fulfillment.production.lotNumber}</span>
                  <span className="text-stone-500">Qty produced</span><span>{opp.fulfillment.production.qtyProduced}</span>
                  <span className="text-stone-500">Produced</span><span>{opp.fulfillment.production.producedAt}</span>
                  {opp.fulfillment.production.notes && (<><span className="text-stone-500">Run notes</span><span>{opp.fulfillment.production.notes}</span></>)}
                </div>
              )}
              {getShipments(opp)
                .slice()
                .reverse()
                .map((sh, i, arr) => (
                  <div key={i} className={`grid grid-cols-2 gap-y-1 text-stone-700 ${i > 0 ? "mt-2 pt-2 border-t border-stone-100" : ""}`}>
                    <span className="col-span-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                      Shipment #{arr.length - i}{i === 0 ? " · latest" : ""}
                    </span>
                    <span className="text-stone-500">Carrier</span><span>{sh.carrier}</span>
                    {sh.tracking && (<><span className="text-stone-500">Tracking</span><span className="font-mono">{sh.tracking}</span></>)}
                    {sh.boxes && (<><span className="text-stone-500">Boxes / cases</span><span>{fmtBoxes(sh.boxes)}</span></>)}
                    <span className="text-stone-500">Shipped</span><span>{sh.shipDate}</span>
                    {sh.eta && (<><span className="text-stone-500">Receives by</span><span>{sh.eta}</span></>)}
                    <span className="text-stone-500">Destination</span><span>{sh.destination}</span>
                  </div>
                ))}
            </div>
          )}
                    {opp.conversations.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <h3 className="font-serif text-base text-stone-900 mb-2">Conversations</h3>
              <div className="space-y-2">
                {opp.conversations.map((c, i) => (
                  <div key={i} className="text-sm">
                    <div className="text-xs text-stone-500">{fmtDate(c.at)} · {userName(c.by)}</div>
                    <div className="text-stone-800">{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <h3 className="font-serif text-base text-stone-900 mb-2">Activity log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {[...opp.activity].reverse().map((a, i) => (
                <div key={i} className="text-sm flex gap-3">
                  <div className="font-mono text-xs text-stone-400 whitespace-nowrap pt-0.5 w-14">{fmtDate(a.at)}</div>
                  <div>
                    <span className="text-stone-800">{a.text}</span>
                    <span className="text-xs text-stone-400"> — {userName(a.by)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- New Opportunity modal ---------- */
