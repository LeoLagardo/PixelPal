import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  template: `
    <ion-content class="ion-padding ion-text-center splash-container">
      <div class="splash-content">
        <div class="logo-box">
          <h2>StreamDeck Companion</h2>
          <p>Connecting your mobile display to your PC</p>
        </div>
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash-container {
      --background: #121212;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .splash-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #ffffff;
    }
    .logo-box h2 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .logo-box p {
      color: #a0a0a0;
      font-size: 14px;
      margin-bottom: 30px;
    }
  `],
  imports: [IonContent, IonSpinner]
})
export class SplashPage implements OnInit {
  constructor(private companionService: CompanionService, private router: Router) {}

  ngOnInit() {
    // A brief delay to let the user see the splash screen, then route depending on paired device status
    setTimeout(() => {
      const device = this.companionService.pairedDevice$.value;
      if (device) {
        console.log('Device is already paired. Launching home screen directly...');
        this.companionService.connect();
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        console.log('No paired device found. Navigating to pairing screen...');
        this.router.navigateByUrl('/pairing', { replaceUrl: true });
      }
    }, 1500);
  }
}
