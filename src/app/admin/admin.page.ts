import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {
  segment = 'list'; 
  queueNumbers: any[] = [];
  calledNumber: string = ''; 
  currentInput: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.listenToQueueRealtime();
  }

  listenToQueueRealtime() {
    this.firebaseService.watchQueueDocs().subscribe(snapshot => {
      this.queueNumbers = snapshot.map(doc => ({
        id: doc.id,
        number: doc.data().number
      }));
    });
  }

  async loadQueueNumbers() {
    try {
      this.queueNumbers = await this.firebaseService.getQueueNumbers();
    } catch (error) {
      console.error('Error fetching queue numbers:', error);
    }
  }

  async deleteNumber(id: string) {
    try {
      // ✅ Find the number before deleting
      const target = this.queueNumbers.find(item => item.id === id);
      const deletedNumber = target?.number;

      await this.firebaseService.deleteQueueNumber(id);

      // ✅ Also store it in localStorage if it's the user's number
      if (deletedNumber !== undefined) {
        localStorage.setItem('calledQueueNumber', deletedNumber.toString());
        this.calledNumber = `Number ${deletedNumber} has been called (via delete).`;

        setTimeout(() => {
          this.calledNumber = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting number:', error);
    }
  }

  async updateNumber(number: any) {
    const newNumber = prompt('Enter the new number:', number.number.toString());
    if (newNumber && !isNaN(Number(newNumber))) {
      try {
        await this.firebaseService.updateQueueNumber(number.id, parseInt(newNumber, 10));
      } catch (error) {
        console.error('Error updating number:', error);
      }
    }
  }

  addDigit(digit: number) {
    this.currentInput += digit.toString();
  }

  deleteLastDigit() {
    this.currentInput = this.currentInput.slice(0, -1); 
  }

  clearDigit() {
    this.currentInput = '';
  }

  async callNumber() {
    if (this.currentInput) {
      const numberToCall = parseInt(this.currentInput, 10);
      try {
        await this.firebaseService.callQueueNumber(numberToCall);
        this.calledNumber = `Number ${numberToCall} has been called.`;
        this.clearDigit();

        // ✅ Store in localStorage to trigger 'Proceed to Counter' in user view
        localStorage.setItem('calledQueueNumber', numberToCall.toString());

        setTimeout(() => {
          this.calledNumber = '';
        }, 3000);
      } catch (error) {
        console.error('Error calling number:', error);
      }
    }
  }
}
