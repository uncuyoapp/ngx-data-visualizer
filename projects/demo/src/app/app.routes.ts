import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { FullExampleComponent } from "./full-example/full-example.component";
import { HomeComponent } from "./home/home.component";
import { TableDemoComponent } from "./table-demo/table-demo.component";
import { ChartDemoComponent } from "./chart-demo/chart-demo.component";
import { ConfigurationComponent } from "./configuration/configuration.component";

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "full-example", component: FullExampleComponent },
  { path: "dashboard", component: DashboardComponent },
  { path: "table-demo", component: TableDemoComponent },
  { path: "chart-demo", component: ChartDemoComponent },
  { path: "configuration", component: ConfigurationComponent },
];
