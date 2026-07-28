import { STORAGE_TEMPS, CATEGORY_FIELDS } from '../constants/products.js';

export function deriveDiscoveryContext(opp) {
  const text = (
    opp.conversations.map((c) => c.note).join(" ") +
    " " + opp.product +
    " " + (opp.profile ? `${opp.profile.category} ${opp.profile.businessType}` : "")
  ).toLowerCase();
  const has = (kw) => text.includes(kw);
  const sugg = { allergens: [], certifications: [], storage: "", shelfLife: "", unitSize: "", packFormat: "", notes: [] };

  // Allergens & certifications
  const glutenFree = has("gluten-free") || has("gluten free") || has("certified-gf") || has("certified gf");
  if (glutenFree) {
    sugg.certifications.push("Certified gluten-free");
    sugg.notes.push("gluten-free requirement stated");
  } else if (["wheat", "flour", "dough", "bagel", "focaccia", "cookie", "bun", "boule", "pie", "cake", "shortbread", "bar", "brownie", "whoopie", "crumb"].some(has)) {
    sugg.allergens.push("Wheat / gluten");
  }
  if (["butter", "dairy", "cream", "milk", "cheese", "frosting"].some(has)) sugg.allergens.push("Dairy");
  if (has("egg")) sugg.allergens.push("Egg");
  if (has("chocolate") || has("soy")) sugg.allergens.push("Soy");
  if (has("sesame")) sugg.allergens.push("Sesame");
  if (has("coconut")) sugg.allergens.push("Coconut");
  if (has("nut-free") || has("nut free")) sugg.notes.push("nut-free line required");
  else if (["walnut", "pecan", "almond", "hazelnut", "cashew"].some(has)) sugg.allergens.push("Tree nuts");
  if (has("peanut")) sugg.allergens.push("Peanuts");
  if (has("kosher")) sugg.certifications.push("Kosher (KVH Dairy)");
  if (has("clean label") || has("clean-label")) sugg.certifications.push("Clean label");
  if (has("non-gmo") || has("non gmo")) sugg.certifications.push("Non-GMO");
  if (has("palm oil") || has("rspo")) sugg.certifications.push("RSPO palm oil");

  // Storage / distribution
  if (["frozen", "ice cream", "par-bake", "par bake", "par-baked", "freezer"].some(has)) sugg.storage = STORAGE_TEMPS[2];
  else if (["chilled", "refrigerat", "cold chain"].some(has)) sugg.storage = STORAGE_TEMPS[1];

  // Shelf life ("14 days", "3 weeks")
  const life = text.match(/(\d+)\s*(day|week)s?/);
  if (life) {
    const n = parseInt(life[1], 10) * (life[2] === "week" ? 7 : 1);
    if (n > 0 && n <= 120) sugg.shelfLife = `${n} days`;
  }

  // Unit size ("85 g", "4 oz")
  const size = text.match(/(\d+)\s?(g|oz)\b/);
  if (size) sugg.unitSize = `${size[1]} ${size[2]}`;

  if (has("individually wrapped") || has("wrapped")) sugg.packFormat = "Individually wrapped";

  sugg.allergens = [...new Set(sugg.allergens)];
  sugg.certifications = [...new Set(sugg.certifications)];
  return sugg;
}

export function matchStorageTemp(v) {
  if (!v) return "";
  const low = String(v).toLowerCase();
  if (low.includes("frozen")) return STORAGE_TEMPS[2];
  if (low.includes("chill") || low.includes("refrig")) return STORAGE_TEMPS[1];
  if (low.includes("ambient")) return STORAGE_TEMPS[0];
  return STORAGE_TEMPS.includes(v) ? v : "";
}

export function resolveCategory(opp) {
  if (opp.profile && opp.profile.category && CATEGORY_FIELDS[opp.profile.category]) return opp.profile.category;
  const t = (opp.product + " " + opp.conversations.map((c) => c.note).join(" ")).toLowerCase();
  if (t.includes("cookie") || t.includes("shortbread")) return "Cookies";
  if (t.includes("brownie")) return "Brownies";
  if (t.includes("whoopie")) return "Whoopie Pies";
  if (t.includes("crumb cake") || t.includes("coffee cake")) return "Coffee & Crumb Cakes";
  if (t.includes("bundt")) return "Bundt Cakes";
  if (t.includes("cupcake")) return "Cupcake Blanks";
  if (t.includes("pie")) return "Pie Shells";
  if (t.includes("bar")) return "Bars";
  if (["bagel", "focaccia", "boule", "bun", "bread", "loaf"].some((k) => t.includes(k))) return "Breads & Buns";
  return null;
}

export function deriveCategoryDefaults(category, opp) {
  const t = (opp.product + " " + opp.conversations.map((c) => c.note).join(" ")).toLowerCase();
  const d = {};
  if (category === "Cookies") {
    if (t.includes("chewy")) d.texture = "Soft & chewy";
    else if (t.includes("crispy") || t.includes("crisp")) d.texture = "Crispy";
  }
  if (category === "Brownies") {
    if (t.includes("fudgy") || t.includes("fudge")) d.style = "Fudgy";
    else if (t.includes("cakey")) d.style = "Cakey";
  }
  if ((category === "Pie Shells" || category === "Breads & Buns") && (t.includes("par-bake") || t.includes("par bake") || t.includes("par-baked"))) {
    d.bakeState = "Par-baked";
  }
  return d;
}

export function getShipments(opp) {
  const f = opp.fulfillment || {};
  if (Array.isArray(f.shipments)) return f.shipments;
  return f.shipment ? [f.shipment] : [];
}
export function fmtBoxes(v) {
  if (!v) return v;
  const t = String(v).trim();
  return /^\d+$/.test(t) ? `${t} boxes` : t;
}
