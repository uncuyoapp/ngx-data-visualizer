import { ApplicationConfig } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  provideDataVisualizerCharts,
  provideDataVisualizerTables,
} from "ngx-data-visualizer";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
    provideAnimations(),
    provideDataVisualizerCharts(),
    provideDataVisualizerTables(),
  ],
};
