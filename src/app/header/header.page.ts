import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonBadge, IonLabel, IonText, IonInput 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  search, locationOutline, personCircleOutline, 
  cartOutline, chevronDownOutline, searchOutline 
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { CartService } from '../_services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.page.html',
  styleUrls: ['./header.page.scss'],
  standalone: true,
  imports: [
    RouterLink, IonIcon, IonButton, IonButtons, 
    IonHeader, IonToolbar, IonBadge, IonLabel, 
    IonText, IonInput, CommonModule, FormsModule
  ]
})
export class HeaderPage implements OnInit {
  cartCount = 0;
  showSearch = true;

  constructor(private cartService: CartService) { 
    addIcons({ 
      search, locationOutline, personCircleOutline, 
      cartOutline, chevronDownOutline, searchOutline 
    }); 
  }

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
  }

  selectLocation() {
    console.log('Location Selection triggered');
  }
}
