import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(Tooltip, Legend, ArcElement);

export default function DoughnutChart() {
  // sample data
  const hoursCompleted = 250;
  const totalHoursRequired = 300;

  // calculate percentages
  const presentPercentage = Math.round(hoursCompleted/totalHoursRequired*100);
  const absentPercentage = 100-presentPercentage;

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [presentPercentage, absentPercentage],
        backgroundColor: ['#5b8dc4', '#f5f5dc'],
        borderWidth: 0,
        cutout: '75%'
      }
    ]
  }

  const doughnutOptions = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  }

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{ 
        position: "relative", 
        width: "250px", 
        height: "250px"
      }}>
        <Doughnut data={doughnutData} options={doughnutOptions} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "600", color: "#5b8dc4" }}>
            {presentPercentage}% Present
          </div>
          <div style={{ fontSize: "20px", color: "#d4af37" }}>
            {absentPercentage}% Absent
          </div>
        </div>
      </div>
    </div>
  );
}