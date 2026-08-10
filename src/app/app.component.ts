import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { KeepAwake } from '@capacitor-community/keep-awake';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {}

  async ngOnInit() {
    await KeepAwake.keepAwake();
  }
}
