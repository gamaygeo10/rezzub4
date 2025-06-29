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

  allUserQueueData: any[] = [];
  isQueueListModalOpen = false;
  selectedQueueNumber: any = null;
  calledQueueBackup: any = null;
  calledQueueIds: Set<string> = new Set();
  cancelledQueueIds = new Set<string>();

  displayMessage: string | null = null;
  showTicketListButton = false;
  showCameraButton = false;

  private routerSub?: Subscription;
  private queueSub?: Subscription;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects.includes('/queue')) {
        this.loadUserQueues();
      }
    });

    const called = localStorage.getItem('calledQueueNumber');
    if (called) {
      this.isCalled = true;
      this.userQueueNumber = parseInt(called, 10);
    }

    this.loadUserQueues();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.queueSub?.unsubscribe();
  }

  async loadUserQueues() {
    this.allUserQueueData = await this.firebaseService.getUserQueueData();
    const exists = this.allUserQueueData.some(item => item.id === this.selectedQueueNumber?.id);
    if (!exists && this.selectedQueueNumber !== null) {
      const called = localStorage.getItem('calledQueueNumber');
      if (called) {
        this.userQueueNumber = parseInt(called, 10);
        this.isCalled = true;
        this.selectedQueueNumber = null;
      }
    }
    if (this.allUserQueueData.length > 0) {
      const latest = this.allUserQueueData[this.allUserQueueData.length - 1];
      this.selectQueueItem(latest);
    } else {
      this.updateEmptyMessage();
    }
  }

  selectQueueItem(item: any) {
    this.selectedQueueNumber = item;
    this.userQueueNumber = item.number;
    this.isCalled = false;
    this.latestNumber = item.number.toString().padStart(3, '0');
    this.secondLatestNumber = '--';
    this.displayMessage = null;
    this.listenToQueueRealtime();
    this.closeQueueListModal();
  }

  openQueueListModal() {
    this.isQueueListModalOpen = true;
  }

  closeQueueListModal() {
    this.isQueueListModalOpen = false;
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
      if (!this.selectedQueueNumber) return;
      const cancelId = this.selectedQueueNumber.id;
      this.cancelledQueueIds.add(cancelId);
      await this.firebaseService.deleteQueueItem(cancelId);
      localStorage.removeItem('calledQueueNumber');
      this.allUserQueueData = this.allUserQueueData.filter(item => item.id !== cancelId);
      if (this.selectedQueueNumber?.id === cancelId) {
        this.selectedQueueNumber = null;
        this.userQueueNumber = null;
        this.isCalled = false;
        this.updateEmptyMessage();
      }
    } catch (error) {
      console.error('Error cancelling queue:', error);
    }
  }

  doneQueue(ticketId: string) {
    this.allUserQueueData = this.allUserQueueData.filter(item => item.id !== ticketId);
    this.calledQueueIds.delete(ticketId);
    if (this.selectedQueueNumber?.id === ticketId) {
      this.selectedQueueNumber = null;
      this.userQueueNumber = null;
      this.isCalled = false;
      this.updateEmptyMessage();
    }
    localStorage.removeItem('calledQueueNumber');
  }

  startEditing() {
    this.editValue = this.latestNumber;
    this.isEditing = true;
  }

  async saveEditedNumber() {
    if (!this.selectedQueueNumber) return;
    const newNumber = parseInt(this.editValue, 10);
    if (!isNaN(newNumber)) {
      await this.firebaseService.updateNumber(this.selectedQueueNumber.id, newNumber);
      this.isEditing = false;
      this.loadUserQueues();
    }
  }

  listenToQueueRealtime() {
    this.queueSub?.unsubscribe();
    this.queueSub = this.firebaseService.watchQueueDocs().subscribe(docs => {
      const currentIds = docs.map(d => d.id);
      const called = localStorage.getItem('calledQueueNumber');

      this.allUserQueueData.forEach(item => {
        if (!currentIds.includes(item.id) && !this.cancelledQueueIds.has(item.id)) {
          this.calledQueueIds.add(item.id);
        }
      });

      this.firebaseService.getUserQueueData().then(data => {
        const updated: any[] = [];
        data.forEach(item => {
          updated.push(item);
          this.calledQueueIds.delete(item.id);
        });

        this.allUserQueueData.forEach(item => {
          if (this.calledQueueIds.has(item.id) && !updated.find(d => d.id === item.id)) {
            updated.push(item);
          }
        });

        this.allUserQueueData = updated;

        if (
          this.selectedQueueNumber &&
          !currentIds.includes(this.selectedQueueNumber.id) &&
          !this.cancelledQueueIds.has(this.selectedQueueNumber.id)
        ) {
          if (called) {
            this.userQueueNumber = parseInt(called, 10);
            this.isCalled = true;
          }
        }

        if (!this.selectedQueueNumber && this.allUserQueueData.length === 0) {
          this.updateEmptyMessage();
        }
      });
    });
  }
  subMessage: string = '';


  updateEmptyMessage() {
  if (this.allUserQueueData.length === 0) {
    this.displayMessage = 'No tickets available,';
    this.subMessage = 'Please';
    this.showCameraButton = true;
    this.showTicketListButton = false;
  } else {
    this.displayMessage = 'Ticket no longer available.';
    this.subMessage = 'Please check your';
    this.showCameraButton = false;
    this.showTicketListButton = true;
  }
}

}
