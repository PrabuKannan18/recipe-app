import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonButton, 
  IonIcon, IonBackButton, IonButtons, AlertController,
  IonBadge, IonFooter 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cartOutline, heartOutline, heart, shareOutline, 
  star, timeOutline, checkmarkCircleOutline, 
  chevronBackOutline, addOutline, removeOutline 
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../_services/recipe.service';
import { CartService } from '../_services/cart.service';
import { WishlistService } from '../_services/wishlist.service';
import { Recipe } from '../_models/recipe';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
  standalone: true,
  imports: [
    IonButtons, IonBackButton, IonIcon, IonButton, 
    IonContent, IonHeader, IonToolbar, IonBadge, 
    IonFooter, CommonModule, FormsModule
  ]
})
export class ProductDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private alertController = inject(AlertController);

  recipe: Recipe | undefined;
  quantity: number = 1;
  isLiked: boolean = false;

  constructor() { 
    addIcons({ 
      cartOutline, heartOutline, heart, shareOutline, 
      star, timeOutline, checkmarkCircleOutline, 
      chevronBackOutline, addOutline, removeOutline 
    }); 
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipeService.getRecipeById(id).subscribe((recipe: Recipe) => {
        this.recipe = recipe;
      });
    }
  }

  increaseQty() {
    this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (this.recipe) {
      this.cartService.addToCart({
        id: this.recipe.id,
        name: this.recipe.name,
        price: this.recipe.price,
        quantity: this.quantity,
        image: this.recipe.imageUrl
      });
      this.showAlert('Success', `${this.recipe.name} added to cart!`);
    }
  }

  toggleWishlist() {
    this.isLiked = !this.isLiked;
    if (this.recipe) {
      if (this.isLiked) {
        this.wishlistService.add(this.recipe);
      } else {
        // Remove logic
      }
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
