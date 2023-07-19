import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent {

  constructor(private titleService: Title) { 
    this.titleService.setTitle("RideWise - Explore");
  }
}
