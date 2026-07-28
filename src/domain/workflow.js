import { now, act } from './dates.js';

export function withActivity(opp, by, text) {
  return { ...opp, activity: [...opp.activity, act(now(), by, text)] };
}

/* The spec is a package: forms + formulation details + artwork (deferrable). */
export function initSpecComponents(o) {
  const f = o.formulations;
  return {
    forms: { status: "complete" },
    formulation: !f.requested
      ? { status: "complete", note: "Not required for this product" }
      : f.status === "done"
      ? { status: "complete", note: f.notes }
      : { status: "pending" },
    artwork: { status: "pending", ref: null },
  };
}
export function moveStage(opp, key) {
  // Forward hand-offs clear any open "returned" flag.
  return { ...opp, stage: key, stageEnteredAt: now(), returnInfo: null };
}

/* Which stages can the current stage's owner send work back to? */
export const RETURN_TARGETS = {
  sample_request: { role: "sample_request", targets: ["discovery"] },
  sample_creation: { role: "sample_creation", targets: ["sample_request", "discovery"] },
  commercial: { role: "sales_poc", targets: ["sample_creation"] },
  spec: { role: "product_spec", targets: ["commercial"] },
  labeling: { role: "spec_team", targets: ["spec"] },
  approval: { role: "senior_manager", targets: ["labeling", "spec"] },
  manufacturing: { role: "manufacturing", targets: ["approval"] },
};
