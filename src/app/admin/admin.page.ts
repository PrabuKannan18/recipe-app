import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, AlertController, 
  IonGrid, IonRow, IonCol, IonItem, IonList, IonInput, IonSelect, 
  IonSelectOption, IonLabel, IonButton, IonTextarea, IonCardContent, 
  IonCardTitle, IonCardHeader, IonIcon, IonButtons, 
  IonSegment, IonSegmentButton, IonThumbnail, 
  IonListHeader, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, search, menu, addOutline, 
  statsChartOutline, cubeOutline, eyeOutline, 
  trashOutline, createOutline, logOutOutline, 
  cashOutline, cartOutline, peopleOutline,
  businessOutline, receiptOutline, cameraOutline,
  keyOutline, copyOutline, cloudUploadOutline
} from 'ionicons/icons';
import { RecipeService } from '../_services/recipe.service';
import { AuthService } from '../_services/auth.service';
import { Recipe } from '../_models/recipe';
import { Observable } from 'rxjs';
import { UserProfile, Organization, UserCart } from '../core/models/firestore.models';
import { Firestore, collection, collectionData, doc, updateDoc, query, where, orderBy, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, IonButtons, IonIcon, IonCardHeader, 
    IonCardTitle, IonCardContent, IonTextarea, 
    IonButton, IonLabel, IonInput, IonList, IonItem, IonCol, 
    IonRow, IonGrid, IonCard, IonContent, IonHeader, IonSelect, 
    IonSelectOption, IonTitle, IonToolbar, IonSegment, 
    IonSegmentButton, IonThumbnail, IonListHeader, IonBadge,
    CommonModule, FormsModule
  ]
})
export class AdminPage implements OnInit {
  private recipeService = inject(RecipeService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private route = inject(ActivatedRoute);

  recipeForm: FormGroup;
  currentMode: string = 'dashboard';
  recipes$: Observable<Recipe[]> | undefined;
  orders$: Observable<any[]> | undefined;
  userProfile: UserProfile | null = null;
  currentOrg: Organization | null = null;

  // Superadmin Data
  organizations$: Observable<Organization[]> | undefined;
  allUsers$: Observable<UserProfile[]> | undefined;
  allCarts$: Observable<UserCart[]> | undefined;

  stats = { revenue: 0, orders: 0, customers: 0 };

  constructor() {
    addIcons({ 
      menu, search, personOutline, addOutline, statsChartOutline, 
      cubeOutline, eyeOutline, trashOutline, createOutline, 
      logOutOutline, cashOutline, cartOutline, peopleOutline,
      businessOutline, receiptOutline, cameraOutline,
      keyOutline, copyOutline, cloudUploadOutline
    });

    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['Main Course', Validators.required],
      imageUrl: ['', Validators.required],
      createdAt: [new Date()]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['segment']) {
        this.currentMode = params['segment'];
      }
    });


    this.auth.userProfile$.subscribe(async profile => {
      this.userProfile = profile;
      if (profile) {
        // Filter formulas
        const recipesRef = collection(this.firestore, 'recipes');
        const ordersRef = collection(this.firestore, 'orders');

        if (profile.role === 'superadmin') {
          this.recipes$ = collectionData(recipesRef, { idField: 'id' }) as Observable<Recipe[]>;
          this.orders$ = collectionData(query(ordersRef, orderBy('createdAt', 'desc')), { idField: 'id' });
          this.loadSuperAdminData();
        } else {
          this.recipes$ = collectionData(query(recipesRef, where('orgId', '==', profile.orgId)), { idField: 'id' }) as Observable<Recipe[]>;
          this.orders$ = collectionData(query(ordersRef, where('orgId', '==', profile.orgId)), { idField: 'id' });
          
          // Fetch manager's own org
          const orgSnap = await getDoc(doc(this.firestore, `organizations/${profile.orgId}`));
          if (orgSnap.exists()) {
            this.currentOrg = orgSnap.data() as Organization;
          }
        }

        this.calculateStats();
      }
    });
  }

  loadSuperAdminData() {
    this.organizations$ = collectionData(collection(this.firestore, 'organizations'), { idField: 'id' }) as Observable<Organization[]>;
    this.allUsers$ = collectionData(collection(this.firestore, 'users'), { idField: 'uid' }) as Observable<UserProfile[]>;
    this.allCarts$ = collectionData(collection(this.firestore, 'carts'), { idField: 'uid' }) as Observable<UserCart[]>;
  }

  calculateStats() {
    this.orders$?.subscribe(orders => {
      this.stats.orders = orders.length;
      this.stats.revenue = orders.reduce((acc, obj) => acc + (obj.totalAmount || 0), 0);
      // Unique customers
      const customers = new Set(orders.map(o => o.uid));
      this.stats.customers = customers.size;
    });
  }

  segmentChanged(event: any) {
    this.currentMode = event.detail.value;
  }

  async addRecipe() {
    if (this.recipeForm.valid && this.userProfile) {
      await this.recipeService.addRecipe(this.recipeForm.value, this.userProfile.orgId);
      this.showalert('Success', 'Product added successfully!');
      this.recipeForm.reset({ category: 'Main Course', imageUrl: '' });
      this.currentMode = 'products';
    } else {
      this.showalert('Error', 'Please fill out the form correctly.');
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    await updateDoc(doc(this.firestore, `orders/${orderId}`), { status });
    this.showalert('Updated', `Order status changed to ${status}`);
  }

  async updateOrgLogo() {
    if (!this.userProfile?.orgId) return;
    const alert = await this.alertController.create({
      header: 'Organization Logo',
      inputs: [{ name: 'logoUrl', type: 'url', placeholder: 'Enter Image URL' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Save', 
          handler: (data) => {
            updateDoc(doc(this.firestore, `organizations/${this.userProfile?.orgId}`), { logoUrl: data.logoUrl });
            this.showalert('Success', 'Logo updated');
          }
        }
      ]
    });
    await alert.present();
  }

  async updateUserRole(user: UserProfile, newRole: 'member' | 'manager') {
    await this.auth.setEmployeeRole(user.uid, newRole);
  }

  async updateUserOrganization(userId: string, orgId: string, orgName: string) {
    if (this.userProfile?.role !== 'superadmin') return;
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { orgId, orgName });
    this.showalert('Success', 'Organization updated');
  }

  deleteProduct(id: string) {
    this.showalert('Info', 'Delete functionality coming soon.');
  }

  logout() {
    this.auth.logout();
  }

  async showalert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['Ok']
    });
    await alert.present();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.recipeForm.patchValue({ imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }
}
