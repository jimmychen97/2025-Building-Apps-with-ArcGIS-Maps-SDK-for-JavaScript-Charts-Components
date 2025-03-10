import { StrictMode, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createFeatureLayer } from "./functions/create-feature-layer";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-feature-table";

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
    barChartRef.current.hideLoaderAnimation = true;
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

  // highlight chart data base on map selection
  const handleMapViewClick = useCallback((event) => {
    const { view } = event.target;

    let screenPoints = event.detail.screenPoint;
    view.hitTest(screenPoints).then(getFeatures);

    function getFeatures(response) {
      const selectedFeatureOID =
        response.results[0].graphic.attributes["ObjectId"];

      barChartRef.current.selectionData = {
        selectionOIDs: [selectedFeatureOID],
      };
    }
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
      <div id="map-container">
        <arcgis-map
          id="my-map"
          item-id="971ab6e1e8f3446c9c20f97f9c6bc226"
          onarcgisViewReadyChange={handleMapViewReady}
          onarcgisViewClick={handleMapViewClick}
        >
          <arcgis-home position="bottom-right"></arcgis-home>
          <arcgis-search position="top-left"></arcgis-search>
          <arcgis-legend
            position="bottom-left"
            legend-style="classic"
          ></arcgis-legend>
        </arcgis-map>
      </div>
      <div id="tabs-container">
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
        <arcgis-feature-table
          reference-element="my-map"
          layer-url="https://services1.arcgis.com/hLJbHVT9ZrDIzK0I/arcgis/rest/services/CollegeScorecard_0/FeatureServer/0"
        ></arcgis-feature-table>
      </div>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
