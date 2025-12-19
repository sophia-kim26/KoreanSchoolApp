import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function Chart() {
  const dataValues = [12, 19, 40, 30, 5]

  // bar graph
  const barData = {
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

  const barOptions = {
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

  // sample TA info
  const taInfo = {
    firstName: "John",
    lastName: "Pork",
    email: "johnpork@gmail.com",
    phone: "123-456-7890",
    hoursPerDay: "—",
    time: "—",
    hoursCompleted: 250,
    totalHoursRequired: 300
  };

  // doughnut chart data (attendance)
  const presentPercentage = Math.round(taInfo.hoursCompleted/taInfo.totalHoursRequired*100);
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
    <div style={{ display: "flex", gap: "40px", marginTop: "20px", alignItems: "flex-start" }}>
      {/* bar chart */}
      <div style={{ width: "800px" }}>
        <Bar data={barData} options={barOptions} />
        <p style={{ marginTop: "12px", fontWeight: "bold" }}>
          Total Hours: {totalHours}
        </p>
      </div>

      {/* info card */}
      <div style={{
        width: "400px",
        backgroundColor: "#f5eed1",
        borderRadius: "16px",
        padding: "40px 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {/* doughnut graph / chart */}
        <div style={{ 
          position: "relative", 
          width: "250px", 
          height: "250px", 
          margin: "0 auto 20px" 
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

        {/* ta info */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "24px", color: "#5b8dc4", marginBottom: "8px" }}>
            {taInfo.lastName}, {taInfo.firstName}
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "16px" }}>
            {taInfo.email} | {taInfo.phone}
          </p>
        </div>

        {/* hours info */}
        <div style={{ marginBottom: "20px", color: "#5b8dc4", fontSize: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span>Hours Per Day:</span>
            <span>{taInfo.hoursPerDay}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Time:</span>
            <span>{taInfo.time}</span>
          </div>
        </div>

        {/* progress bar */}
        <div style={{ marginTop: "20px" }}>
          <div style={{
            width: "100%",
            height: "40px",
            backgroundColor: "#e5e7eb",
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative"
          }}>
            <div style={{
              width: `${(taInfo.hoursCompleted / taInfo.totalHoursRequired) * 100}%`,
              height: "100%",
              backgroundColor: "#5b8dc4",
              borderRadius: "20px",
              transition: "width 0.3s ease"
            }}></div>
            <div style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "24px"
            }}>
              🏅
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "18px", color: "#5b8dc4" }}>
            {taInfo.hoursCompleted}/{taInfo.totalHoursRequired} Hours Completed
          </p>
        </div>
      </div>
    </div>
  );
}