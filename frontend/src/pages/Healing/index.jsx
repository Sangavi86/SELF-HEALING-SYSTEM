import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

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

export default function Healing() {
  const [actions, setActions] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/healing/healing-actions');
      if (!res.ok) throw new Error('Failed to fetch Healing actions');
      const data = await res.json();
      setActions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load Healing data.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (actionId) => {
    try {
      await fetch('http://localhost:5000/api/healing/execute-healing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId })
      });
      fetchData(); // Refresh immediately
    } catch(err) {
      console.error(err);
    }
  };

  const totalActions = actions.length;
  const successfulActions = actions.filter(a => a.status === 'SUCCESS').length;
  const successRate = totalActions > 0 ? ((successfulActions / totalActions) * 100).toFixed(1) : 0;
  
  const avgVerification = totalActions > 0 
    ? (actions.reduce((acc, a) => acc + (a.verificationScore || 0), 0) / actions.filter(a => a.verificationScore).length).toFixed(2)
    : 0;

  const requiresApproval = actions.filter(a => a.status === 'REQUIRES_APPROVAL');
  
  // Charts logic
  const statusCounts = { SUCCESS: 0, FAILED: 0, IN_PROGRESS: 0, REQUIRES_APPROVAL: 0, PENDING: 0 };
  actions.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
  const pieData = Object.keys(statusCounts).filter(k => statusCounts[k] > 0).map(k => ({ name: k, value: statusCounts[k] }));
  const COLORS = { SUCCESS: '#10b981', FAILED: '#ef4444', IN_PROGRESS: '#3b82f6', REQUIRES_APPROVAL: '#f59e0b', PENDING: '#6b7280' };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Healing Agent Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Success Rate" value={`${successRate}%`} icon={ShieldCheck} colorClass="bg-green-500" />
        <StatCard title="Total Actions" value={totalActions} icon={Activity} colorClass="bg-blue-500" />
        <StatCard title="Avg Verification" value={avgVerification} icon={CheckCircle} colorClass="bg-indigo-500" />
        <StatCard title="Pending Approval" value={requiresApproval.length} icon={AlertTriangle} colorClass="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Healing Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Queue */}
        <div className="bg-white rounded-lg shadow p-6 overflow-auto h-80">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Approval Queue (High/Critical Risk)
          </h2>
          {requiresApproval.length === 0 ? (
            <p className="text-gray-500 italic">No actions waiting for manual approval.</p>
          ) : (
            <div className="space-y-4">
              {requiresApproval.map(action => (
                <div key={action._id} className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{action.action}</h3>
                      <p className="text-sm text-gray-600">Root Cause: {action.rootCause}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-700">{action.riskLevel} RISK</span>
                  </div>
                  <div className="mb-3 text-sm">
                    <p><strong>Rollback Plan:</strong> {action.rollbackPlan}</p>
                    <p><strong>Success Probability:</strong> {(action.successProbability * 100).toFixed(0)}%</p>
                  </div>
                  <button 
                    onClick={() => handleApprove(action._id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Approve & Execute Simulated Action
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow p-6 overflow-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" /> Recent Healing Actions
        </h2>
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Root Cause</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Verification Score</th>
            </tr>
          </thead>
          <tbody>
            {actions.map(a => (
              <tr key={a._id} className="border-b border-gray-100">
                <td className="px-4 py-2 font-medium">{a.action}</td>
                <td className="px-4 py-2">{a.rootCause}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${a.riskLevel === 'CRITICAL' ? 'bg-red-200 text-red-800' : a.riskLevel === 'HIGH' ? 'bg-orange-200 text-orange-800' : 'bg-green-100 text-green-700'}`}>
                    {a.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${COLORS[a.status] ? `text-white` : ''}`} style={{ backgroundColor: COLORS[a.status] }}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-2">{a.verificationScore ? a.verificationScore.toFixed(2) : 'N/A'}</td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">No healing actions logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
