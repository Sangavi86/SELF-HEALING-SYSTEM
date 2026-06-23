import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

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

export default function Learning() {
  const [insights, setInsights] = useState([]);
  const [history, setHistory] = useState([]);
  const [globalSHEI, setGlobalSHEI] = useState(0);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res1 = await fetch('http://localhost:5000/api/learning/learning-insights');
      const data1 = await res1.json();
      setInsights(data1.insights || []);
      setGlobalSHEI(data1.globalSHEI || 0);

      const res2 = await fetch('http://localhost:5000/api/learning/learning-insights/latest');
      const data2 = await res2.json();
      setHistory(data2 || []);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load Learning data.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = async () => {
    try {
      await fetch('http://localhost:5000/api/learning/retrain-learning', { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const bestInsight = insights.length > 0 ? insights[0] : null;
  const worstInsight = insights.length > 0 ? insights[insights.length - 1] : null;

  // Chart Formatting
  const barData = insights.map(i => ({
    name: i.recommendedAction.substring(0, 15) + '...',
    successRate: (i.successRate * 100).toFixed(0),
    confidence: (i.recommendationConfidence * 100).toFixed(0)
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Learning Agent Dashboard</h1>
        <button 
          onClick={handleRetrain}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow flex items-center font-medium">
          <Brain className="w-5 h-5 mr-2" /> Force Optimization Cycle
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Ecosystem SHEI Score" value={`${(globalSHEI * 100).toFixed(1)}%`} icon={Target} colorClass="bg-blue-500" />
        <StatCard title="Total Optimizations" value={history.length} icon={Zap} colorClass="bg-yellow-500" />
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Top Strategy</p>
          <p className="text-lg font-bold text-gray-800 truncate" title={bestInsight?.recommendedAction}>{bestInsight ? bestInsight.recommendedAction : 'N/A'}</p>
          <p className="text-xs text-green-600 font-bold flex items-center mt-1">
            <TrendingUp className="w-3 h-3 mr-1" /> Conf: {bestInsight ? (bestInsight.recommendationConfidence * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Needs Improvement</p>
          <p className="text-lg font-bold text-gray-800 truncate" title={worstInsight?.recommendedAction}>{worstInsight ? worstInsight.recommendedAction : 'N/A'}</p>
          <p className="text-xs text-red-600 font-bold flex items-center mt-1">
            <TrendingDown className="w-3 h-3 mr-1" /> Conf: {worstInsight ? (worstInsight.recommendationConfidence * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Comparison Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Strategy Success Comparison</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 10}} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="successRate" name="Success Rate %" fill="#3b82f6" />
                <Bar dataKey="confidence" name="Confidence %" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History Log */}
        <div className="bg-white rounded-lg shadow p-6 overflow-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-indigo-500" /> Recent Learning History
          </h2>
          <div className="space-y-4">
            {history.map(h => {
              const diff = h.newConfidence - h.previousConfidence;
              const isPositive = diff > 0;
              return (
                <div key={h._id} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-sm text-gray-700">{h.action}</span>
                    <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-500'} flex items-center`}>
                      {isPositive ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                      {(diff * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Root Cause: {h.rootCause}</p>
                  <p className="text-xs text-gray-500 italic mt-1">{h.reason}</p>
                </div>
              )
            })}
            {history.length === 0 && <p className="text-sm text-gray-500">No learning cycles recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
