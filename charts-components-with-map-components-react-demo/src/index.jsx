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

  const initScatterplot = useCallback(async () => {
    const layer = await createFeatureLayer(
      "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/ChicagoCr/FeatureServer/0"
    );

    const scatterplotModel = new ScatterPlotModel();
    await scatterplotModel.setup({ layer });

    await scatterplotModel.setXAxisField("Ward");
    await scatterplotModel.setYAxisField("Beat");

    const config = scatterplotModel.getConfig();

    scatterplotRef.current.layer = layer;
    scatterplotRef.current.model = config;
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

        await initScatterplot();
        await initBarChart(map);
      };

      initialize().catch(console.error);
    },
    [initScatterplot, initBarChart]
  );

  return (
    <StrictMode>
      <arcgis-map
        item-id="f2481ef191924872be8897179f73d55c"
        onarcgisViewReadyChange={handleMapViewReady}
      ></arcgis-map>
      <calcite-tabs bordered layout="inline">
        <calcite-tab-nav slot="title-group">
          <calcite-tab-title selected>Scatterplot</calcite-tab-title>
          <calcite-tab-title>Bar chart</calcite-tab-title>
        </calcite-tab-nav>
        <calcite-tab selected>
          <arcgis-chart ref={scatterplotRef}>
            <arcgis-charts-action-bar slot="action-bar"></arcgis-charts-action-bar>
          </arcgis-chart>
        </calcite-tab>
        <calcite-tab>
          <arcgis-chart ref={barChartRef}>
            <arcgis-charts-action-bar slot="action-bar"></arcgis-charts-action-bar>
          </arcgis-chart>
        </calcite-tab>
      </calcite-tabs>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
