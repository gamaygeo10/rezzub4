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
  calledQueueBackup: any = null; // Store deleted ticket temporarily
  calledQueueIds: Set<string> = new Set(); // To track which tickets were called/deleted
  cancelledQueueIds = new Set<string>();

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

  // Check if currently selected ticket still exists
  const exists = this.allUserQueueData.some(item => item.id === this.selectedQueueNumber?.id);
  
  // ✅ If user’s current ticket is removed, mark as called
  if (!exists && this.selectedQueueNumber !== null) {
    const called = localStorage.getItem('calledQueueNumber');
    if (called) {
      this.userQueueNumber = parseInt(called, 10);
      this.isCalled = true;
      this.selectedQueueNumber = null;
      console.log('✅ User ticket was deleted or called. Show proceed message.');
    }
  }

  // ✅ Always display the latest added ticket if any exist
  if (this.allUserQueueData.length > 0) {
    const latest = this.allUserQueueData[this.allUserQueueData.length - 1];
    this.selectQueueItem(latest);
  }
}



  selectQueueItem(item: any) {
    this.selectedQueueNumber = item;
    this.userQueueNumber = item.number;
    this.isCalled = false;
    this.latestNumber = item.number.toString().padStart(3, '0');
    this.secondLatestNumber = '--'; // Could be improved with better context

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

    // Mark as cancelled
    this.cancelledQueueIds.add(cancelId);

    await this.firebaseService.deleteQueueItem(cancelId);
    localStorage.removeItem('calledQueueNumber');

    // Remove only the cancelled one
    this.allUserQueueData = this.allUserQueueData.filter(item => item.id !== cancelId);

    // If selected is the one cancelled, reset view
    if (this.selectedQueueNumber?.id === cancelId) {
      this.selectedQueueNumber = null;
      this.userQueueNumber = null;
      this.isCalled = false;
    }

    console.log('❌ Ticket cancelled by user.');

    // No full reload here → we just updated the list manually
  } catch (error) {
    console.error('Error cancelling queue:', error);
  }
}



  doneQueue(ticketId: string) {
  this.allUserQueueData = this.allUserQueueData.filter(item => item.id !== ticketId);
  this.calledQueueIds.delete(ticketId);

  // If the selected one is removed, clear it
  if (this.selectedQueueNumber?.id === ticketId) {
    this.selectedQueueNumber = null;
    this.userQueueNumber = null;
    this.isCalled = false;
  }

  localStorage.removeItem('calledQueueNumber');
  console.log('✅ Done clicked for:', ticketId);
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

    // Flag tickets as deleted (if not cancelled)
    this.allUserQueueData.forEach(item => {
      if (!currentIds.includes(item.id) && !this.cancelledQueueIds.has(item.id)) {
        this.calledQueueIds.add(item.id);
      }
    });

    this.firebaseService.getUserQueueData().then(data => {
      const updated: any[] = [];

      // Include active tickets
      data.forEach(item => {
        updated.push(item);
        this.calledQueueIds.delete(item.id); // Unmark if restored
      });

      // Re-include previously deleted (called) tickets
      this.allUserQueueData.forEach(item => {
        if (this.calledQueueIds.has(item.id) && !updated.find(d => d.id === item.id)) {
          updated.push(item);
        }
      });

      this.allUserQueueData = updated;

      // Check if selected is now deleted (but not cancelled)
      if (
        this.selectedQueueNumber &&
        !currentIds.includes(this.selectedQueueNumber.id) &&
        !this.cancelledQueueIds.has(this.selectedQueueNumber.id)
      ) {
        if (called) {
          this.userQueueNumber = parseInt(called, 10);
          this.isCalled = true;
          console.log('✅ Showing proceed message for selected deleted ticket.');
        }
      }
    });
  });
}

}
