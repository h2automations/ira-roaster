export const SIZE_OPTIONS_MEN = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL"
] as const;
export const SIZE_OPTIONS_YOUTH = ["8Y", "10Y", "12Y", "14Y", "16Y"] as const;
export const SIZE_OPTIONS_WOMEN = ["XS", "S", "M", "L", "XL", "2XL"] as const;
export const SLEEVE_TYPES = ["HALF", "FULL"] as const;
export const GENDER_OPTIONS = ["MEN", "WOMEN", "YOUTH"] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];

export function getSizeOptionsByGender(gender: Gender) {
  if (gender === "YOUTH") return SIZE_OPTIONS_YOUTH;
  if (gender === "WOMEN") return SIZE_OPTIONS_WOMEN;
  return SIZE_OPTIONS_MEN;
}

export const PRODUCT_OPTIONS = [
  {
    key: "playingTShirt",
    label: "Playing T-Shirt",
    sizeField: "sizeUS",
    qtyField: "playingTShirtQty"
  },
  {
    key: "trousers",
    label: "Trousers",
    sizeField: "trousersSizeUS",
    qtyField: "trousersQty"
  },
  {
    key: "trainingTShirt",
    label: "Training T-Shirt",
    sizeField: "trainingTShirtSizeUS",
    qtyField: "trainingTShirtQty"
  },
  {
    key: "shorts",
    label: "Shorts",
    sizeField: "shortsSizeUS",
    qtyField: "shortsQty"
  },
  {
    key: "travelJacket",
    label: "Travel Jacket",
    sizeField: "jacketSizeUS",
    qtyField: "jacketQty"
  },
  {
    key: "travelTrousers",
    label: "Travel Trousers",
    sizeField: "travelTrousersSizeUS",
    qtyField: "travelTrousersQty"
  },
  {
    key: "sleevelessJacket",
    label: "Sleeveless Jacket",
    sizeField: "sleevelessJacketSizeUS",
    qtyField: "sleevelessJacketQty"
  },
  {
    key: "travelPolo",
    label: "Travel Polo",
    sizeField: "travelPoloSizeUS",
    qtyField: "travelPoloQty"
  },
  {
    key: "hoodie",
    label: "Hoodie",
    sizeField: "hoodieSizeUS",
    qtyField: "hoodieQty"
  },
  {
    key: "hat",
    label: "Hat",
    qtyField: "hatQty"
  },
  {
    key: "cap",
    label: "Cap",
    qtyField: "capQty"
  }
] as const;

export type ProductKey = (typeof PRODUCT_OPTIONS)[number]["key"];
type ProductOption = (typeof PRODUCT_OPTIONS)[number];
export type ProductSizeField = ProductOption extends {
  sizeField: infer S extends string;
}
  ? S
  : never;
export type ProductQtyField = ProductOption extends {
  qtyField: infer Q extends string;
}
  ? Q
  : never;

export const DEFAULT_ENABLED_PRODUCTS_SUBLIMATION: ProductKey[] = [
  "playingTShirt",
  "trousers",
  "trainingTShirt",
  "shorts",
  "travelJacket",
  "travelTrousers",
  "sleevelessJacket",
  "travelPolo",
  "hat",
  "cap"
];

export const DEFAULT_ENABLED_PRODUCTS: ProductKey[] =
  DEFAULT_ENABLED_PRODUCTS_SUBLIMATION;

export function getDefaultEnabledProducts(template: string): ProductKey[] {
  return DEFAULT_ENABLED_PRODUCTS_SUBLIMATION;
}

export function isValidProductKey(value: string): value is ProductKey {
  return PRODUCT_OPTIONS.some((p) => p.key === value);
}
