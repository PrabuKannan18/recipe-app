import { Injectable, inject } from '@angular/core';
import { CartItem } from '../_models/recipe';
import { BehaviorSubject } from 'rxjs';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private firestore = inject(Firestore);
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private currentUid: string | null = null;
  private currentOrgId: string | null = null;

  constructor() {}

  async loadUserCart(uid: string, orgId: string) {
    this.currentUid = uid;
    this.currentOrgId = orgId;
    
    // Try Firestore first
    const cartDoc = await getDoc(doc(this.firestore, `carts/${uid}`));
    if (cartDoc.exists()) {
      const data = cartDoc.data();
      this.cartSubject.next(data['items'] || []);
    } else {
      // Fallback to local
      const savedCart = localStorage.getItem(`cart_${uid}`);
      const cart = savedCart ? JSON.parse(savedCart) : [];
      this.cartSubject.next(cart);
    }
  }

  async saveUserCart(uid: string, orgId: string) {
    const items = this.cartSubject.value;
    const totalAmount = this.getTotalAmount();
    
    // Save to Firestore so Super Admin can see
    await setDoc(doc(this.firestore, `carts/${uid}`), {
      uid,
      items,
      totalAmount,
      orgId,
      updatedAt: new Date()
    });

    // Also local backup
    localStorage.setItem(`cart_${uid}`, JSON.stringify(items));
  }

  private saveLocally(items: CartItem[]) {
    this.cartSubject.next(items);
    if (this.currentUid) {
      localStorage.setItem(`cart_${this.currentUid}`, JSON.stringify(items));
      // Proactively save to Firestore
      this.saveUserCart(this.currentUid, this.currentOrgId || 'default');
    }
  }

  addToCart(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
    let updatedCart;

    if (existingItem) {
      updatedCart = currentCart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
          : cartItem
      );
    } else {
      updatedCart = [...currentCart, { ...item }];
    }
    this.saveLocally(updatedCart);
  }

  removeFromCart(itemId: string) {
    const updatedCart = this.cartSubject.value.filter(item => item.id !== itemId);
    this.saveLocally(updatedCart);
  }

  increaseQuantity(item: CartItem) {
    const updatedCart = this.cartSubject.value.map(cartItem => 
      cartItem.id === item.id 
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    );
    this.saveLocally(updatedCart);
  }

  decreaseQuantity(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity > 1) {
        const updatedCart = currentCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
        this.saveLocally(updatedCart);
      } else {
        this.removeFromCart(item.id);
      }
    }
  }

  clearCart() {
    this.cartSubject.next([]);
    if (this.currentUid) {
      localStorage.removeItem(`cart_${this.currentUid}`);
      this.saveUserCart(this.currentUid, this.currentOrgId || 'default');
    }
  }

  getCart() {
    return this.cartSubject.value;
  }

  getTotalAmount() {
    return this.cartSubject.value.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getCartCount() {
    return this.cartSubject.value.reduce((count, item) => count + item.quantity, 0);
  }
}