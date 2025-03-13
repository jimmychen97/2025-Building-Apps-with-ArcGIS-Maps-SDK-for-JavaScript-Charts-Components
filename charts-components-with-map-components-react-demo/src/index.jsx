import { StrictMode, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-legend";

import { defineCustomElements as defineCalciteElements } from "@esri/calcite-components/dist/loader";
import { defineCustomElements as defineChartsElements } from "@arcgis/charts-components/dist/loader";

import { ScatterPlotModel } from "@arcgis/charts-model";

import "./index.css";

// Define custom elements in the browser, and load the assets from the CDN
defineCalciteElements();
defineChartsElements(window, {
  resourcesUrl: "https://js.arcgis.com/charts-components/4.32/assets",
});

// Function to get and load the feature layer
const getFeatureLayer = async (map) => {
  const featureLayer = map.layers.find(
    (layer) => layer.title === "CollegeScorecard"
  );
  await featureLayer.load();
  return featureLayer;
};

const App = () => {
  const mapRef = useRef(null);

  // Bar chart and action bar references
  const barChartRef = useRef(null);
  const barChartActionBarRef = useRef(null);

  // Scatterplot reference
  const scatterplotRef = useRef(null);

  // 1. Load an existing chart that was configured in Map Viewer, saved on the layer
  const initBarChart = useCallback(async (map) => {
    const featureLayer = await getFeatureLayer(map);
    const barChartConfig = featureLayer.charts[0];

    barChartRef.current.layer = featureLayer;
    barChartRef.current.model = barChartConfig;
    // barChartRef.current.hideLoaderAnimation = true;
  }, []);

  // 2. Use the feature layer from Map Viewer to configure a new scatterplot chart
  const initScatterplot = useCallback(async (map) => {
    const featureLayer = await getFeatureLayer(map);
    const scatterplotModel = new ScatterPlotModel();
    await scatterplotModel.setup({ layer: featureLayer });

    await scatterplotModel.setXAxisField("Cost");
    await scatterplotModel.setYAxisField("Earnings");

    scatterplotRef.current.layer = featureLayer;
    scatterplotRef.current.model = scatterplotModel.getConfig();
  }, []);

  // 3. Sync up selection between the bar chart and the map
  const setupBarChartSelection = useCallback((map, view) => {
    const featureLayerViews = view.layerViews;

    barChartRef.current.addEventListener("arcgisSelectionComplete", (event) => {
      map.highlightSelect?.remove();

      map.highlightSelect = featureLayerViews.items[0].highlight(
        event.detail.selectionData.selectionOIDs
      );
    });
  }, []);

  // 4. Enable filter by extent on the bar chart
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

  // 5. Highlight chart data based on map selection
  const handleMapViewClick = useCallback((event) => {
    const { view } = event.target;

    let screenPoints = event.detail.screenPoint;
    view.hitTest(screenPoints).then((response) => {
      const selectedFeatureOID =
        response.results[0].graphic.attributes["ObjectId"];

      barChartRef.current.selectionData = {
        selectionOIDs: [selectedFeatureOID],
      };
    });
  }, []);

  // Initialize map and charts when the map view is ready
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
      <calcite-shell>
        <calcite-navigation slot="header" id="nav">
          <calcite-navigation-logo
            alt="College Scorecard"
            slot="logo"
            heading="U.S. College Scorecard"
            description="ArcGIS Maps SDK for JavaScript - Charts Components + Map Components"
          ></calcite-navigation-logo>
        </calcite-navigation>
        <arcgis-map
          id="my-map"
          item-id="971ab6e1e8f3446c9c20f97f9c6bc226"
          onarcgisViewReadyChange={handleMapViewReady}
          onarcgisViewClick={handleMapViewClick}
        >
          <arcgis-home position="top-right"></arcgis-home>
          <arcgis-search position="top-left"></arcgis-search>
          <arcgis-legend
            position="bottom-left"
            legend-style="classic"
          ></arcgis-legend>
        </arcgis-map>
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
              <arcgis-chart ref={scatterplotRef}></arcgis-chart>
            </calcite-tab>
          </calcite-tabs>
        </div>
      </calcite-shell>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
