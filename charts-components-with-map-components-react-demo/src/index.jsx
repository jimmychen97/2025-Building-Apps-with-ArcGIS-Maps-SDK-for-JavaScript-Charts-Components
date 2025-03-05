import { StrictMode, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createFeatureLayer } from "./functions/create-feature-layer";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-legend";

import { ScatterPlotModel } from "@arcgis/charts-model";
import { defineCustomElements as defineCalciteElements } from "@esri/calcite-components/dist/loader";
import { defineCustomElements as defineChartsElements } from "@arcgis/charts-components/dist/loader";

import "./index.css";

// define custom elements in the browser, and load the assets from the CDN
defineCalciteElements();
defineChartsElements(window, {
  resourcesUrl: "https://js.arcgis.com/charts-components/4.32/assets",
});

const App = () => {
  const mapRef = useRef(null);
  const barChartRef = useRef(null);
  const scatterplotRef = useRef(null);
  const barChartActionBarRef = useRef(null);

  // load an existing chart that was configured in Map Viewer, saved on the layer
  const initBarChart = useCallback(async (map) => {
    const featureLayer = map.layers.find(
      (layer) => layer.title === "CollegeScorecard"
    );
    await featureLayer.load();

    const barChartConfig = featureLayer.charts[0];

    barChartRef.current.layer = featureLayer;
    barChartRef.current.model = barChartConfig;
  }, []);

  // use the feature layer from Map Viewer to configure a new chart
  const initScatterplot = useCallback(async (map) => {
    const featureLayer = map.layers.find(
      (layer) => layer.title === "CollegeScorecard"
    );
    await featureLayer.load();

    const scatterplotModel = new ScatterPlotModel();
    await scatterplotModel.setup({ layer: featureLayer });

    await scatterplotModel.setXAxisField("Cost");
    await scatterplotModel.setYAxisField("Earnings");

    const scatterplotConfig = scatterplotModel.getConfig();

    scatterplotRef.current.layer = featureLayer;
    scatterplotRef.current.model = scatterplotConfig;
  }, []);

  // sync up selection between the bar chart and the map
  const setupBarChartSelection = useCallback((map, view) => {
    const featureLayerViews = view.layerViews;

    barChartRef.current.addEventListener("arcgisSelectionComplete", (event) => {
      map.highlightSelect?.remove();

      map.highlightSelect = featureLayerViews.items[0].highlight(
        event.detail.selectionData.selectionOIDs
      );
    });
  }, []);

  // enable filter by extent on the bar chart
  const setupActionBarFilterByExtent = useCallback((view) => {
    barChartRef.current.view = view;

    barChartActionBarRef.current.addEventListener(
      "arcgisDefaultActionSelect",
      (event) => {
        const { actionId, actionActive } = event.detail;
        if (actionId === "filterByExtent") {
          barChartRef.current.filterByExtent = actionActive;
        }
      }
    );
  }, []);

  const handleMapViewReady = useCallback(
    (event) => {
      const initialize = async () => {
        const { map, view } = event.target;

        await initBarChart(map);
        await initScatterplot(map);
        setupBarChartSelection(map, view);
        setupActionBarFilterByExtent(view);
      };

      initialize().catch(console.error);
    },
    [
      initBarChart,
      initScatterplot,
      setupBarChartSelection,
      setupActionBarFilterByExtent,
    ]
  );

  return (
    <StrictMode>
      <arcgis-map
        item-id="971ab6e1e8f3446c9c20f97f9c6bc226"
        onarcgisViewReadyChange={handleMapViewReady}
      >
        <arcgis-search position="top-right"></arcgis-search>
        <arcgis-legend
          position="bottom-right"
          legend-style="classic"
        ></arcgis-legend>
      </arcgis-map>
      <calcite-tabs bordered layout="inline">
        <calcite-tab-nav slot="title-group">
          <calcite-tab-title selected>
            <calcite-icon icon="graph-bar" />
            Bar Chart
          </calcite-tab-title>
          <calcite-tab-title>
            <calcite-icon icon="graph-scatter-plot" />
            Scatterplot
          </calcite-tab-title>
        </calcite-tab-nav>
        <calcite-tab selected>
          <arcgis-chart ref={barChartRef}>
            <arcgis-charts-action-bar
              slot="action-bar"
              ref={barChartActionBarRef}
            ></arcgis-charts-action-bar>
          </arcgis-chart>
        </calcite-tab>
        <calcite-tab>
          <arcgis-chart ref={scatterplotRef}>
            <arcgis-charts-action-bar slot="action-bar"></arcgis-charts-action-bar>
          </arcgis-chart>
        </calcite-tab>
      </calcite-tabs>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
