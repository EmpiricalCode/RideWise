import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExploreComponent } from './explore/explore.component';
import { AboutComponent } from './about/about.component';
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "explore",
    pathMatch: "full"
  },
  {
    path: "explore",
    component: ExploreComponent
  },
  {
    path: "about",
    component: AboutComponent
  },
  {
    path: "**",
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
