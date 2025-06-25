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

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  ngOnInit() {
    this.loadQueueNumbers();
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
      await this.firebaseService.deleteQueueNumber(id);
      this.loadQueueNumbers(); 
    } catch (error) {
      console.error('Error deleting number:', error);
    }
  }
  
  async updateNumber(number: any) {
    const newNumber = prompt('Enter the new number:', number.number.toString());
    if (newNumber && !isNaN(Number(newNumber))) {
      try {
        await this.firebaseService.updateQueueNumber(number.id, parseInt(newNumber, 10));
        this.loadQueueNumbers(); // Reload after update
      } catch (error) {
        console.error('Error updating number:', error);
      }
    }
  }

  addDigit(digit: number) {
    this.currentInput += digit.toString();
  }

  clearDigit() {
    this.currentInput = '';
  }

async callNumber() {
  if (this.currentInput) {
    const numberToCall = parseInt(this.currentInput, 10);
    try {
      // Call the number and remove it from Firebase
      await this.firebaseService.callQueueNumber(numberToCall);

      // After deleting from Firebase, immediately remove the number from the local list (queueNumbers)
      this.queueNumbers = this.queueNumbers.filter(number => number.number !== numberToCall);

      // Display the message for the called number
      this.calledNumber = `Number ${numberToCall} has been called.`;  // This is the message to show
      this.clearDigit();

      setTimeout(() => {
        this.calledNumber = '';  // Clears the message after 3 seconds
      }, 3000);

    } catch (error) {
      console.error('Error calling number:', error);
    }
  }
}

deleteLastDigit() {
    this.currentInput = this.currentInput.slice(0, -1); 
  }

}
