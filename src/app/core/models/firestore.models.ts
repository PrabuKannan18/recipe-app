export interface Organization {
  id: string;
  name: string;
  managerId: string; // UID of the organization manager
  managerEmail: string;
  joinCode: string;
  logoUrl?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  addresses: Address[];
  role: 'member' | 'manager' | 'superadmin';
  orgId: string; // The organization this user belongs to
  orgName?: string;
  createdAt: any;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  fullAddress: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}

export interface FoodProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isAvailable: boolean;
  isTrending: boolean;
  tags: string[];
  orgId: string; // Added to filter items by organization
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string; 
  order: number;
}

export interface CartItem {
  id: string; // Matches product ID
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface UserCart {
  uid: string;
  email: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: any;
  orgId: string;
}

export interface Order {
  orderId: string;
  userId: string;
  userName: string;
  orgId: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee: number;
  taxes: number;
  grandTotal: number;
  address: Address;
  paymentMethod: string;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: any;
}
