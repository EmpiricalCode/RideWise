import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ExploreComponent } from './explore/explore.component';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  @ViewChild("themeCheckbox") themeCheckbox!: ElementRef;
  
  constructor (private themeService: ThemeService) { }
  
  ngAfterViewInit() {
    // this.toggleTheme();
  }

  toggleTheme(theme: boolean) {
    this.themeService.setTheme(theme);
    this.themeService.subscription.next(theme);
  }
}
