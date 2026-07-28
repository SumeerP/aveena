import {
  withActivity,
  moveStage,
  initSpecComponents,
  RETURN_TARGETS,
} from '../domain/workflow.js';
import { now } from '../domain/dates.js';
import { stageIndex, STAGES } from '../constants/stages.js';
import { SEED_OPPS } from '../domain/seed.js';
import { getShipments, fmtBoxes } from '../domain/autofill.js';

export function reducer(state, action) {
  const { type, payload } = action;
  const upd = (id, fn) => ({
    ...state,
    opportunities: state.opportunities.map((o) => (o.id === id ? fn(o) : o)),
  });

  switch (type) {
    case "HYDRATE":
      return {
        ...state,
        opportunities: (payload.opportunities || []).map((o) => ({ discussion: [], ...o })),
        loaded: true,
      };
    case "LOGIN":
      return { ...state, session: payload };
    case "LOGOUT":
      return { ...state, session: null };
    case "RESET_DATA":
      return { ...state, opportunities: SEED_OPPS };

    case "CREATE_OPP": {
      const nums = state.opportunities.map((o) => parseInt(o.id.split("-")[1], 10));
      const id = "OPP-" + (Math.max(1000, ...nums) + 1);
      const o = {
        id,
        customer: payload.customer,
        contact: { name: payload.contactName, email: payload.contactEmail },
        product: payload.product,
        profile: payload.profile || null,
        createdBy: payload.by,
        createdAt: now(),
        stage: "discovery",
        stageEnteredAt: now(),
        conversations: [],
        formulations: { requested: false, status: "n/a", notes: "" },
        sampleRequest: null,
        samples: [],
        sampleFinalized: false,
        pricing: { status: "not_requested", base: null, addons: [], invoiceTotal: null, invoiceSentAt: null, poNumber: null, poReceivedAt: null },
        onboarding: { specSource: null, specStatus: "not_started", metadataMapped: false, label: null, approval: { status: "not_started", by: null, at: null, notes: "" } },
        activity: [act(now(), payload.by, "Opportunity created")],
        discussion: [],
      };
      return { ...state, opportunities: [o, ...state.opportunities] };
    }

    case "ADD_CONVERSATION":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, conversations: [...o.conversations, { by: payload.by, at: now(), note: payload.note }] },
          payload.by,
          "Conversation logged"
        )
      );

    case "SEND_TO_SAMPLE_REQUEST":
      return upd(payload.id, (o) => {
        let next = moveStage(o, "sample_request");
        if (payload.withFormulations) {
          next = { ...next, formulations: { requested: true, status: "pending", notes: "" } };
        }
        return withActivity(
          next,
          payload.by,
          payload.withFormulations
            ? "Customer wants a sample → pushed to Sample Request team and simultaneously to Formulations"
            : "Customer wants a sample → pushed to Sample Request team"
        );
      });

    case "SUBMIT_SAMPLE_REQUEST_FORM":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage({ ...o, sampleRequest: { ...payload.form, submittedAt: now(), by: payload.by } }, "sample_creation"),
          payload.by,
          "Sample request form completed → pushed to Sample Creation team"
        )
      );

    case "COMPLETE_FORMULATION":
      return upd(payload.id, (o) => {
        let next = { ...o, formulations: { ...o.formulations, status: "done", notes: payload.notes, details: payload.details || null } };
        if (o.onboarding.specComponents && o.onboarding.specComponents.formulation.status === "pending") {
          next = {
            ...next,
            onboarding: {
              ...next.onboarding,
              specComponents: {
                ...next.onboarding.specComponents,
                formulation: { status: "complete", note: payload.notes },
              },
            },
          };
        }
        return withActivity(next, payload.by, "Formulation work complete — details flow into the spec package");
      });

    case "ADD_SAMPLE_VERSION":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            samples: [
              ...o.samples.map((s) =>
                s.status === "with_customer" || s.status === "changes_requested" ? { ...s, status: "revised" } : s
              ),
              { version: o.samples.length + 1, at: now(), desc: payload.desc, batchCode: payload.batchCode || "", packFormat: payload.packFormat || "", feedback: "", status: "with_customer" },
            ],
          },
          payload.by,
          `Sample v${o.samples.length + 1} sent to customer → handed to Sales POC for the customer response`
        )
      );

    case "RECORD_FEEDBACK":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            samples: o.samples.map((s) =>
              s.version === payload.version ? { ...s, feedback: payload.feedback, status: "changes_requested" } : s
            ),
          },
          payload.by,
          `Customer requested changes on sample v${payload.version} → sent back to Sample Creation with comments`
        )
      );

    case "FINALIZE_SAMPLE":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            {
              ...o,
              sampleFinalized: true,
              samples: o.samples.map((s, i) =>
                i === o.samples.length - 1 ? { ...s, status: "finalized" } : s
              ),
            },
            "commercial"
          ),
          payload.by,
          "Sample finalized by customer → moved to Pricing & PO"
        )
      );

    case "REQUEST_PRICING":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, pricing: { ...o.pricing, status: "requested", requestedAt: now() } },
          payload.by,
          "Pricing requested from Pricing team"
        )
      );

    case "SET_BASE_PRICE":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, pricing: { ...o.pricing, status: "base_set", base: payload.base, basis: payload.basis || "per unit", moq: payload.moq || "", baseSetAt: now() } },
          payload.by,
          `Base price set: $${payload.base}/unit → returned to opportunity owner`
        )
      );

    case "SEND_INVOICE":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            pricing: {
              ...o.pricing,
              status: "invoiced",
              addons: payload.addons,
              invoiceTotal: payload.total,
              invoiceSentAt: now(),
            },
          },
          payload.by,
          `Invoice sent to customer ($${payload.total.toLocaleString()})`
        )
      );

    case "RECORD_PO":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, pricing: { ...o.pricing, status: "po_received", poNumber: payload.poNumber, poReceivedAt: now() } },
          payload.by,
          `PO ${payload.poNumber} received, payment confirmed — ready for onboarding when owner deems fit`
        )
      );

    case "SET_SPEC_INTERNAL":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: {
              ...o.onboarding,
              specSource: "internal",
              specStatus: "complete",
              specDoc: "Internal spec (from discovery)",
              specDetails: payload.details,
              specComponents: initSpecComponents(o),
            },
          },
          payload.by,
          "Product spec created internally from discovery information"
        )
      );

    case "REQUEST_CUSTOMER_SPEC":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: { ...o.onboarding, specSource: "customer", specStatus: "awaiting_customer", specRequestedAt: now() },
          },
          payload.by,
          "Spec form + document upload request sent to customer — awaiting submission"
        )
      );

    case "RECEIVE_CUSTOMER_SPEC":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: { ...o.onboarding, specStatus: "complete", specDoc: payload.doc, specComponents: initSpecComponents(o) },
          },
          payload.by,
          `Customer submitted spec form and documents (${payload.doc})`
        )
      );

    case "CUSTOMER_SUBMIT_SPEC":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: {
              ...o.onboarding,
              specSource: "customer",
              specStatus: "complete",
              specDetails: payload.details,
              specDoc: payload.docs.length ? payload.docs.join(", ") : "Spec form (no attachments)",
              specComponents: initSpecComponents(o),
            },
          },
          payload.by,
          `Customer submitted product specifications + ${payload.docs.length} document(s) via customer portal`
        )
      );

    case "ADD_SPEC_ADDENDUM":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: {
              ...o.onboarding,
              specAddenda: [
                ...(o.onboarding.specAddenda || []),
                { by: payload.by, at: now(), category: payload.category, text: payload.text },
              ],
            },
          },
          payload.by,
          `Spec addendum added (${payload.category === "formulation" ? "formulation" : "specification"}) — ${payload.text}`
        )
      );

    case "SET_ARTWORK":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: {
              ...o.onboarding,
              specComponents: {
                ...o.onboarding.specComponents,
                artwork: { status: "complete", ref: payload.ref },
              },
            },
          },
          payload.by,
          `Artwork attached to spec package (${payload.ref})`
        )
      );

    case "DEFER_ARTWORK":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            onboarding: {
              ...o.onboarding,
              specComponents: {
                ...o.onboarding.specComponents,
                artwork: { status: "deferred", ref: null },
              },
            },
          },
          payload.by,
          "Artwork deferred — to be added later (does not block onboarding)"
        )
      );

    case "MAP_METADATA":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            {
              ...o,
              onboarding: {
                ...o.onboarding,
                metadataMapped: true,
                metadata: { process: payload.process, category: payload.category },
              },
            },
            "labeling"
          ),
          payload.by,
          `Spec matched to internal metadata — ${payload.process} · ${payload.category} → lot sheet`
        )
      );

    case "ADD_DISCUSSION":
      return upd(payload.id, (o) => ({
        ...o,
        discussion: [...(o.discussion || []), { by: payload.by, at: now(), text: payload.text }],
      }));

    case "CREATE_LABEL":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            {
              ...o,
              onboarding: {
                ...o.onboarding,
                label: {
                  code: payload.code,
                  line: payload.line || null,
                  batchSize: payload.batchSize || null,
                  datingRule: payload.datingRule || null,
                  storageTemp: payload.storageTemp || null,
                  createdAt: now(),
                  by: payload.by,
                  status: "created",
                },
                approval: { ...o.onboarding.approval, status: "pending" },
              },
            },
            "approval"
          ),
          payload.by,
          `Lot sheet ${payload.code} created → sent to Senior Manager for final approval`
        )
      );

    case "APPROVE":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            {
              ...o,
              onboarding: {
                ...o.onboarding,
                approval: { status: "approved", by: payload.by, at: now(), notes: payload.notes, attestations: payload.attestations || [] },
              },
            },
            "manufacturing"
          ),
          payload.by,
          "Offline 200-point protocol review passed → approved for manufacturing"
        )
      );

    case "RETURN_TO_STAGE":
      return upd(payload.id, (o) => {
        let next = {
          ...o,
          stage: payload.toStage,
          stageEnteredAt: now(),
          returnInfo: { from: o.stage, to: payload.toStage, by: payload.by, at: now(), reason: payload.reason },
        };
        if (payload.toStage === "sample_creation") {
          // Reopen the sample loop so the receiving team has a live action.
          next = {
            ...next,
            sampleFinalized: false,
            samples: next.samples.map((s) => (s.status === "finalized" ? { ...s, status: "revised" } : s)),
          };
        }
        if (o.stage === "approval") {
          next = {
            ...next,
            onboarding: {
              ...next.onboarding,
              approval: { ...next.onboarding.approval, status: "returned", by: payload.by, at: now(), notes: payload.reason },
            },
          };
        }
        return withActivity(
          next,
          payload.by,
          `Sent back to ${STAGES[stageIndex(payload.toStage)].label} — ${payload.reason}`
        );
      });

    case "START_ONBOARDING":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            { ...o, pricing: { ...o.pricing, poNumber: payload.poNumber || o.pricing.poNumber } },
            "spec"
          ),
          payload.by,
          "Opportunity owner started onboarding → Product Spec"
        )
      );

    case "PRICING_RETURN":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            pricing: { ...o.pricing, status: "returned", returnReason: payload.reason, returnedAt: now(), returnedBy: payload.by },
          },
          payload.by,
          "Pricing request returned to opportunity owner — " + payload.reason
        )
      );

    case "FORMULATION_NEEDS_INFO":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, formulations: { ...o.formulations, status: "blocked", infoRequest: payload.reason } },
          payload.by,
          "Formulations blocked, info requested from opportunity owner — " + payload.reason
        )
      );

    case "FORMULATION_RESUME":
      return upd(payload.id, (o) =>
        withActivity(
          { ...o, formulations: { ...o.formulations, status: "pending", infoRequest: null, infoResponse: payload.note } },
          payload.by,
          "Info provided to Formulations — work resumed"
        )
      );

    case "MARK_PRODUCTION_DONE":
      return upd(payload.id, (o) =>
        withActivity(
          {
            ...o,
            fulfillment: {
              ...(o.fulfillment || {}),
              production: { ...payload.production, by: payload.by, at: now() },
            },
          },
          payload.by,
          `Manufacturing complete — lot ${payload.production.lotNumber}, ${payload.production.qtyProduced} produced. Preparing shipment.`
        )
      );

    case "RECORD_SHIPMENT":
      return upd(payload.id, (o) => {
        const prior = Array.isArray((o.fulfillment || {}).shipments)
          ? o.fulfillment.shipments
          : (o.fulfillment || {}).shipment
          ? [o.fulfillment.shipment]
          : [];
        const entry = { ...payload.shipment, by: payload.by, at: now() };
        let next = {
          ...o,
          fulfillment: { ...(o.fulfillment || {}), shipments: [...prior, entry], shipment: entry },
        };
        if (o.stage === "manufacturing") next = moveStage(next, "shipped");
        return withActivity(
          next,
          payload.by,
          `Shipment #${prior.length + 1} — ${payload.shipment.carrier}${payload.shipment.boxes ? " · " + fmtBoxes(payload.shipment.boxes) : ""}${payload.shipment.eta ? " · receives by " + payload.shipment.eta : ""}`
        );
      });

    case "SEND_BACK":
      return upd(payload.id, (o) =>
        withActivity(
          moveStage(
            {
              ...o,
              onboarding: {
                ...o.onboarding,
                approval: { status: "returned", by: payload.by, at: now(), notes: payload.notes },
              },
            },
            "labeling"
          ),
          payload.by,
          "Returned by Senior Manager: " + payload.notes
        )
      );
    default:
      return state;
  }
}
