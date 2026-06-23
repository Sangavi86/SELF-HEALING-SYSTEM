import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import Incidents from './pages/Incidents';
import Anomalies from './pages/Anomalies';
import RootCause from './pages/RootCause';
import Predictions from './pages/Predictions';
import Healing from './pages/Healing';
import Learning from './pages/Learning';
import Logs from './pages/Logs';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-800">Cognitive System</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className="block p-2 rounded hover:bg-gray-200">Dashboard</Link>
            <Link to="/monitoring" className="block p-2 rounded hover:bg-gray-200">Monitoring</Link>
            <Link to="/anomalies" className="block p-2 rounded hover:bg-gray-200">Anomalies</Link>
            <Link to="/rootcause" className="block p-2 rounded hover:bg-gray-200">Root Cause</Link>
            <Link to="/incidents" className="block p-2 rounded hover:bg-gray-200">Incidents</Link>
            <Link to="/predictions" className="block p-2 rounded hover:bg-gray-200">Predictions</Link>
            <Link to="/healing" className="block p-2 rounded hover:bg-gray-200">Healing</Link>
            <Link to="/learning" className="block p-2 rounded hover:bg-gray-200">Learning</Link>
            <Link to="/logs" className="block p-2 rounded hover:bg-gray-200">Logs</Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/rootcause" element={<RootCause />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/healing" element={<Healing />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
