// Industry-specific option sets (SQF/HACCP facility, KVH Kosher, RSPO)
export const ALLERGENS = ["Wheat / gluten", "Dairy", "Egg", "Soy", "Peanuts", "Tree nuts", "Sesame", "Coconut"];
export const CERTIFICATIONS = ["Kosher (KVH Dairy)", "RSPO palm oil", "Clean label", "Non-GMO", "Certified gluten-free"];
export const STORAGE_TEMPS = ["Ambient", "Chilled (33–40°F)", "Frozen (0°F / -18°C)"];
export const STABILITY_CHECKS = ["Freeze–thaw cycle", "Ambient shelf test", "Chilled distribution", "Par-bake regeneration"];
export const BUSINESS_TYPES = ["Prepared Foods / Food Service", "Retail / In-Store Bakery (Private Label)", "Production Partnering"];
export const PRODUCT_CATEGORIES = ["Cookies", "Brownies", "Whoopie Pies", "Coffee & Crumb Cakes", "Bundt Cakes", "Cupcake Blanks", "Pie Shells", "Breads & Buns", "Bars", "Other"];
export const PROTOCOL_ATTESTATIONS = [
  "HACCP plan reviewed for this product",
  "SQF facility requirements verified",
  "Allergen control & line changeover confirmed",
  "Lot sheet dating & label compliance checked",
];

export const PROCESS_OPTIONS = [
  "Laminated pastry — Line A",
  "Bar & cookie — Line B",
  "Bread & boule — Line C",
  "Filled pastry — Line D",
];
export const CATEGORY_OPTIONS = ["Bakery — ambient", "Bakery — chilled", "Bakery — frozen / par-baked"];

export const CATEGORY_FIELDS = {
  "Cookies": [
    { key: "texture", label: "Texture target", type: "select", options: ["Soft & chewy", "Crispy", "Crunchy", "Cakey"] },
    { key: "inclusions", label: "Inclusions & ratio", placeholder: "e.g. 20% choc chunks, flaky salt finish" },
    { key: "diameter", label: "Baked diameter / spread", placeholder: "e.g. 3.5 in" },
    { key: "depositWeight", label: "Dough deposit weight", placeholder: "e.g. 95 g raw" },
  ],
  "Brownies": [
    { key: "style", label: "Style", type: "select", options: ["Fudgy", "Chewy", "Cakey"] },
    { key: "cutSize", label: "Cut size", placeholder: "e.g. 2×2 in, 12-cut sheet" },
    { key: "topping", label: "Topping / swirl", placeholder: "e.g. walnut, cheesecake swirl" },
    { key: "edges", label: "Edge trim", type: "select", options: ["Trimmed", "Untrimmed"] },
  ],
  "Whoopie Pies": [
    { key: "filling", label: "Filling", placeholder: "e.g. classic vanilla creme" },
    { key: "fillingRatio", label: "Cake : filling ratio", placeholder: "e.g. 2:1" },
    { key: "cakeDiameter", label: "Cake shell diameter", placeholder: "e.g. 3 in shells" },
  ],
  "Coffee & Crumb Cakes": [
    { key: "streusel", label: "Streusel / crumb topping", placeholder: "e.g. cinnamon streusel, 30% coverage" },
    { key: "format", label: "Format", type: "select", options: ["Whole cake", "Pre-sliced", "Individual"] },
    { key: "glaze", label: "Glaze / drizzle", placeholder: "e.g. vanilla drizzle" },
  ],
  "Bundt Cakes": [
    { key: "panSize", label: "Pan size", placeholder: "e.g. 10 in / 6 in mini" },
    { key: "finish", label: "Finish", type: "select", options: ["Unfinished (finished in-store)", "Glazed", "Dusted"] },
  ],
  "Cupcake Blanks": [
    { key: "cupSize", label: "Cup size", type: "select", options: ["Standard", "Jumbo", "Mini"] },
    { key: "frostingCompat", label: "Frosting compatibility", placeholder: "e.g. buttercream, stabilized whip" },
  ],
  "Pie Shells": [
    { key: "shellSize", label: "Shell diameter / depth", placeholder: "e.g. 9 in deep dish" },
    { key: "bakeState", label: "Bake state", type: "select", options: ["Raw", "Par-baked", "Fully baked"] },
    { key: "doughType", label: "Dough type", type: "select", options: ["Sweet", "Savory", "All-purpose"] },
    { key: "crimp", label: "Crimp style", placeholder: "e.g. machine crimp" },
  ],
  "Breads & Buns": [
    { key: "crumb", label: "Crumb structure", placeholder: "e.g. open crumb, chewy" },
    { key: "crust", label: "Crust", type: "select", options: ["Soft", "Crisp", "Seeded"] },
    { key: "bakeState", label: "Bake state", type: "select", options: ["Fully baked", "Par-baked"] },
  ],
  "Bars": [
    { key: "dimensions", label: "Bar dimensions", placeholder: "e.g. 4×1.5 in" },
    { key: "layers", label: "Layer structure", placeholder: "e.g. shortbread base + caramel + choc" },
    { key: "coating", label: "Coating / enrobe", placeholder: "e.g. bottom-coated dark chocolate" },
  ],
};
