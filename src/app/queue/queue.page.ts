import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
  standalone: false
})
export class QueuePage {
  isMenuModalOpen = false;

  cameraEnabled = true;
  speakerEnabled = true;
  vibrationEnabled = true;
  flashlightEnabled = true;

  progressValue = 0.1; 
  get progressPercentage() {
    return Math.round(this.progressValue * 100) + '%';
  }

  constructor(private router: Router) {}

  openMenuModal() {
    this.isMenuModalOpen = true;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  cancelQueue() {
    console.log('Queue canceled');
  }
}
