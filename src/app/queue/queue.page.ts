import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
  standalone: false
})
export class QueuePage implements OnInit, OnDestroy {
  isMenuModalOpen = false;
  cameraEnabled = true;
  speakerEnabled = true;
  vibrationEnabled = true;
  flashlightEnabled = true;
  progressValue = 0.1;
  latestNumber: string = '--';
  secondLatestNumber: string = '--';

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    // Listen for page entry and re-fetch data
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects.includes('/queue')) {
        this.loadLatestNumber();
      }
    });

    // Initial load
    this.loadLatestNumber();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

async loadLatestNumber() {
  const numbers = await this.firebaseService.getTwoLatestNumbers();

  if (numbers.length > 0) {
    this.latestNumber = numbers[0].toString().padStart(3, '0');
  }
  if (numbers.length > 1) {
    this.secondLatestNumber = numbers[1].toString().padStart(3, '0');
  }
}

  get progressPercentage() {
    return Math.round(this.progressValue * 100) + '%';
  }

  openMenuModal() {
    this.isMenuModalOpen = true;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async cancelQueue() {
  try {
    await this.firebaseService.deleteLatestNumber();
    this.loadLatestNumber();
    console.log('Queue ticket canceled and removed from Firebase.');
    this.latestNumber = '--';
    this.secondLatestNumber = '--';
  } catch (error) {
    console.error('Error cancelling queue ticket:', error);
  }
}

isEditing = false;
editValue = '';

startEditing() {
  this.editValue = this.latestNumber;
  this.isEditing = true;
}

async saveEditedNumber() {
  const currentLatest = await this.firebaseService.getTwoLatestNumbers();

  if (currentLatest.length > 0) {
    const latest = currentLatest[0];
    const newNumber = parseInt(this.editValue, 10);

    if (!isNaN(newNumber)) {
      await this.firebaseService.updateNumber(latest, newNumber);
      this.isEditing = false;
      this.loadLatestNumber(); // refresh
    }
  }
}


}
