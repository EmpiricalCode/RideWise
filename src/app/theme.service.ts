import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  theme: boolean = true;
  subscription = new Subject<boolean>();

  constructor() { }

  setTheme(theme: boolean) {
    this.theme = theme;
  }
}
