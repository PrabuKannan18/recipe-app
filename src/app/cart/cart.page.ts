import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, 
  IonLabel, IonIcon, IonButtons, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, cartOutline, removeOutline, 
  trashOutline, sadOutline, arrowBackOutline, 
  receiptOutline, chevronForwardOutline 
} from 'ionicons/icons';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../_services/cart.service';
import { CartItem } from '../_models/recipe';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    RouterLink, IonIcon, IonLabel, IonItem, IonButton, IonContent, 
    IonHeader, IonTitle, IonToolbar, IonFooter, IonButtons,
    CommonModule, FormsModule
  ]
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);

  cart$: Observable<CartItem[]> = this.cartService.cart$;
  totalAmount$: Observable<number> = this.cart$.pipe(
    map(items => items.reduce((acc, item) => acc + (item.price * item.quantity), 0))
  );

  deliveryFee = 40;
  taxAmount$: Observable<number> = this.totalAmount$.pipe(map(total => total * 0.05));
  grandTotal$: Observable<number> = this.totalAmount$.pipe(
    map(total => total > 0 ? total + this.deliveryFee + (total * 0.05) : 0)
  );

  constructor() {
    addIcons({ 
      arrowBackOutline, addOutline, removeOutline, 
      trashOutline, cartOutline, sadOutline, 
      receiptOutline, chevronForwardOutline 
    });
  }

  ngOnInit() {}

  increaseQuantity(item: CartItem) {
    this.cartService.increaseQuantity(item);
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.decreaseQuantity(item);
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}