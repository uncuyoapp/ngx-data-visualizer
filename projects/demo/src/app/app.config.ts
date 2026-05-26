import { ApplicationConfig } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  provideDataVisualizerCharts,
  provideDataVisualizerTables,
  DATA_VISUALIZER_CONFIG,
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
    {
      provide: DATA_VISUALIZER_CONFIG,
      useValue: {
        defaultHeight: 420,
        defaultWidth: "100%",
      },
    },
  ],
};
