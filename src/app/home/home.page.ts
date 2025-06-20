import { Component } from '@angular/core';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage {
  isCameraModalOpen = false;
  isMenuModalOpen = false;
  cameraEnabled = false;
  speakerEnabled = false;
  vibrationEnabled = false;
  flashlightEnabled = false;
  activeTab = 'queue';

  constructor(private router: Router) {} 
  showCameraModal() {
    this.isCameraModalOpen = true;
  }

  requestCamera() {
    this.isCameraModalOpen = false;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        alert('Camera permission granted.');
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((err) => {
        alert('Camera permission denied: ' + err.message);
      });
  }

  openMenuModal() {
    this.isMenuModalOpen = true;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleFlashlight() {
    console.log('Toggle flashlight');
  }

  navigateTo(path: string) {
    this.router.navigate([path]); 
  }
}
