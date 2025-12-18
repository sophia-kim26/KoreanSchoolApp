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
  const dataValues = [12, 19, 40, 30, 5]
  const data = {
    labels: ["September", "October", "November", "December", "January"],
    datasets: [
      {
        label: "Hours",
        data: dataValues,
        backgroundColor: ["#bfdbfe"]
      }
    ]
  };

  const totalHours = dataValues.reduce((sum, val) => sum + val, 0);

  const options = {
    y: {
      min : 0,
      max : 50,
      ticks: {
        stepSize: 5
      },
      title: {
        display: true,
        text: "Hours"
      },
      grid: {
        // grid line color won't change idk why
        color: () => "#feefbfff"
      }
    },
    x: {
      grid: {
        color: "#feefbfff"
      }
    }
  }

  return (
    <div style={{ width: "800px", marginTop: "20px" }}>
      <Bar data={data} options={options} />
      <p style={{ marginTop: "12px", fontWeight: "bold" }}>
        Total Hours: {totalHours}
      </p>
    </div>
  );
}