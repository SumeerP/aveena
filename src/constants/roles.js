export const ROLES = {
  sales_poc: { label: "Sales / Opportunity Owner", short: "Sales POC" },
  sample_request: { label: "Sample Request Team", short: "Sample Request" },
  sample_creation: { label: "Sample Creation Team", short: "Sample Creation" },
  formulations: { label: "Formulations Team", short: "Formulations" },
  pricing: { label: "Pricing Team", short: "Pricing" },
  product_spec: { label: "Product Specifications Team", short: "Product Spec" },
  spec_team: { label: "Lot Sheet Team", short: "Lot Sheet" },
  senior_manager: { label: "Senior Manager", short: "Sr. Manager" },
  manufacturing: { label: "Manufacturing Team", short: "Manufacturing" },
  customer: { label: "Customer", short: "Customer" },
};

export const USERS = [
  { id: "u1", name: "Maya Torres", email: "maya@bostonbaking.co", role: "sales_poc" },
  { id: "u2", name: "Devon Price", email: "devon@bostonbaking.co", role: "sample_request" },
  { id: "u3", name: "Lena Okafor", email: "lena@bostonbaking.co", role: "sample_creation" },
  { id: "u4", name: "Rafi Mehta", email: "rafi@bostonbaking.co", role: "formulations" },
  { id: "u5", name: "June Castellanos", email: "june@bostonbaking.co", role: "pricing" },
  { id: "u8", name: "Ingrid Vasquez", email: "ingrid@bostonbaking.co", role: "product_spec" },
  { id: "u6", name: "Theo Lindgren", email: "theo@bostonbaking.co", role: "spec_team" },
  { id: "u7", name: "Priya Raman", email: "priya@bostonbaking.co", role: "senior_manager" },
  { id: "u9", name: "Marcus Webb", email: "mwebb@bostonbaking.co", role: "manufacturing" },
  { id: "c1", name: "Alicia Grant", email: "agrant@fenwayfoodhall.com", role: "customer", company: "Fenway Food Hall" },
  { id: "c2", name: "Dana Ricci", email: "dricci@harborview.cafe", role: "customer", company: "Harborview Cafés" },
  { id: "c3", name: "Sarah Whitfield", email: "sarah@lccreamery.com", role: "customer", company: "Little Compton Creamery" },
  { id: "c4", name: "Elise Moreau", email: "elise@capeanncoffee.com", role: "customer", company: "Cape Ann Coffee Roasters" },
];
export const DEMO_PASSWORD = "bake2026";
