// recipe.ts
export interface Recipe {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    imageUrl: string;
    rating?: number;
    reviewCount?: number;
    isAvailable?: boolean;
    isTrending?: boolean;
    cookingTime?: string;
    distance?: string;
    orgId?: string;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  icon: string;
  color?: string;
}
