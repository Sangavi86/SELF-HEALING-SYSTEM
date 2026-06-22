import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/anomaly/anomalies');
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      const data = await res.json();
      setAnomalies(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load anomaly data.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAnomalies = anomalies.length;
  const recentAnomalies = anomalies.filter(a => new Date() - new Date(a.timestamp) < 3600000).length; // last hour
  const highSeverity = anomalies.filter(a => a.severity === 'HIGH').length;

  // Chart data: frequency by hour
  const frequencyMap = {};
  anomalies.forEach(a => {
    const hour = new Date(a.timestamp).getHours() + ':00';
    frequencyMap[hour] = (frequencyMap[hour] || 0) + 1;
  });
  const frequencyData = Object.keys(frequencyMap).map(k => ({ time: k, count: frequencyMap[k] }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Anomaly Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Anomalies" value={totalAnomalies} icon={AlertTriangle} colorClass="bg-yellow-500" />
        <StatCard title="Recent Anomalies (1hr)" value={recentAnomalies} icon={AlertCircle} colorClass="bg-orange-500" />
        <StatCard title="High Severity" value={highSeverity} icon={ShieldAlert} colorClass="bg-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Frequency Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Anomaly Frequency (By Hour)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="Anomalies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPU vs Anomaly List (Simplified to a table/list since true scatter requires continuous data) */}
        <div className="bg-white rounded-lg shadow p-6 overflow-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Anomalies</h2>
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.slice(0, 5).map(a => (
                <tr key={a._id} className="border-b border-gray-100">
                  <td className="px-4 py-2">{new Date(a.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">{a.title}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${a.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {a.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-gray-500">No anomalies detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
