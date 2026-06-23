import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Target, Search, FileText, CheckCircle } from 'lucide-react';

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

export default function RootCause() {
  const [rcas, setRcas] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rootcause/rootcauses');
      if (!res.ok) throw new Error('Failed to fetch RCA data');
      const data = await res.json();
      setRcas(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load Root Cause data.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAnalyses = rcas.length;
  const highConfidence = rcas.filter(r => r.rccs >= 0.7).length;
  const avgConfidence = totalAnalyses > 0 ? (rcas.reduce((acc, r) => acc + r.rccs, 0) / totalAnalyses).toFixed(2) : 0;

  // Chart data: Root Cause Frequency
  const frequencyMap = {};
  rcas.forEach(r => {
    frequencyMap[r.rootCause] = (frequencyMap[r.rootCause] || 0) + 1;
  });
  const frequencyData = Object.keys(frequencyMap).map(k => ({ cause: k, count: frequencyMap[k] }));

  // Confidence distribution (Scatter format)
  const confidenceData = rcas.map((r, i) => ({
    index: i,
    rccs: r.rccs,
    cause: r.rootCause
  }));

  const latestRCA = rcas[0] || null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Root Cause Analysis</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Analyses" value={totalAnalyses} icon={Search} colorClass="bg-blue-500" />
        <StatCard title="High Confidence (>0.7)" value={highConfidence} icon={CheckCircle} colorClass="bg-green-500" />
        <StatCard title="Avg RCCS Score" value={avgConfidence} icon={Target} colorClass="bg-indigo-500" />
        <StatCard title="Unique Causes" value={Object.keys(frequencyMap).length} icon={FileText} colorClass="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Frequency Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Root Cause Frequency</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="cause" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Confidence Distribution (RCCS)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis dataKey="index" name="Analysis #" />
                <YAxis dataKey="rccs" name="Confidence" domain={[0, 1]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Analyses" data={confidenceData} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Evidence Viewer */}
      {latestRCA && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Latest Analysis Evidence Viewer</h2>
          <div className="mb-4">
            <span className="font-semibold text-gray-600">Incident ID:</span> {latestRCA.incidentId?._id || latestRCA.incidentId}
          </div>
          <div className="mb-4">
            <span className="font-semibold text-gray-600">Diagnosed Root Cause:</span> 
            <span className="ml-2 inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold">
              {latestRCA.rootCause}
            </span>
          </div>
          <div className="mb-6">
            <span className="font-semibold text-gray-600">RCCS Score:</span> {latestRCA.rccs}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2">Metric Evidence</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {latestRCA.evidence?.metricEvidence?.map((e, idx) => <li key={idx}>{e}</li>) || <li>None</li>}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2">Log Evidence (NLP)</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {latestRCA.evidence?.logEvidence?.map((e, idx) => <li key={idx}>{e}</li>) || <li>None</li>}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2">Historical Evidence</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {latestRCA.evidence?.historicalEvidence?.map((e, idx) => <li key={idx}>{e}</li>) || <li>None</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
