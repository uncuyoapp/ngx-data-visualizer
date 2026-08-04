import { ApplicationConfig } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
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
    provideDataVisualizerCharts({
      debug: true,
      defaultHeight: 420,
      defaultWidth: "100%",
    }),
    provideDataVisualizerTables({
      debug: true,
    }),
  ],
};
