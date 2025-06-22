import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../firebase.service'; // Make sure path is correct

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage {
  isCameraModalOpen = false;
  isMenuModalOpen = false;
  cameraEnabled = true;
  speakerEnabled = false;
  vibrationEnabled = false;
  flashlightEnabled = false;
  activeTab = 'queue';

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  showCameraModal() {
    this.isCameraModalOpen = true;
  }

  openMenuModal() {
    this.isMenuModalOpen = true;
  }

  toggleFlashlight() {
    console.log('Toggle flashlight');
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async handleCameraSquareClick() {
  this.isCameraModalOpen = false;

  try {
    const number = await this.firebaseService.addNextNumber();
    console.log('Added number to Firebase:', number);

    this.router.navigate(['/queue']);
  } catch (error) {
    console.error('Error adding number to Firebase:', error);
  }
}


  
}
