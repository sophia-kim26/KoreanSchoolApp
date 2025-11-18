import React from "react";
import ReactDOM from "react-dom/client";
import GridTable from "./Grid.jsx";
import Chart from "./Chart.jsx";
import Choices from "./Choice.jsx"
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <h1>Hello world</h1>
    <h2>Grid.js example</h2>
    <GridTable />

    <h2>Chart.js example</h2>
    <Chart />

    <h2>Log in Screens</h2>
    <Choices />
  </React.StrictMode>
);