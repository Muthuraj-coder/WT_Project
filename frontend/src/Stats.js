import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Stats = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [presentees, setPresentees] = useState(0);
  const [absentees, setAbsentees] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [departmentStats, setDepartmentStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // Department abbreviations mapping
  const deptAbbreviations = {
    "Electronics and Communication Engineering": "ECE",
    "Information Technology": "IT",
    "Computer Science and Design": "CSD",
    "Computer Science and Engineering": "CSE"
  };

  const fetchAttendance = useCallback(async () => {
    if (!token) {
      setError("Unauthorized: No token found");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("https://wt-project-backend-ci10.onrender.com/api/stats", {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
      });

      setTotalStudents(response.data?.totalStudents || 0);
      setPresentees(response.data?.presentees || 0);
      setAbsentees(response.data?.absentees || 0);
      setDepartmentStats(response.data?.departmentStats || {});
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch attendance data.");
    } finally {
      setLoading(false);
    }
  }, [token, date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Calculate attendance percentage
  const attendancePercentage = totalStudents > 0 
    ? Math.round((presentees / totalStudents) * 100) 
    : 0;

  // Get abbreviations for bar chart
  const getAbbreviatedDepartments = () => {
    return Object.keys(departmentStats).map(dept => deptAbbreviations[dept] || dept);
  };

  return (
    <div style={dashboardStyle}>
      {error && <div style={errorBannerStyle}>{error}</div>}
      
      <div style={headerContainerStyle}>
        <h2 style={headingStyle}>📊 Attendance Dashboard</h2>
        <div style={datePickerContainerStyle}>
          <label style={labelStyle}>Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={datePickerStyle}
          />
          <button 
            onClick={fetchAttendance} 
            style={refreshButtonStyle}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={loadingContainerStyle}>
          <div style={loadingSpinnerStyle}></div>
          <p>Loading attendance data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={summaryContainerStyle}>
            <div style={{...summaryCardStyle, background: 'linear-gradient(135deg, #a7f3d0, #10b981)'}}>
              <div style={cardIconStyle}>👨‍🎓</div>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>Total Students</h3>
                <p style={cardValueStyle}>{totalStudents}</p>
              </div>
            </div>
            
            <div style={{...summaryCardStyle, background: 'linear-gradient(135deg, #bfdbfe, #3b82f6)'}}>
              <div style={cardIconStyle}>📊</div>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>Attendance Rate</h3>
                <p style={cardValueStyle}>{attendancePercentage}%</p>
              </div>
            </div>
            
            <div style={{...summaryCardStyle, background: 'linear-gradient(135deg, #bbf7d0, #22c55e)'}}>
              <div style={cardIconStyle}>✅</div>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>Present</h3>
                <p style={cardValueStyle}>{presentees}</p>
              </div>
            </div>
            
            <div style={{...summaryCardStyle, background: 'linear-gradient(135deg, #fecaca, #ef4444)'}}>
              <div style={cardIconStyle}>❌</div>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>Absent</h3>
                <p style={cardValueStyle}>{absentees}</p>
              </div>
            </div>
          </div>

          {/* Charts Container */}
          <div style={chartsContainerStyle}>
            {/* Doughnut Chart */}
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Attendance Overview</h3>
              <div style={doughnutContainerStyle}>
                <Doughnut
                  data={{
                    labels: ["Present", "Absent"],
                    datasets: [
                      {
                        data: [presentees, absentees],
                        backgroundColor: ["#22c55e", "#ef4444"],
                        borderColor: ["#16a34a", "#dc2626"],
                        hoverOffset: 4,
                      },
                    ],
                  }}
                  options={{ 
                    maintainAspectRatio: true, 
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 10,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        padding: 8,
                        bodyFont: {
                          size: 12
                        },
                        titleFont: {
                          size: 14
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Bar Chart - Using abbreviated department names */}
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Attendance by Department</h3>
              <Bar
                data={{
                  labels: getAbbreviatedDepartments(),
                  datasets: [
                    {
                      label: "Attendance %",
                      data: Object.values(departmentStats).map((dept) => dept.percentage),
                      backgroundColor: [
                        "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", 
                        "#ec4899", "#6366f1", "#14b8a6", "#ef4444"
                      ],
                      borderWidth: 0,
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: true,
                  responsive: true,
                  indexAxis: "x",
                  layout: {
                    padding: {
                      right: 10
                    }
                  },
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: function(context) {
                          // Show full department name on tooltip
                          const index = context[0].dataIndex;
                          return Object.keys(departmentStats)[index];
                        },
                        label: function(context) {
                          const value = context.parsed.y || 0;
                          return `Attendance: ${value}%`;
                        }
                      }
                    }
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true, 
                      max: 100,
                      grid: {
                        display: true,
                        drawBorder: true,
                        color: "rgba(0, 0, 0, 0.05)"
                      },
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          
          {/* Department Details - Improved spacing and layout */}
          <div style={detailedStatsContainerStyle}>
            <h3 style={sectionHeadingStyle}>Department Details</h3>
            <div style={departmentGridStyle}>
              {Object.entries(departmentStats).map(([dept, stats], index) => {
                const deptAbbr = deptAbbreviations[dept] || dept;
                return (
                  <div 
                    key={index} 
                    style={{
                      ...departmentCardStyle,
                      borderLeft: `4px solid ${
                        parseFloat(stats.percentage) >= 80 ? "#22c55e" : 
                        parseFloat(stats.percentage) >= 60 ? "#f59e0b" : "#ef4444"
                      }`
                    }}
                  >
                    <h4 style={departmentTitleStyle}>
                      {deptAbbr} <span style={deptFullNameStyle}>({dept})</span>
                    </h4>
                    <div style={departmentStatsStyle}>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Present:</span> 
                        <span style={{...statValueStyle, color: "#22c55e"}}>{stats.presentees}</span>
                      </div>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Absent:</span> 
                        <span style={{...statValueStyle, color: "#ef4444"}}>{stats.absentees}</span>
                      </div>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Total:</span> 
                        <span style={statValueStyle}>{stats.total}</span>
                      </div>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Rate:</span> 
                        <span style={{
                          ...statValueStyle, 
                          color: parseFloat(stats.percentage) >= 80 ? "#22c55e" : 
                                parseFloat(stats.percentage) >= 60 ? "#f59e0b" : "#ef4444"
                        }}>
                          {stats.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Footer spacing to prevent congestion */}
          <div style={footerSpacingStyle}></div>
        </>
      )}
    </div>
  );
};

// Enhanced Styles with better spacing and layout
const dashboardStyle = {
  padding: "24px",
  boxSizing: "border-box",
  backgroundColor: "#f8fafc",
  minHeight: "100vh",
  width: "100%",
  fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const headerContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "16px",
};

const headingStyle = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#1e293b",
  margin: 0,
};

const datePickerContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const labelStyle = {
  fontWeight: "600",
  fontSize: "15px",
  color: "#334155",
};

const datePickerStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
};

const refreshButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const summaryContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  color: "white",
  display: "flex",
  alignItems: "center",
  transition: "transform 0.2s ease",
  cursor: "default",
};

const cardIconStyle = {
  fontSize: "28px",
  marginRight: "16px",
};

const cardContentStyle = {
  display: "flex",
  flexDirection: "column",
};

const cardTitleStyle = {
  margin: "0 0 6px 0",
  fontSize: "16px",
  fontWeight: "600",
  opacity: "0.9",
};

const cardValueStyle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "700",
};

const chartsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "24px",
  marginBottom: "24px",
};

const chartCardStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  height: "280px",
};

const chartTitleStyle = {
  margin: "0 0 14px 0",
  fontSize: "18px",
  fontWeight: "600",
  color: "#334155",
  textAlign: "center",
};

const doughnutContainerStyle = {
  height: "220px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const detailedStatsContainerStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  marginBottom: "16px",
};

const sectionHeadingStyle = {
  margin: "0 0 20px 0",
  fontSize: "20px",
  fontWeight: "600",
  color: "#334155",
};

const departmentGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "20px",
};

const departmentCardStyle = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
};

const departmentTitleStyle = {
  margin: "0 0 14px 0",
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "10px",
};

const deptFullNameStyle = {
  fontSize: "12px",
  fontWeight: "400",
  color: "#64748b",
};

const departmentStatsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
  paddingTop: "4px",
};

const statItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "14px",
  padding: "2px 0",
};

const statLabelStyle = {
  color: "#64748b",
  fontWeight: "500",
};

const statValueStyle = {
  fontWeight: "600",
};

const errorBannerStyle = {
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  fontWeight: "500",
  border: "1px solid #fecaca",
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  color: "#64748b",
};

const loadingSpinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #e2e8f0",
  borderTop: "3px solid #3b82f6",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginBottom: "16px",
};

const footerSpacingStyle = {
  height: "24px",
};

export default Stats;