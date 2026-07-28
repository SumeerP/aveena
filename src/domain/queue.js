import { STAGES, stageIndex } from '../constants/stages.js';
import { userName, userRoleShort } from './users.js';

export function pendingForRole(opp, role) {
  const tasks = [];
  // A returned item ALWAYS lands in the receiving stage owner's queue,
  // regardless of any completion flags on the opportunity.
  if (opp.returnInfo && opp.stage === opp.returnInfo.to) {
    const st = STAGES[stageIndex(opp.stage)];
    if (st.owner === role) {
      tasks.push(`Returned from ${userRoleShort(opp.returnInfo.by)} (${userName(opp.returnInfo.by)}) — fix & resend`);
    }
  }
  if (role === "sales_poc") {
    if (opp.stage === "discovery") tasks.push("Log conversations / decide on sample");
    // Team responses always pull the item back into the POC's queue:
    if (opp.samples.some((s) => s.status === "with_customer"))
      tasks.push("Sample Creation responded — record customer feedback / finalize");
    if (opp.pricing.status === "base_set") tasks.push("Pricing responded — build invoice with add-ons");
    if (opp.pricing.status === "invoiced") tasks.push("Record customer PO");
    if (opp.stage === "commercial" && opp.pricing.status === "not_requested") tasks.push("Request pricing");
    if (opp.stage === "commercial" && opp.pricing.status === "po_received")
      tasks.push("Send to onboarding when ready");
    if (opp.pricing.status === "returned") tasks.push("Pricing returned — provide info & re-request");
    if (opp.formulations.status === "blocked") tasks.push("Formulations needs info from you");
  }
  if (role === "sample_request" && opp.stage === "sample_request")
    tasks.push(opp.sampleRequest ? "Revise sample request form" : "Complete sample request form");
  if (role === "sample_creation" && opp.stage === "sample_creation" && !opp.sampleFinalized) {
    const withCust = opp.samples.some((s) => s.status === "with_customer");
    if (!withCust) {
      const last = opp.samples[opp.samples.length - 1];
      if (last && last.status === "changes_requested")
        tasks.push(`Customer requested changes on v${last.version} — create next version`);
      else tasks.push(opp.samples.length ? "Create next sample version" : "Create first sample");
    }
  }
  if (role === "formulations" && opp.formulations.requested && opp.formulations.status === "pending")
    tasks.push("Formulation work needed");
  if (role === "pricing" && opp.pricing.status === "requested") tasks.push("Set base pricing");
  if (role === "product_spec") {
    if (opp.stage === "spec") {
      const ss = opp.onboarding.specStatus;
      const comps = opp.onboarding.specComponents;
      const unresolved =
        comps && (comps.formulation.status === "pending" || comps.artwork.status === "pending");
      if (ss === "complete" && unresolved) tasks.push("Complete spec package — formulation / artwork");
      else if (ss === "complete") tasks.push("Match spec to internal metadata");
      else if (ss === "awaiting_customer") tasks.push("Awaiting customer spec submission");
      else tasks.push("Create spec internally or request from customer");
    }
    if (
      opp.stage !== "spec" &&
      opp.onboarding.specComponents &&
      opp.onboarding.specComponents.artwork.status === "deferred"
    )
      tasks.push("Deferred artwork outstanding — attach when ready");
  }
  if (role === "spec_team" && opp.stage === "labeling") tasks.push("Create lot sheet");
  if (role === "senior_manager" && opp.stage === "approval" && opp.onboarding.approval.status === "pending")
    tasks.push("Run offline 200-point protocol review");
  if (role === "manufacturing" && opp.stage === "manufacturing") {
    const f = opp.fulfillment || {};
    if (!f.production) tasks.push("Confirm production complete");
    else if (!f.shipment) tasks.push("Enter shipment details");
  }
  return tasks;
}

/* ---------- Action Panels (role + stage aware) ---------- */
