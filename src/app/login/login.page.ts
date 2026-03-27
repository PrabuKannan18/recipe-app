import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  person, logoGoogle, logoFacebook, eye, 
  lockClosedOutline, mailOutline, restaurant, 
  logoGoogle as googleIcon 
} from 'ionicons/icons';
import { 
  IonContent, IonInputPasswordToggle, IonItem, IonInput, 
  IonButton, IonIcon, AlertController, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../_services/auth.service';
import { CartService } from '../_services/cart.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonSpinner, IonIcon, IonInputPasswordToggle, RouterLink, 
    IonButton, IonInput, IonItem, IonContent, CommonModule, FormsModule
  ]
})
export class LoginPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cartService = inject(CartService);
  private alertController = inject(AlertController);

  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor() { 
    addIcons({ 
      person, lockClosedOutline, logoGoogle, 
      logoFacebook, eye, mailOutline, restaurant 
    }); 
  }

  ngOnInit() {}

  async login() {
    if (!this.email || !this.password) {
      this.showAlert('Incomplete details', 'Please enter both email and password.');
      return;
    }

    this.isLoading = true;
    try {
      await this.auth.login(this.email, this.password);
      this.email = '';
      this.password = '';
    } catch (error: any) {
      this.showAlert('Login Failed', error.message || 'Check your credentials.');
    } finally {
      this.isLoading = false;
    }
  }

  signInWithGoogle() {
    this.auth.googleSignIn();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['Ok']
    });
    await alert.present();
  }
}
