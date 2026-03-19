export interface Product {
  id: string;
  name: { uz: string; ru: string };
  description: { uz: string; ru: string };
  category: 'classic' | 'fruit' | 'special';
  image: string;
  priceWhole: number;
  priceSlice: number;
  slicesPerWhole: number;
  wholeStock: number;
  sliceStock: number;
}

export const products: Product[] = [
  {
    id: 'ny-classic',
    name: { uz: 'New York Classic', ru: 'Нью-Йорк Классик' },
    description: { uz: 'An\'anaviy kremli pishloq tort', ru: 'Классический сливочный чизкейк' },
    category: 'classic',
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&h=600&fit=crop',
    priceWhole: 185000,
    priceSlice: 25000,
    slicesPerWhole: 8,
    wholeStock: 5,
    sliceStock: 12,
  },
  {
    id: 'san-sebastian',
    name: { uz: 'San Sebastyan', ru: 'Сан-Себастьян' },
    description: { uz: 'Kuydirilgan bask pishloq torti', ru: 'Баскский жжёный чизкейк' },
    category: 'classic',
    image: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&h=600&fit=crop',
    priceWhole: 195000,
    priceSlice: 27000,
    slicesPerWhole: 8,
    wholeStock: 3,
    sliceStock: 8,
  },
  {
    id: 'strawberry',
    name: { uz: 'Qulupnayli', ru: 'Клубничный' },
    description: { uz: 'Yangi qulupnay bilan', ru: 'Со свежей клубникой' },
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=600&fit=crop',
    priceWhole: 210000,
    priceSlice: 29000,
    slicesPerWhole: 8,
    wholeStock: 4,
    sliceStock: 15,
  },
  {
    id: 'mango',
    name: { uz: 'Mango', ru: 'Манго' },
    description: { uz: 'Tropik mango pishloq torti', ru: 'Тропический манго чизкейк' },
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=600&fit=crop',
    priceWhole: 220000,
    priceSlice: 30000,
    slicesPerWhole: 8,
    wholeStock: 2,
    sliceStock: 6,
  },
  {
    id: 'blueberry',
    name: { uz: 'Ko\'k gilosli', ru: 'Черничный' },
    description: { uz: 'Tabiiy ko\'k gilos bilan', ru: 'С натуральной черникой' },
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop',
    priceWhole: 215000,
    priceSlice: 29000,
    slicesPerWhole: 8,
    wholeStock: 3,
    sliceStock: 10,
  },
  {
    id: 'matcha',
    name: { uz: 'Matcha', ru: 'Матча' },
    description: { uz: 'Yapon matcha choy bilan', ru: 'С японским чаем матча' },
    category: 'special',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    priceWhole: 235000,
    priceSlice: 32000,
    slicesPerWhole: 8,
    wholeStock: 2,
    sliceStock: 5,
  },
  {
    id: 'chocolate',
    name: { uz: 'Shokoladli', ru: 'Шоколадный' },
    description: { uz: 'Belgiya shokoladi bilan', ru: 'С бельгийским шоколадом' },
    category: 'special',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop',
    priceWhole: 225000,
    priceSlice: 31000,
    slicesPerWhole: 8,
    wholeStock: 4,
    sliceStock: 14,
  },
  {
    id: 'pistachio',
    name: { uz: 'Pistali', ru: 'Фисташковый' },
    description: { uz: 'Premium pista kremi bilan', ru: 'С премиальным фисташковым кремом' },
    category: 'special',
    image: 'https://images.unsplash.com/photo-1519869325930-281384f7e564?w=600&h=600&fit=crop',
    priceWhole: 250000,
    priceSlice: 34000,
    slicesPerWhole: 8,
    wholeStock: 1,
    sliceStock: 3,
  },
  {
    id: 'caramel',
    name: { uz: 'Karamelli', ru: 'Карамельный' },
    description: { uz: 'Tuzli karamel bilan', ru: 'С солёной карамелью' },
    category: 'classic',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop',
    priceWhole: 200000,
    priceSlice: 28000,
    slicesPerWhole: 8,
    wholeStock: 0,
    sliceStock: 4,
  },
  {
    id: 'raspberry',
    name: { uz: 'Malinali', ru: 'Малиновый' },
    description: { uz: 'Yangi malina bilan', ru: 'Со свежей малиной' },
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=600&fit=crop',
    priceWhole: 210000,
    priceSlice: 29000,
    slicesPerWhole: 8,
    wholeStock: 3,
    sliceStock: 0,
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString('uz-UZ');
}
