import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as tt from '@tomtom-international/web-sdk-maps';
import SearchBox from '@tomtom-international/web-sdk-plugin-searchbox';
import { services } from '@tomtom-international/web-sdk-services';
import { Observable } from 'rxjs';
import { ThemeService } from '../theme.service';

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

  @ViewChild("mapNotificationContainer") mapNotificationContainer!: ElementRef;

  @ViewChild("infoContentContainer") infoContentContainer!: ElementRef;
  @ViewChild("alertTitle") alertTitle!: ElementRef;
  @ViewChild("alertContainer") alertContainer!: ElementRef;

  @ViewChild("distanceKilometers") distanceKilometers!: ElementRef;
  @ViewChild("distanceMiles") distanceMiles!: ElementRef;
  @ViewChild("rideDuration") rideDuration!: ElementRef;
  @ViewChild("caloriesBurned") caloriesBurned!: ElementRef;
  @ViewChild("altitudeChange") altitudeChange!: ElementRef;
  @ViewChild("weatherForcast") weatherForcast!: ElementRef;
  @ViewChild("temperature") temperature!: ElementRef;

  // Instance variables
  lightTheme: string = "https://api.tomtom.com/style/1/style/22.2.1-9?key=ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm&map=2/basic_street-light";
  darkTheme: string = "https://api.tomtom.com/style/1/style/22.2.1-9?key=ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm&map=2/basic_street-dark";

  searchUrl: string = "https://api.tomtom.com/search/2/search";
  altitudeUrl: string = "https://api.open-elevation.com/api/v1/lookup?locations=";
  weatherUrl: string = "https://api.weatherapi.com/v1/forecast.json?key=38a24f8373a94d8e872173145231007&days=1&aqi=yes&alerts=yes&q=";

  map: any;
  position: any;

  startPosition: any;
  endPosition: any;
  routeData: any;

  calculatingRoute: boolean = false;

  location: Observable<any> = new Observable<any>((observer) => {
    navigator.geolocation.getCurrentPosition((position: any) => {
      observer.next(position);
    })
  });

  startingPointAutocompleteResults: any = [];
  endingPointAutocompleteResults: any = [];

  // Constructor
  constructor(private titleService: Title, private http: HttpClient, private themeService: ThemeService) { 
    this.titleService.setTitle("RideWise - Explore");
  }

  // Methods
  ngAfterViewInit() {

    this.map = tt.map({
      key: "ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm",
      container: "map",
      style: this.themeService.theme ? this.lightTheme : this.darkTheme,
      zoom: 16,
    })

    this.map.dragRotate.disable();

    navigator.geolocation.getCurrentPosition((position: any) => {
      this.position = position;
      this.map.setCenter([position.coords.longitude, position.coords.latitude]);
    })

    // Changing map theme
    this.themeService.subscription.subscribe((res) => {

      if (res) {
        this.map.setStyle(this.lightTheme)
      } else {
        this.map.setStyle(this.darkTheme);
      }
    })

    this.map.on("style.load", () => {

      if (this.routeData != null) {
        
        this.removeRoute();
        this.map.addLayer({
          "id" : "route",
          "type" : "line",
          "source" : {
            "type" : "geojson",
            "data" : this.routeData.toGeoJson()
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
      }
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

  toggleMapTheme() {
    this.map.setStyle(this.darkTheme);
  }

  hideInfo(callback: any) {
    this.infoContentContainer.nativeElement.style.opacity = "0";
    this.alertContainer.nativeElement.innerHTML = "";
    this.alertTitle.nativeElement.style.display = "none";

    setTimeout(() => {
      callback();
    }, 300);
  }

  showInfo() {
    this.infoContentContainer.nativeElement.style.opacity = "1";

    if (this.alertContainer.nativeElement.childElementCount > 0) {
      this.alertTitle.nativeElement.style.display = "block";
    }
  }

  spawnMapNotification(message: string, type: string, duration: number) {
    
    var notificationElement = document.createElement("div");

    notificationElement.classList.add("map-notification");
    notificationElement.classList.add("transparent");
    notificationElement.innerHTML = message;

    if (type == "error") {
      notificationElement.classList.add("map-notification-error");
    } else if (type == "success") {
      notificationElement.classList.add("map-notification-success");
    }

    this.mapNotificationContainer.nativeElement.append(notificationElement);

    setTimeout(() => {
      notificationElement.classList.remove("transparent");
    }, 10);

    setTimeout(() => {
      notificationElement.classList.add("transparent");

      setTimeout(() => {
        notificationElement.remove();
      }, 200);
    }, duration);
  }

  spawnAlert(text: string, severity: string) {

    var alertElement = document.createElement("div");

    alertElement.innerHTML = text;
    alertElement.classList.add("alert");
    alertElement.classList.add(severity);

    this.alertContainer.nativeElement.append(alertElement);
  }

  fitBounds(routePoints: any) {

    var bounds = new tt.LngLatBounds();

    bounds.extend(new tt.LngLat(this.startPosition.lon as number, this.startPosition.lat as number));
    bounds.extend(new tt.LngLat(this.endPosition.lon as number, this.endPosition.lat as number));

    for (var boundItem of routePoints) {
      bounds.extend(new tt.LngLat(boundItem.lng as number, boundItem.lat as number));
    }

    this.map.fitBounds(bounds, {
      padding: {top: 30, right: 30, bottom: 30, left: 30}
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
    if (this.map.getLayer("route")) {
      this.map.removeLayer("route"); 
      this.map.removeSource('route');
    }
  }

  createRoute() {

    if (this.startPosition && this.endPosition && !this.calculatingRoute) {

      this.calculatingRoute = true;
      this.removeRoute();
      this.spawnMapNotification("Calculating route...", "", 1500);

      var routeOptions = {
        key: "ImJQ5OE7KBtQRP09rOL4mQXtlKm4qydm",
        locations: [this.startPosition, this.endPosition],
        travelMode: "bicycle" as any
      }

      this.hideInfo(() => {

        this.map.resize();

        services.calculateRoute(routeOptions).then((data) => {

          this.routeData = data;

          const summaryData = data.routes[0].summary;
          const lengthInMeters = summaryData.lengthInMeters;
          const timeData = new Date(summaryData.travelTimeInSeconds * 1000).toISOString().substring(11, 16).split(":").map(Number);
          var timeDataString = "";
          
          const days = Math.floor(summaryData.travelTimeInSeconds / 86400);

          // Displaying time information
          if (days > 0) {
            timeDataString = days + (days > 1 ? " Days " : " Day ");
          }

          if (timeData[0] > 0) {
            timeDataString += timeData[0] + (timeData[0] > 1 ? " Hours " : " Hour ");
          } 
          
          if (timeData[1] > 0) {
            timeDataString += timeData[1] + (timeData[1] > 1 ? " Minutes " : " Minute");
          }
          
          if (timeData[0] == 0 && timeData[1] == 0) {
            timeDataString = "Less Than 1 Minute";
          }

          this.rideDuration.nativeElement.innerHTML = timeDataString;

          // Displaying distance information
          if (lengthInMeters < 1000) {
            this.distanceKilometers.nativeElement.innerHTML = `${Math.round(lengthInMeters / 10) / 100} Kilometers`;
            this.distanceMiles.nativeElement.innerHTML = `${Math.round(lengthInMeters * 0.621371 / 10)/ 100} Miles`;
          } else if (lengthInMeters < 10000) {
            this.distanceKilometers.nativeElement.innerHTML = `${Math.round(lengthInMeters / 100) / 10} Kilometers`;
            this.distanceMiles.nativeElement.innerHTML = `${Math.round(lengthInMeters * 0.621371 / 100)/ 10} Miles`;
          } else {
            this.distanceKilometers.nativeElement.innerHTML = `${Math.round(lengthInMeters / 1000)} Kilometers`;
            this.distanceMiles.nativeElement.innerHTML = `${Math.round(lengthInMeters * 0.621371 / 1000)} Miles`;
          }

          // Nesting info API calls so the info section can be shown when requests are complete
          // Displaying elevation information
          this.http.get(this.altitudeUrl + this.startPosition.lat + "," + this.startPosition.lon).subscribe((dataStart: any) => {

            if (dataStart.results) {

              this.http.get(this.altitudeUrl + this.endPosition.lat + "," + this.endPosition.lon).subscribe((dataEnd: any) => {

                if (dataEnd.results) {

                  const start = dataStart.results[0].elevation;
                  const end = dataEnd.results[0].elevation;

                  if (end == start) {
                    this.altitudeChange.nativeElement.innerHTML = `0 Difference In Elevation`;
                  } else {
                    this.altitudeChange.nativeElement.innerHTML = `${Math.abs(start - end)} Meter ${start > end ? "Decrease" : "Increase"} In Elevation`;
                  }

                  // Displaying weather information
                  this.http.get(this.weatherUrl + this.startPosition.lat + "," + this.startPosition.lon).subscribe((weatherData: any) => {
                    
                    if (weatherData.current) {
                      
                      this.temperature.nativeElement.innerHTML = weatherData.current.temp_c + " °C";
                      this.weatherForcast.nativeElement.innerHTML = weatherData.current.condition.text;

                      // Severe weather alerts
                      if (weatherData.current.temp_c > 45) {
                        this.spawnAlert("Heat Warning", "severe");
                      }

                      if (weatherData.current.air_quality["us-epa-index"] > 3) {
                        this.spawnAlert("Air Quality Warning", "severe");
                      }

                      if (weatherData.current.air_quality["us-epa-index"] > 30) {
                        this.spawnAlert("Strong Wind Warning", "severe");
                      }

                      if (weatherData.current.air_quality["us-epa-index"] > 70) {
                        this.spawnAlert("High Humidity Warning", "severe");
                      }

                      if (weatherData.current.precip_mm > 8) {
                        this.spawnAlert("Heavy Rain Warning", "severe");
                      }

                      // Moderate weather alerts
                      if (weatherData.current.temp_c > 30 && weatherData.current.temp_c < 45) {
                        this.spawnAlert("Heat Warning", "moderate");
                      } else if (weatherData.current.temp_c < 0) {
                        this.spawnAlert("Cold Warning", "moderate");
                      }

                      if (weatherData.current.air_quality["us-epa-index"] > 1 && weatherData.current.air_quality["us-epa-index"] <= 3) {
                        this.spawnAlert("Air Quality Warning", "moderate");
                      } 

                      if (weatherData.current.gust_mph > 25 && weatherData.current.gust_mph <= 30) {
                        this.spawnAlert("Strong Wind Warning", "moderate");
                      }

                      if (weatherData.current.humidity > 60 && weatherData.current.gust_mph <= 70) {
                        this.spawnAlert("High Humidity Warning", "moderate");
                      }

                      if (weatherData.current.precip_mm > 2.5 && weatherData.current.precip_mm <= 8) {
                        this.spawnAlert("Rain Warning", "moderate");
                      }

                      // Adding route layer
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

                      this.spawnMapNotification("Route successfully calculated.", "success", 1500);
                      this.showInfo();
                      this.calculatingRoute = false;
                      this.map.resize();
                      this.fitBounds(data.routes[0].legs[0].points);

                    } else {
                      this.spawnMapNotification("An error occured when fetching weather information.", "error", 3000);
                    }
                  })
                } else {
                  this.spawnMapNotification("An error occured when fetching altitude information.", "error", 3000);
                }
              })
            } else {
              this.spawnMapNotification("An error occured when fetching altitude information.", "error", 3000);
            }
          })

        }).catch((error) => {
          console.log(error);
          
          this.spawnMapNotification("ERROR: " + error.detailedError.message, "error", 3000);
          this.calculatingRoute = false;
        })
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

    this.routeData = null;
    this.searchStartPoint(this.inputStart.nativeElement.value);
    this.removeRoute();

    if (this.endPosition) {
      this.fitBounds([]);
    } else {
      this.map.setCenter(this.startPosition);
    }
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

    this.routeData = null;
    this.searchEndPoint(this.inputEnd.nativeElement.value);
    this.removeRoute();
    
    if (this.startPosition) {
      this.fitBounds([]);
    } else {
      this.map.setCenter(this.endPosition);
    }
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