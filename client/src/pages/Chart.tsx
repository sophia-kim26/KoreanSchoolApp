// FOR TA DASHBOARD!!

import { useState, useMemo, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import type { ChartOptions } from 'chart.js';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

// Add type definitions
interface Parent {
  koreanName?: string;
  korean_name?: string;
  englishName?: string;
  english_name?: string;
  phone?: string;
  email?: string;
}

interface CurrentUser {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  highschool?: string;
  grade?: string | number;
  age?: string | number;
  gender?: string;
  address?: string;
  emergencyPhone?: string;
  notes?: string;
}

interface ChartProps {
  currentUser: CurrentUser;
}

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function Chart({ currentUser }: ChartProps) {
    const [parents, setParents] = useState<Parent[]>([]);

    // Fetch parent data when component mounts
    useEffect(() => {
      const fetchParents = async () => {
        if (!currentUser?.id) {
          return;
        }
                
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/parents/ta/${currentUser.id}`);
          
          if (res.ok) {
            const data: Parent[] = await res.json();
            setParents(data);
          } else {
            const errorText = await res.text();
            console.error('Failed to fetch parents. Status:', res.status, 'Error:', errorText);
            setParents([]);
          }
        } catch (error) {
          console.error('Error fetching parents:', error);
          setParents([]);
        }
      };

      fetchParents();
    }, [currentUser?.id]);

    const taInfo = {
      firstName: currentUser.first_name || "First Name",
      lastName: currentUser?.last_name || "Last Name",
      email: currentUser?.email || "email@example.com",
      phone: currentUser?.phone || "123-456-7890",
      highschool : currentUser?.highschool || "Bergen County Academies",
      grade : currentUser?.grade || "12",
      age : currentUser?.age || "17",
      gender : currentUser?.gender || "F",
      address: currentUser?.address || "433 Ivy Avenue, Haworth NJ",
      emergencyPhone: currentUser?.emergencyPhone || "123-456-7890",
      notes: currentUser?.notes || "No notes",
      hoursCompleted: 250,
      totalHoursRequired: 300,
      parents: parents.length > 0 ? parents : [
        {
          koreanName: "한국이름",
          englishName: "Parent Name",
          phone: "123-456-7890",
          email: "parent@example.com"
        }
      ]
    };

  const dataValues: number[] = [12, 19, 40, 30, 5];

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

  const totalHours: number = dataValues.reduce((sum, val) => sum + val, 0);

  // doughnut chart data (attendance)
  const presentPercentage: number = Math.round(taInfo.hoursCompleted/taInfo.totalHoursRequired*100);
  const absentPercentage: number = 100-presentPercentage;

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
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  const barOptions: ChartOptions<'bar'> = {
    scales: {
      y: {
        min: 0,
        max: 50,
        ticks: {
          stepSize: 5
        },
        title: {
          display: true,
          text: "Hours"
        },
        grid: {
          color: "#feefbfff"
        }
      },
      x: {
        grid: {
          color: "#feefbfff"
        }
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: "40px", marginTop: "20px", alignItems: "flex-start" }}>
      {/* left column: bar chart and parent info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* bar chart */}
        <div style={{ width: "800px" }}>
          <Bar data={barData} options={barOptions} />
          <p style={{ marginTop: "12px", fontWeight: "bold" }}>
            Total Hours: {totalHours}
          </p>
        </div>

        {/* parent information - separate yellow box */}
        <div style={{
          width: "800px",
          backgroundColor: "#f5eed1",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontSize: "20px", color: "#5b8dc4", marginBottom: "20px", textAlign: "center" }}>
            Parent Information
          </h3>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#5b8dc4", color: "white" }}>
                <th style={{ padding: "10px", textAlign: "left", borderRadius: "8px 0 0 0" }}>Korean Name</th>
                <th style={{ padding: "10px", textAlign: "left" }}>English Name</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Phone Number</th>
                <th style={{ padding: "10px", textAlign: "left", borderRadius: "0 8px 0 0" }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {taInfo.parents.map((parent, index) => (
                <tr key={index} style={{ 
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                  borderBottom: "1px solid #e5e7eb"
                }}>
                  <td style={{ padding: "10px" }}>{parent.koreanName || parent.korean_name || 'N/A'}</td>
                  <td style={{ padding: "10px" }}>{parent.englishName || parent.english_name || 'N/A'}</td>
                  <td style={{ padding: "10px" }}>{parent.phone || 'N/A'}</td>
                  <td style={{ padding: "10px" }}>{parent.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {taInfo.firstName} {taInfo.lastName}
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "16px" }}>
            {taInfo.email} | {taInfo.phone}
            <br />
            {taInfo.highschool} | {taInfo.grade}th grade
            <br />
            {taInfo.age} years old | {taInfo.gender}
            <br />
            {taInfo.address}
            <br />
            Emergency Phone: {taInfo.emergencyPhone}
            <br />
            Notes: {taInfo.notes}
          </p>
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