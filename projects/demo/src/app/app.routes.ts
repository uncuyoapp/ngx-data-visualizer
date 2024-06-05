import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FullExampleComponent } from './full-example/full-example.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'full-example', component: FullExampleComponent },
  { path: 'dashboard', component: DashboardComponent }
];
