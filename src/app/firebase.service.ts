import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase.config';
import { deleteDoc, doc } from 'firebase/firestore';
import { updateDoc, where } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private queueRef = collection(db, 'queueNumbers');

  async addNextNumber() {
    const q = query(this.queueRef, orderBy('number', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    let nextNumber = 1;
    if (!querySnapshot.empty) {
      const lastDoc = querySnapshot.docs[0];
      const lastNumber = lastDoc.data()['number'];
      nextNumber = lastNumber + 1;
    }

    await addDoc(this.queueRef, { number: nextNumber });
    return nextNumber;
  }

  async getLatestNumber(): Promise<number | null> {
  const q = query(this.queueRef, orderBy('number', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].data()['number'];
  }

  return null;
}

async getTwoLatestNumbers(): Promise<number[]> {
  const q = query(this.queueRef, orderBy('number', 'desc'), limit(2));
  const snapshot = await getDocs(q);

  const numbers: number[] = [];
  snapshot.forEach(doc => {
    const num = doc.data()['number'];
    if (typeof num === 'number') {
      numbers.push(num);
    }
  });

  return numbers;
}

async deleteLatestNumber(): Promise<void> {
  const q = query(this.queueRef, orderBy('number', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docToDelete = snapshot.docs[0];
    await deleteDoc(doc(this.queueRef, docToDelete.id));
    console.log('Deleted latest queue number:', docToDelete.data()['number']);
  }
}

async updateNumber(oldNumber: number, newNumber: number): Promise<void> {
  const q = query(this.queueRef, orderBy('number', 'desc'), limit(2));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    if (docSnap.data()['number'] === oldNumber) {
      const docRef = doc(this.queueRef, docSnap.id);
      await updateDoc(docRef, { number: newNumber });
      break;
    }
  }
}

async getQueueNumbers() {
  const q = query(this.queueRef, orderBy('number', 'asc'));
  const snapshot = await getDocs(q);
  const numbers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return numbers;
}

async deleteQueueNumber(id: string): Promise<void> {
  const docRef = doc(this.queueRef, id);
  await deleteDoc(docRef);
}

async updateQueueNumber(id: string, newNumber: number): Promise<void> {
  const docRef = doc(this.queueRef, id);
  await updateDoc(docRef, { number: newNumber });
}

async callQueueNumber(number: number): Promise<void> {
  // Query to find the document with the specific 'number' field
  const q = query(this.queueRef, where('number', '==', number));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docToDelete = snapshot.docs[0]; // Get the first document matching the number
    await deleteDoc(doc(this.queueRef, docToDelete.id));  // Delete the number from Firebase
    console.log('Called and deleted number:', number);
  } else {
    console.error('Number not found in the queue');
  }
}

watchQueueChanges(): Observable<number[]> {
  return new Observable(observer => {
    const q = query(this.queueRef, orderBy('number', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const numbers: number[] = snapshot.docs.map(doc => doc.data()['number']);
      observer.next(numbers);
    });
    return () => unsubscribe();
  });
}

}
