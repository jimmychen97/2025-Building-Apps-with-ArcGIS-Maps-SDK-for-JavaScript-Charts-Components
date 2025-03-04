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
  const chartRef = useRef(null);

  const initScatterplot = useCallback(async () => {
    const layer = await createFeatureLayer(
      "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/ChicagoCr/FeatureServer/0"
    );

    const scatterplotModel = new ScatterPlotModel();
    await scatterplotModel.setup({ layer });

    await scatterplotModel.setXAxisField("Ward");
    await scatterplotModel.setYAxisField("Beat");

    const config = scatterplotModel.getConfig();

    chartRef.current.layer = layer;
    chartRef.current.model = config;
  }, []);

  useEffect(() => {
    initScatterplot().catch(console.error);
  }, [initScatterplot]);

  return (
    <StrictMode>
      <arcgis-chart ref={chartRef}>
        <arcgis-charts-action-bar slot="action-bar"></arcgis-charts-action-bar>
      </arcgis-chart>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
