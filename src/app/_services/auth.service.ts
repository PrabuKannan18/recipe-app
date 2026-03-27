import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { 
  createUserWithEmailAndPassword, GoogleAuthProvider, 
  sendPasswordResetEmail, signInWithEmailAndPassword, 
  signInWithPopup, signOut 
} from 'firebase/auth';
import { CartService } from './cart.service';
import { AlertController } from '@ionic/angular/standalone';
import { UserProfile } from '../core/models/firestore.models';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private cartService = inject(CartService);
  private alertController = inject(AlertController);

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();
  
  currentUserEmail: string | null = null;
  isLoading: boolean = false;
  superAdminEmail = 'prabukannanofficial@gmail.com';

  constructor() {
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.currentUserEmail = user?.email || null;
      if (user) {
        this.fetchUserProfile(user.uid);
      } else {
        this.userProfileSubject.next(null);
        this.cartService.clearCart();
      }
    });
  }

  generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async fetchUserProfile(uid: string) {
    const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      // Force superadmin role if email matches
      if (profile.email === this.superAdminEmail) {
        profile.role = 'superadmin';
      }
      this.userProfileSubject.next(profile);
      this.cartService.loadUserCart(profile.uid, profile.orgId);
    }
  }

  async signup(email: string, password: string, orgName: string, role: 'member' | 'manager' = 'member', joinCode?: string) {
    try {
      this.isLoading = true;
      let orgId = 'default_org';
      let finalOrgName = orgName;

      // Logic for SuperAdmin
      if (email === this.superAdminEmail) {
        orgId = 'superadmin_org';
        finalOrgName = 'SuperAdmin Central';
        role = 'manager';
      } else if (role === 'manager') {
        orgId = 'ORG-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      } else if (role === 'member') {
        if (!joinCode) throw new Error('Join code is required for members.');
        
        // Find org by joinCode
        const orgsRef = collection(this.firestore, 'organizations');
        const q = query(orgsRef, where('joinCode', '==', joinCode));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('Invalid Join Code. Please ask your manager for the correct code.');
        }
        
        const orgData = querySnapshot.docs[0].data();
        orgId = orgData['id'];
        finalOrgName = orgData['name'];
      }

      const res = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = res.user.uid;
      
      const profile: UserProfile = {
        uid,
        email,
        displayName: email.split('@')[0],
        addresses: [],
        role: email === this.superAdminEmail ? 'superadmin' : role,
        orgId,
        orgName: finalOrgName,
        createdAt: new Date()
      };

      await setDoc(doc(this.firestore, `users/${uid}`), profile);
      
      if (role === 'manager') {
        const newJoinCode = this.generateJoinCode();
        await setDoc(doc(this.firestore, `organizations/${orgId}`), {
          id: orgId,
          name: finalOrgName,
          managerId: uid,
          managerEmail: email,
          joinCode: newJoinCode,
          createdAt: new Date()
        });
        this.showalert('Account Created', `Organization: ${finalOrgName}. Your Join Code is: ${newJoinCode}. Share this with your employees!`);
      } else {
        this.showalert('Welcome', `You have successfully joined ${finalOrgName}`);
      }

      this.userProfileSubject.next(profile);
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.showalert('Signup failed: ' + (error.message || 'Unknown error'));
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async login(email: string, password: string) {
    try {
      this.isLoading = true;
      const res = await signInWithEmailAndPassword(this.auth, email, password);
      await this.fetchUserProfile(res.user.uid);
      
      const profile = this.userProfileSubject.value;
      if (profile?.role === 'manager') {
        this.showalert('Welcome Manager!');
        this.router.navigate(['/admin']);
      } else if (profile?.role === 'superadmin') {
        this.showalert('Welcome Super Admin!');
        this.router.navigate(['/admin']); // I'll update AdminPage to handle SuperAdmin view
      } else {
        this.showalert('Login successful!');
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      this.showalert('Login failed: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    const profile = this.userProfileSubject.value;
    if (profile) {
      await this.cartService.saveUserCart(profile.uid, profile.orgId);
    }
    await signOut(this.auth);
    this.userProfileSubject.next(null);
    this.currentUserEmail = null;
    this.router.navigate(['/login']);
  }

  async setEmployeeRole(uid: string, role: 'member' | 'manager') {
    const currentProfile = this.userProfileSubject.value;
    if (currentProfile?.role !== 'superadmin') return;

    await updateDoc(doc(this.firestore, `users/${uid}`), { role });
    this.showalert('Role updated successfully');
  }

  async showalert(header: string, message?: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['Ok']
    });
    await alert.present();
  }

  googleSignIn() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
        .then((result) => {
            this.router.navigate(['']);
        })
  }

  async resetpassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.showalert('Success', 'Password reset email sent!');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.showalert('Error', error.message);
    }
  }
}

