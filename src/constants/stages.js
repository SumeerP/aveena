export const STAGES = [
  { key: "discovery", label: "Discovery", sla: 5, owner: "sales_poc" },
  { key: "sample_request", label: "Sample Request", sla: 2, owner: "sample_request" },
  { key: "sample_creation", label: "Sample Dev", sla: 7, owner: "sample_creation" },
  { key: "commercial", label: "Pricing & PO", sla: 4, owner: "sales_poc" },
  { key: "spec", label: "Product Spec", sla: 3, owner: "product_spec" },
  { key: "labeling", label: "Lot Sheet", sla: 2, owner: "spec_team" },
  { key: "approval", label: "Final Approval", sla: 5, owner: "senior_manager" },
  { key: "manufacturing", label: "Manufacturing", sla: 7, owner: "manufacturing" },
  { key: "shipped", label: "Shipped", sla: 0, owner: null },
];
export const stageIndex = (key) => STAGES.findIndex((s) => s.key === key);
