import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, Network } from 'lucide-react';

const MetricCard = ({ title, value, unit, icon: Icon, colorClass }) => {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(1) : '--';
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{displayValue}{unit}</p>
      </div>
    </div>
  );
};

export default function Monitoring() {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/monitoring/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      
      console.log("Metrics raw data:", data);
      console.log("Is array:", Array.isArray(data));
      if (Array.isArray(data) && data.length > 0) {
        console.log("First item:", data[0]);
      }

      if (!Array.isArray(data)) {
        throw new TypeError("Metrics API response is not an array");
      }
      
      // Data arrives descending by time (newest first). Recharts likes ascending for X-axis.
      const chartData = data.map(d => {
        const date = d.timestamp ? new Date(d.timestamp) : null;
        const timeLabel = (date && !isNaN(date.getTime())) ? date.toLocaleTimeString() : 'N/A';
        return {
          ...d,
          timeLabel
        };
      }).reverse();
      
      setMetrics(chartData);
      setLatest(data[0] || null);
      setError(null);
    } catch (err) {
      console.error("Monitoring Error:", err);
      console.error(err.stack);
      setError('Could not load monitoring data.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">System Monitoring</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="CPU Usage" 
          value={latest?.cpuUsage} 
          unit="%" 
          icon={Cpu} 
          colorClass="bg-blue-500" 
        />
        <MetricCard 
          title="Memory Usage" 
          value={latest?.memoryUsage} 
          unit="%" 
          icon={Activity} 
          colorClass="bg-indigo-500" 
        />
        <MetricCard 
          title="Disk Usage" 
          value={latest?.diskUsage} 
          unit="%" 
          icon={HardDrive} 
          colorClass="bg-purple-500" 
        />
        <MetricCard 
          title="Network Traffic" 
          value={latest ? latest.networkUsage / 1024 : undefined} 
          unit=" KB/s" 
          icon={Network} 
          colorClass="bg-teal-500" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">CPU Usage Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="cpuUsage" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Memory Usage Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="memoryUsage" stroke="#6366f1" strokeWidth={2} dot={false} name="Memory %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Disk Usage Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="diskUsage" stroke="#a855f7" strokeWidth={2} dot={false} name="Disk %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
