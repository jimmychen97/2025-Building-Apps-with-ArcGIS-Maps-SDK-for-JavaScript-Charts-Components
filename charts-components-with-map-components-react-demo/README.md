# React demo with charts components and map components

📁 **[Click here to download this directory as a ZIP file](https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2Fjimmychen97%2F2025-Building-Apps-with-ArcGIS-Maps-SDK-for-JavaScript-Charts-Components%2Ftree%2Fmain%2Fcharts-components-with-map-components-react-demo)** 📁

This project showcases how to use charts components and map components. Including interaction such as selection sync up between chart and map, filter by extent and color matching with the layer. 

## Get started

- Run `yarn` or `npm install` and then start adding modules.

- Run `yarn dev` or `npm run dev` to start the development server. 

## Loading All Components

Charts components currently only support loading all components. You can register all components at once using the following approach:

```js
import { defineCustomElements } from "@arcgis/charts-components/dist/loader";

defineCustomElements(window, { resourcesUrl: "https://js.arcgis.com/charts-components/4.32/assets" });
```
