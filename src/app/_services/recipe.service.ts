import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Recipe } from '../_models/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private firestore = inject(Firestore);
  private collectionName = 'recipes';

  // Add a recipe to Firestore
  async addRecipe(recipe: any, orgId: string): Promise<void> {
    const recipesRef = collection(this.firestore, this.collectionName);
    const newDoc = doc(recipesRef);
    return setDoc(newDoc, { ...recipe, id: newDoc.id, orgId });
  }

  // Get recipes for specific organization
  getRecipes(orgId?: string): Observable<Recipe[]> {
    const recipesRef = collection(this.firestore, this.collectionName);
    const q = orgId 
      ? query(recipesRef, where('orgId', '==', orgId))
      : query(recipesRef, orderBy('createdAt', 'desc'));
    
    return collectionData(q, { idField: 'id' }) as Observable<Recipe[]>;
  }

  // Get trending recipes for specific organization
  getTrendingRecipes(orgId?: string): Observable<Recipe[]> {
    const recipesRef = collection(this.firestore, this.collectionName);
    const q = orgId
      ? query(recipesRef, where('orgId', '==', orgId), limit(10))
      : query(recipesRef, limit(10));
      
    return collectionData(q, { idField: 'id' }) as Observable<Recipe[]>;
  }

  getRecipeById(id: string): Observable<Recipe> {
    const recipeRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(recipeRef, { idField: 'id' }) as Observable<Recipe>;
  }
}