import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Chart() {
  const data = {
    labels: ["Hamlet", "Laertes"],
    datasets: [
      {
        label: "example data",
        data: [12, 19],
        backgroundColor: ["#4e79a7", "#f28e2b"]
      }
    ]
  };

  return (
    <div style={{ width: "500px", marginTop: "20px" }}>
      <Bar data={data} />
    </div>
  );
}