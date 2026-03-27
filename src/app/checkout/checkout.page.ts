import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle,
  IonToolbar, IonIcon, IonButton, IonCol, IonRow, 
  IonItem, IonInput,  IonButtons, IonBackButton,
  IonFooter, IonRadioGroup, IonRadio 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  checkmarkDoneOutline, arrowBackOutline, locationOutline, 
  cardOutline, receiptOutline, chevronForwardOutline, 
  homeOutline, businessOutline, walletOutline 
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { CartService } from '../_services/cart.service';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { AuthService } from '../_services/auth.service';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, 
    IonItem, IonRow, IonCol, IonButton, IonIcon, 
    IonContent, IonHeader, IonToolbar, IonButtons, IonTitle,
    IonBackButton, IonFooter, IonRadioGroup, IonRadio, IonInput
  ]
})
export class CheckoutPage implements OnInit {
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private router = inject(Router);

  currentStep: 'address' | 'payment' | 'review' = 'address';
  totalAmount = 0;
  
  addressForm!: FormGroup;
  paymentForm!: FormGroup;
  currentUserProfile: any;

  constructor() { 
    addIcons({ 
      checkmarkDoneOutline, arrowBackOutline, locationOutline, 
      cardOutline, receiptOutline, chevronForwardOutline,
      homeOutline, businessOutline, walletOutline
    }); 
  }

  ngOnInit() {
    this.totalAmount = this.cartService.getTotalAmount();
    this.initForms();
    this.auth.userProfile$.subscribe(profile => {
      this.currentUserProfile = profile;
    });
  }

  initForms() {
    this.addressForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      addressType: ['Home'],
      fullAddress: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.paymentForm = this.fb.group({
      method: ['cod', Validators.required],
      cardNumber: [''],
      expiry: [''],
      cvv: ['']
    });

    // Dynamic validation for card details
    this.paymentForm.get('method')?.valueChanges.subscribe(method => {
      if (method === 'card') {
        this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern('^[0-9]{16}$')]);
        this.paymentForm.get('expiry')?.setValidators([Validators.required]);
        this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern('^[0-9]{3}$')]);
      } else {
        this.paymentForm.get('cardNumber')?.clearValidators();
        this.paymentForm.get('expiry')?.clearValidators();
        this.paymentForm.get('cvv')?.clearValidators();
      }
      this.paymentForm.get('cardNumber')?.updateValueAndValidity();
      this.paymentForm.get('expiry')?.updateValueAndValidity();
      this.paymentForm.get('cvv')?.updateValueAndValidity();
    });
  }

  nextStep() {
    if (this.currentStep === 'address') {
      if (this.addressForm.valid) this.currentStep = 'payment';
      else this.showAlert('Invalid Data', 'Please fill the address correctly.');
    } else if (this.currentStep === 'payment') {
      if (this.paymentForm.valid) this.currentStep = 'review';
      else this.showAlert('Invalid Data', 'Please complete payment details.');
    }
  }

  prevStep() {
    if (this.currentStep === 'payment') this.currentStep = 'address';
    else if (this.currentStep === 'review') this.currentStep = 'payment';
  }

  async placeOrder() {
    if (!this.currentUserProfile) {
      this.showAlert('Error', 'User profile not loaded.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Processing Your Order...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
      const orderData = {
        orderId,
        uid: this.currentUserProfile.uid,
        email: this.currentUserProfile.email,
        orgId: this.currentUserProfile.orgId,
        orgName: this.currentUserProfile.orgName,
        items: this.cartService.getCart(),
        totalAmount: this.totalAmount,
        address: this.addressForm.value,
        paymentMethod: this.paymentForm.get('method')?.value,
        status: 'Preparing',
        createdAt: new Date()
      };

      await setDoc(doc(this.firestore, `orders/${orderId}`), orderData);
      
      await loading.dismiss();
      const alert = await this.alertController.create({
        header: 'Order Placed!',
        message: 'Your delicious meal is being prepared.',
        buttons: [{
          text: 'OK',
          handler: () => {
             this.cartService.clearCart();
             this.router.navigate(['/home']);
          }
        }]
      });
      await alert.present();
    } catch (e: any) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to place order: ' + e.message);
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
