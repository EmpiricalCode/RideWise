import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as tt from '@tomtom-international/web-sdk-maps';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent {

  constructor(private titleService: Title) { 
    this.titleService.setTitle("RideWise - Explore");
  }

  ngOnInit() {
    const map = tt.map({
      key: "ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm",
      container: "map",
    })
    map.addControl(new tt.NavigationControl())
  }
}
