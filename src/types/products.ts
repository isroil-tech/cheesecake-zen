export interface Product {
  id: string;
  name: { uz: string; ru: string };
  description: { uz: string; ru: string };
  category: string; // Database UUID for category
  image: string;
  priceWhole: number;
  priceSlice: number;
  slicesPerWhole: number;
  wholeStock: number;
  sliceStock: number;
  wholeVariantId?: string;
  sliceVariantId?: string;
}



export function formatPrice(price: number): string {
  return price.toLocaleString('uz-UZ');
}
