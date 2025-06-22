// src/firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { environment } from './environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig);
export const db = getFirestore(firebaseApp);
