import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { 
  IonicSlides, AlertController, 
  IonContent, IonButton, IonIcon, IonGrid, 
  IonRow, IonCol, IonLabel, IonCard, IonCardHeader, IonCardSubtitle, 
  IonCardTitle, IonCardContent, IonSkeletonText, IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  menuOutline, searchOutline, notificationsOutline, star, 
  timeOutline, heartOutline, cartOutline, shareSocialOutline, 
  addOutline, removeOutline, chevronForwardOutline, schoolOutline,
  shieldCheckmarkOutline, restaurantOutline
} from 'ionicons/icons';
import { register } from 'swiper/element/bundle';
import { HeaderPage } from '../header/header.page';
import { FooterPage } from '../footer/footer.page';
import { Recipe, CategoryCard } from '../_models/recipe';
import { RecipeService } from '../_services/recipe.service';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../_services/cart.service';
import { WishlistService } from '../_services/wishlist.service';
import { AuthService } from '../_services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

register();

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonIcon, IonButton, 
    IonContent, IonGrid, IonRow, IonCol, 
    IonLabel, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, 
    IonCardContent, IonSkeletonText, IonAvatar, HeaderPage, FooterPage, RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private alertController = inject(AlertController);
  private auth = inject(AuthService);
  private firestore = inject(Firestore);

  isLoading = true;
  recipes: Recipe[] = [];
  trendingRecipes: Recipe[] = [];
  userOrgId: string | undefined;
  orgDetails: any | null = null;
  isManager = false;

  banners = [
    { image: 'home6.avif', title: 'Flat 50% Off', subtitle: 'On your first 3 orders' },
    { image: 'home3.avif', title: 'Free Delivery', subtitle: 'Above ₹199' },
    { image: 'home5.jpg', title: 'Top Rated', subtitle: 'Curated for you' }
  ];

  categories: CategoryCard[] = [
    { id: '1', name: 'Pizza', icon: 'pizza-outline', color: '#ff4757' },
    { id: '2', name: 'Burgers', icon: 'fast-food-outline', color: '#ffa502' },
    { id: '3', name: 'Sushi', icon: 'fish-outline', color: '#2ed573' },
    { id: '4', name: 'Drinks', icon: 'beer-outline', color: '#1e90ff' },
    { id: '5', name: 'Ice Cream', icon: 'ice-cream-outline', color: '#ff6b81' },
    { id: '6', name: 'Noodles', icon: 'restaurant-outline', color: '#2f3542' }
  ];

  swiperModules = [IonicSlides];

  constructor() {
    addIcons({
      menuOutline, searchOutline, notificationsOutline, star, 
      timeOutline, heartOutline, cartOutline, shareSocialOutline, 
      addOutline, removeOutline, chevronForwardOutline, schoolOutline,
      shieldCheckmarkOutline, restaurantOutline
    });
  }

  ngOnInit() {
    this.auth.userProfile$.subscribe(async (profile: any) => {
      if (profile) {
        this.userOrgId = profile.orgId;
        this.isManager = profile.role === 'manager' || profile.role === 'superadmin';
        this.loadData();
        
        // Fetch org details for branding
        const orgDoc = await getDoc(doc(this.firestore, `organizations/${profile.orgId}`));
        if (orgDoc.exists()) {
          this.orgDetails = orgDoc.data();
        }
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.recipeService.getRecipes(this.userOrgId).subscribe({
      next: (data) => {
        this.recipes = data;
        this.trendingRecipes = data.slice(0, 4);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  viewRecipe(id: string) {
    this.router.navigate([`/home/${id}`]);
  }

  orderNow(recipe: Recipe) {
    this.cartService.addToCart({
      id: recipe.id,
      name: recipe.name,
      price: recipe.price,
      quantity: 1,
      image: recipe.imageUrl
    });
    this.showalert(`${recipe.name} added to cart!`);
  }

  toggleWishlist(recipe: Recipe) {
    this.showalert(`${recipe.name} added to wishlist`);
  }

  async showalert(header: string) {
    const alert = await this.alertController.create({
      header: header,
      buttons: ['Ok']
    });
    await alert.present();
  }
}
