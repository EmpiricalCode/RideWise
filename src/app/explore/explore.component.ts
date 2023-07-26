import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as tt from '@tomtom-international/web-sdk-maps';
import SearchBox from '@tomtom-international/web-sdk-plugin-searchbox';
import { services } from '@tomtom-international/web-sdk-services';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements AfterViewInit {

  // DOM elements
  @ViewChild("inputStart") inputStart!: ElementRef;
  @ViewChild("inputEnd") inputEnd!: ElementRef;

  @ViewChild("inputStartAutocomplete") inputStartAutocomplete!: ElementRef;
  @ViewChild("inputEndAutocomplete") inputEndAutocomplete!: ElementRef;

  // Instance variables
  lightTheme: string = "https://api.tomtom.com/style/1/style/22.2.1-9?key=ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm&map=2/basic_street-light";
  darkTheme: string = "https://api.tomtom.com/style/1/style/22.2.1-9?key=ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm&map=2/basic_street-dark";

  searchUrl: string = "https://api.tomtom.com/search/2/search";

  map: any;
  position: any;

  startPosition: any;
  endPosition: any;

  location: Observable<any> = new Observable<any>((observer) => {
    navigator.geolocation.getCurrentPosition((position: any) => {
      observer.next(position);
    })
  });

  startingPointAutocompleteResults: any = [];
  endingPointAutocompleteResults: any = [];

  // Constructor
  constructor(private titleService: Title, private http: HttpClient) { 
    this.titleService.setTitle("RideWise - Explore");
  }

  // Methods
  ngAfterViewInit() {

    this.map = tt.map({
      key: "ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm",
      container: "map",
      style: this.lightTheme,
      zoom: 16,
    })

    navigator.geolocation.getCurrentPosition((position: any) => {
      this.position = position;
      this.map.setCenter([position.coords.longitude, position.coords.latitude]);
    })

    // Clicking off search bars
    document.addEventListener("click", (event) => {

      const target = event.target as HTMLElement;
      if (target.classList.contains("map-configuration-input")) {

        if (target.isSameNode(this.inputStart.nativeElement)) {
          this.inputEndAutocomplete.nativeElement.style.display = "none";
        } else {
          this.inputStartAutocomplete.nativeElement.style.display = "none";
        }
      
      } else {
        this.inputStartAutocomplete.nativeElement.style.display = "none";
        this.inputEndAutocomplete.nativeElement.style.display = "none";
      } 
    })
  }

  createMarker(position: any) {
    var markerElement = document.createElement("div");

    new tt.Marker({
      element: markerElement,
      offset: [0, 15]
    }).setLngLat(position).addTo(this.map);

    return markerElement;
  }

  removeRoute() {
    if (this.map.getLayer("route") != undefined) {
      this.map.removeLayer("route"); 
      this.map.removeSource('route');
    }
  }

  createRoute() {

    if (this.startPosition != undefined && this.endPosition != undefined) {

      this.removeRoute();

      var routeOptions = {
        key: "ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm",
        locations: [this.startPosition, this.endPosition],
        travelMode: "bicycle" as any
      }

      services.calculateRoute(routeOptions).then((data) => {

        this.map.addLayer({
          "id" : "route",
          "type" : "line",
          "source" : {
            "type" : "geojson",
            "data" : data.toGeoJson()
          },
          "layout" : {
            "line-join" : "round",
            "line-cap" : "round"
          },
          "paint" : {
            "line-color" : "rgb(46, 135, 240)",
            "line-width" : 5,
          }
        });
      }).catch((error) => {
        console.log(error);
      })
    }
  }

  selectStartPoint(result: any) {

    for (var element of Array.from(document.getElementsByClassName("start-marker"))) {
      element.remove();
    }

    var startMarkerElement = this.createMarker(result.position);
    var designatorElement = document.createElement("div");

    designatorElement.classList.add("start-marker-designator");
    startMarkerElement.classList.add("start-marker");

    startMarkerElement.append(designatorElement);

    this.startPosition = result.position;
    this.inputStart.nativeElement.value = result.address.freeformAddress;
    this.searchStartPoint(this.inputStart.nativeElement.value);

    this.removeRoute();
  }

  selectEndPoint(result: any) {

    for (var element of Array.from(document.getElementsByClassName("end-marker"))) {
      element.remove();
    }

    var endMarkerElement = this.createMarker(result.position);
    var designatorElement = document.createElement("div");

    designatorElement.classList.add("end-marker-designator");
    endMarkerElement.classList.add("end-marker");

    endMarkerElement.append(designatorElement);

    this.endPosition = result.position;
    this.inputEnd.nativeElement.value = result.address.freeformAddress;
    this.searchEndPoint(this.inputEnd.nativeElement.value);

    this.removeRoute();
  }

  searchStartPoint(query: String) {

    if (query.length > 1) {
      
      this.inputStartAutocomplete.nativeElement.style.display = "block";
      this.search(query).subscribe((data) => {
        this.startingPointAutocompleteResults = data;
      })
    } else {
      this.inputStartAutocomplete.nativeElement.style.display = "none";
    }
  }

  searchEndPoint(query: String) {

    if (query.length > 1) {

      this.inputEndAutocomplete.nativeElement.style.display = "block";
      this.search(query).subscribe((data) => {
        this.endingPointAutocompleteResults = data;
      })
    } else {
      this.inputEndAutocomplete.nativeElement.style.display = "none";
    }
  }

  search(query: String) {
    return new Observable<any>((observer) => {
      this.http.get(this.searchUrl + `/${query}.json?limit=5&lat=${this.position.coords.latitude}&lon=${this.position.coords.longitude}&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&key=ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm`).subscribe((data: any) => {
        observer.next(data.results);
      })
    })
  }
}
