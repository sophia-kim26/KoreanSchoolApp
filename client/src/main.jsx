import React from "react";
import ReactDOM from "react-dom/client";
import GridTable from "./Grid.jsx";
import Chart from "./Chart.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <h1>Hello world</h1>
    <h2>Grid.js example</h2>
    <GridTable />

    <h2>Chart.js example</h2>
    <Chart />
  </React.StrictMode>
);