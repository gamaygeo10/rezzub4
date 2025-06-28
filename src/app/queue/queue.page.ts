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

  userQueueNumber: number | null = null;
  isCalled = false;

  isEditing = false;
  editValue = '';

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects.includes('/queue')) {
        this.loadLatestNumber();
      }
    });

    const called = localStorage.getItem('calledQueueNumber');
    if (called) {
      this.isCalled = true;
      this.userQueueNumber = parseInt(called, 10);
    }

    this.loadLatestNumber();
    this.listenToQueueRealtime(); // ✅ Real-time sync with Firebase

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

      localStorage.removeItem('calledQueueNumber');
      this.userQueueNumber = null;
      this.isCalled = false;

      this.latestNumber = '--';
      this.secondLatestNumber = '--';

      console.log('Queue ticket canceled and removed from Firebase.');
    } catch (error) {
      console.error('Error cancelling queue ticket:', error);
    }
  }

  // ✅ New method for Done button
  doneQueue() {
    localStorage.removeItem('calledQueueNumber');
    this.userQueueNumber = null;
    this.isCalled = false;
    console.log('User confirmed completion. Message cleared.');
  }

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
        this.loadLatestNumber();
      }
    }
  }

  listenToQueueRealtime() {
  this.firebaseService.watchQueueChanges().subscribe(numbers => {
    const called = localStorage.getItem('calledQueueNumber');

    if (!numbers || numbers.length === 0) {
      this.latestNumber = '--';
      this.secondLatestNumber = '--';

      // ✅ Still show proceed if user had a called number
      if (called) {
        const calledNumber = parseInt(called, 10);
        this.userQueueNumber = calledNumber;
        this.isCalled = true;
        console.log('✅ User\'s number was called or deleted, queue is now empty:', calledNumber);
      } else {
        this.isCalled = false;
        this.userQueueNumber = null;
      }

      return;
    }

    const latestNum = numbers[numbers.length - 1];
    const secondLatestNum = numbers.length > 1 ? numbers[numbers.length - 2] : null;

    this.latestNumber = latestNum.toString().padStart(3, '0');
    this.secondLatestNumber = secondLatestNum !== null ? secondLatestNum.toString().padStart(3, '0') : '--';

    if (called) {
      const calledNumber = parseInt(called, 10);
      this.userQueueNumber = calledNumber;

      // ✅ Proceed if user’s number was removed (not in queue anymore)
      if (!numbers.includes(calledNumber)) {
        this.isCalled = true;
        console.log('✅ User\'s number was called or deleted:', calledNumber);
      } else {
        this.isCalled = false;
      }
    } else {
      this.isCalled = false;
      this.userQueueNumber = null;
    }
  });
}



}
