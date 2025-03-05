import { StrictMode, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createFeatureLayer } from "./functions/create-feature-layer";

import "@arcgis/map-components/components/arcgis-map";
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
  const scatterplotRef = useRef(null);
  const barChartRef = useRef(null);
  const mapRef = useRef(null);

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

  const initBarChart = useCallback(async (map) => {
    const featureLayer = map.layers.find(
      (layer) => layer.title === "CollegeScorecard"
    );
    await featureLayer.load();

    const chartConfig = featureLayer.charts[0];
    barChartRef.current.layer = featureLayer;
    barChartRef.current.model = chartConfig;
  }, []);

  const handleMapViewReady = useCallback(
    (event) => {
      const initialize = async () => {
        const { map, view } = event.target;

        await initScatterplot(map);
        await initBarChart(map);
      };

      initialize().catch(console.error);
    },
    [initBarChart]
  );

  return (
    <StrictMode>
      <arcgis-map
        item-id="f2481ef191924872be8897179f73d55c"
        onarcgisViewReadyChange={handleMapViewReady}
      ></arcgis-map>
      <calcite-tabs bordered layout="inline">
        <calcite-tab-nav slot="title-group">
          <calcite-tab-title selected>Bar Chart</calcite-tab-title>
          <calcite-tab-title>Scatterplot</calcite-tab-title>
        </calcite-tab-nav>
        <calcite-tab selected>
          <arcgis-chart ref={barChartRef}>
            <arcgis-charts-action-bar slot="action-bar"></arcgis-charts-action-bar>
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
