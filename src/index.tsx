import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import React from "react";
import ReactDOM from "react-dom/client";
import { Routes, Route, HashRouter } from "react-router-dom";
import { DocsAbout, DocsIndex, DocsQuickStart, DocsScoring } from "./docs";
import ResultsState from "./results";
import { EditRaceState, NewRaceState } from "./finishboard";
import ErrorBoundary from "./error";
import { EditCompetitorState, ListCompetitorsState } from "./edit-competitors";
import { NewSeriesState, SeriesConfigurationState, SeriesOverviewState } from "./series";
import StartState from "./home";
import RacesOverviewState from "./races";
import { StorageProvider } from "./storage-context";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

function App() {
  return (
    <ErrorBoundary>
      <StorageProvider>
        <HashRouter>
          <Routes>
            <Route>
              <Route index element={<StartState />} />
              <Route path="series">
                <Route path="new" element={<NewSeriesState />} />
                <Route path=":seriesId">
                  <Route index element={<SeriesOverviewState />} />
                  <Route path="config" element={<SeriesConfigurationState />} />
                  <Route path="results" element={<ResultsState />} />
                  <Route path="competitors">
                    <Route index element={<ListCompetitorsState />} />
                    <Route path=":racerId" element={<EditCompetitorState />} />
                  </Route>
                  <Route path="races">
                    <Route index element={<RacesOverviewState />} />
                    <Route path="new" element={<NewRaceState />} />
                    <Route path=":raceId">
                      <Route path="edit" element={<EditRaceState />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="docs">
                <Route index element={<DocsIndex />} />
                <Route path="about" element={<DocsAbout />} />
                <Route path="quick-start" element={<DocsQuickStart />} />
                <Route path="scoring" element={<DocsScoring />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </StorageProvider>
    </ErrorBoundary>
  );
}

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} style={{ height: "100%" }}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();
