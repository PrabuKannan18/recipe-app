import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonCard, 
  IonAvatar, IonItem, IonList, IonIcon, IonLabel, 
  IonBadge, IonListHeader, IonButton
} from '@ionic/angular/standalone';
import { HeaderPage } from '../header/header.page';
import { addIcons } from 'ionicons';
import { UserProfile } from '../core/models/firestore.models';
import { 
  bagHandleOutline, logOutOutline, personOutline, locationOutline, 
  callOutline, mailOutline, heartOutline, settingsOutline, 
  chevronForwardOutline, starOutline, walletOutline, 
  helpCircleOutline, moonOutline, shieldCheckmarkOutline,
  statsChartOutline
} from 'ionicons/icons';
import { AuthService } from '../_services/auth.service';
import { CartService } from '../_services/cart.service';
import { WishlistService } from '../_services/wishlist.service';
import { Router, RouterLink } from '@angular/router';
import { Firestore, collection, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { AlertController, IonToggle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.page.html',
  styleUrls: ['./myaccount.page.scss'],
  standalone: true,
  imports: [
    IonLabel, IonIcon, IonList, IonItem, IonAvatar, 
    IonCard, IonContent, IonBadge, IonListHeader, IonButton,
    IonToggle, CommonModule, FormsModule, HeaderPage, RouterLink
  ]
})
export class MyaccountPage implements OnInit {
  private auth = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);

  username: string | null = null;
  userEmail: string | null = null;
  currentYear = new Date().getFullYear();
  wishlistCount = 0;
  orderCount = 0;
  points = 0;
  isDarkMode = false;
  userProfile: UserProfile | null = null;

  constructor() { 
    addIcons({ 
      locationOutline, callOutline, mailOutline, personOutline, 
      bagHandleOutline, logOutOutline, heartOutline, settingsOutline, 
      chevronForwardOutline, starOutline, walletOutline, 
      helpCircleOutline, moonOutline, shieldCheckmarkOutline,
      statsChartOutline
    }); 
  }

  ngOnInit() {
    this.auth.userProfile$.subscribe(async profile => {
      this.userProfile = profile;
      if (profile) {
        this.userEmail = profile.email;
        this.username = profile.displayName || profile.email.split('@')[0];
        
        try {
          const ordersQuery = query(collection(this.firestore, 'orders'), where('userId', '==', profile.uid));
          const snap = await getDocs(ordersQuery);
          this.orderCount = snap.size;
          this.points = this.orderCount * 50;
        } catch (e) {
          console.error("Error fetching orders:", e);
        }
      }
    });
    this.wishlistCount = this.wishlistService.get().length;
    this.isDarkMode = document.body.classList.contains('dark');
  }

  async updateAvatar() {
    if (!this.userProfile) return;
    const alert = await this.alertController.create({
      header: 'Update Avatar',
      inputs: [{ name: 'photoURL', type: 'url', placeholder: 'Enter Image URL', value: this.userProfile.photoURL }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Save', 
          handler: (data) => {
            if (data.photoURL && this.userProfile) {
              updateDoc(doc(this.firestore, `users/${this.userProfile.uid}`), { photoURL: data.photoURL });
              this.userProfile.photoURL = data.photoURL;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editProfile() {
    if (!this.userProfile) return;
    const alert = await this.alertController.create({
      header: 'Edit Name',
      inputs: [{ name: 'displayName', type: 'text', placeholder: 'Enter your name', value: this.username }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Save', 
          handler: (data) => {
            if (data.displayName && this.userProfile) {
              updateDoc(doc(this.firestore, `users/${this.userProfile.uid}`), { displayName: data.displayName });
              this.username = data.displayName;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async logout() {
    await this.auth.logout();
  }
}