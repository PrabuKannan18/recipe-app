import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonInputPasswordToggle, IonItem, IonInput, 
  IonButton, IonIcon, IonSpinner, AlertController,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  person, lockClosedOutline, logoGoogle, 
  mailOutline, restaurant, shieldCheckmarkOutline,
  businessOutline, peopleOutline, keyOutline
} from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonInputPasswordToggle, RouterLink, 
    IonButton, IonInput, IonItem, IonContent, 
    CommonModule, FormsModule, IonSpinner,
    IonSelect, IonSelectOption
  ]
})
export class SignupPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  email: string = '';
  password: string = '';
  cpassword: string = '';
  role: 'member' | 'manager' = 'member';
  orgName: string = '';
  joinCode: string = '';
  isLoading: boolean = false;

  constructor() {
    addIcons({ 
      person, lockClosedOutline, logoGoogle, 
      mailOutline, restaurant, shieldCheckmarkOutline,
      businessOutline, peopleOutline, keyOutline
    });
  }

  ngOnInit() {}

  async signup() {
    if (!this.email || !this.password || !this.cpassword) {
      await this.showAlert('Incomplete details', 'Please fill in all fields.');
      return;
    }

    if (this.password !== this.cpassword) {
      await this.showAlert('Password mismatch', 'The passwords do not match.');
      return;
    }

    this.isLoading = true;
    try {
      await this.auth.signup(this.email, this.password, this.orgName, this.role, this.joinCode);
    } catch (error: any) {
      this.showAlert('Signup Failed', error.message || 'Could not create account.');
    } finally {
      this.isLoading = false;
    }
  }

  googleSignup() {
    this.auth.googleSignIn();
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
