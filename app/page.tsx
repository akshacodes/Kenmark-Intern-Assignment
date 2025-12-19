"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper: Convert Excel decimals (0.416) to Time (10:00)
const formatTime = (val: string | number) => {
  if (!val || val === "-") return "-";
  
  // If it is already a string like "10:00", return it
  if (typeof val === "string" && val.includes(":")) return val;

  // If it is a number (or string number), convert it
  const num = parseFloat(String(val));
  if (isNaN(num)) return "-";

  // Excel Time -> Hours & Minutes
  const totalHours = num * 24;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  // Format with leading zeros (e.g., 9:5 -> 09:05)
  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  
  return `${hStr}:${mStr}`;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<{ summary: any[], daily: any[] }>({ summary: [], daily: [] });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (json.summary) setData(json);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        setStatus("Success! Data processed.");
        fetchStats(); 
      } else { setStatus("Error uploading file."); }
    } catch (error) { setStatus("Network error."); }
  };

  // New Feature: Download CSV
  const handleDownload = () => {
    if (data.summary.length === 0) return alert("No data to download.");

    // Create CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee Name,Expected Hours,Actual Hours,Leaves Taken,Productivity %\n";

    // Add Rows
    data.summary.forEach(row => {
      csvContent += `${row.name},${row.totalExpectedHours},${row.totalActualHours},${row.leavesTaken},${row.productivityDisplay}\n`;
    });

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Leave & Productivity Analyzer
          </h1>
          {data.summary.length > 0 && (
            <button 
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md flex items-center gap-2"
            >
              Download Report
            </button>
          )}
        </div>

        {/* Upload Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
          <div className="flex gap-4">
            <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 rounded" />
            <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition">Upload Data</button>
          </div>
          {status && <p className="mt-3 font-medium text-blue-600">{status}</p>}
        </div>

        {/* SECTION 1: VISUALIZATION */}
        {data.summary.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
             <h2 className="text-xl font-bold text-gray-700 mb-6">Productivity Comparison</h2>
             <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.summary}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis label={{ value: 'Productivity %', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="productivity" fill="#4F46E5" name="Productivity %" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* SECTION 2: MONTHLY SUMMARY */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5 bg-gray-100 border-b"><h2 className="text-lg font-bold text-gray-700">Monthly Summary</h2></div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4 text-center">Expected Hrs</th>
                <th className="p-4 text-center text-blue-600">Actual Hrs</th>
                <th className="p-4 text-center text-red-500">Leaves</th>
                <th className="p-4 text-center text-green-600">Productivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.summary.map((emp: any) => (
                <tr key={emp.name} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold">{emp.name}</td>
                  <td className="p-4 text-center text-gray-500">{emp.totalExpectedHours}</td>
                  <td className="p-4 text-center font-bold text-blue-700">{emp.totalActualHours}</td>
                  <td className="p-4 text-center font-bold text-red-500">{emp.leavesTaken}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${emp.productivity >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {emp.productivityDisplay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 3: DAILY ATTENDANCE BREAKDOWN */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5 bg-gray-100 border-b"><h2 className="text-lg font-bold text-gray-700">Daily Attendance Breakdown</h2></div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold sticky top-0">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">In Time</th>
                  <th className="p-4">Out Time</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.daily.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">{row.date}</td>
                    <td className="p-4 font-medium">{row.employee}</td>
                    
                    {/* The fix is applied here using formatTime() */}
                    <td className="p-4">{formatTime(row.inTime)}</td>
                    <td className="p-4">{formatTime(row.outTime)}</td>
                    
                    <td className="p-4 font-bold">{row.workedHours}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${row.status === "Present" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}