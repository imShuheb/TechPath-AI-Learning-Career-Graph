import { useEffect, useState } from 'react';
import axios from 'axios';
import NetworkGraph from './components/NetworkGraph';
import SidePanel from './components/SidePanel';
import { Search, BrainCircuit, Compass, AlertTriangle, MousePointerClick } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://techpath-ai-learning-career-graph.onrender.com/api';
axios.defaults.withCredentials = true;

function App() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [knownSkills, setKnownSkills] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      axios.get(`${API_BASE}/graph`),
      axios.get(`${API_BASE}/skills`)
    ])
      .then(([graphRes, skillsRes]) => {
        setGraphData(graphRes.data);
        setAllSkills(skillsRes.data);
      })
      .catch(() => {
        setError('Could not connect to the backend. Make sure the server is running on port 3001.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (knownSkills.length > 0) {
      axios.post(`${API_BASE}/recommendations`, { knownSkills })
        .then(res => setRecommendations(res.data))
        .catch(() => setRecommendations([]));
    } else {
      setRecommendations([]);
    }
  }, [knownSkills]);

  const toggleSkill = (skillId: string) => {
    setKnownSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const filteredSkills = allSkills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Compass size={20} color="#fff" />
            </div>
            <h1>TechPath</h1>
          </div>

          <div className="section-label">Your Known Skills</div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="skills-grid">
            {filteredSkills.length > 0 ? (
              filteredSkills.map(skill => (
                <button
                  key={skill.id}
                  className={`skill-chip ${knownSkills.includes(skill.id) ? 'active' : ''}`}
                  onClick={() => toggleSkill(skill.id)}
                >
                  {skill.name}
                  {knownSkills.includes(skill.id) && <span className="check">✓</span>}
                </button>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', padding: '8px 0' }}>
                {allSkills.length === 0 ? 'Loading skills...' : 'No skills match your search.'}
              </div>
            )}
          </div>
        </div>

        <div className="recommendations">
          <div className="rec-header">
            <BrainCircuit size={18} color="var(--primary)" />
            <h3>Recommended Next Steps</h3>
          </div>

          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <div key={i} className="rec-card">
                <div className="rec-card-top">
                  <span className="rec-skill-name" style={{ color: `var(--color-${rec.skill.type})` }}>
                    {rec.skill.name}
                  </span>
                  <span className="rec-links-count">{rec.connections} links</span>
                </div>
                {rec.unlocksRoles.length > 0 && (
                  <div className="rec-unlocks">
                    Unlocks: {rec.unlocksRoles.join(', ')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <MousePointerClick size={32} />
              <p>
                {knownSkills.length === 0
                  ? 'Select your known skills above to discover what to learn next.'
                  : 'No new recommendations. You know it all!'}
              </p>
            </div>
          )}
        </div>
      </aside>

      <main className="graph-area">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <span className="loading-text">Connecting to CognoDB...</span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <NetworkGraph
            nodes={graphData.nodes}
            links={graphData.links}
            selectedNodeId={selectedNode?.id}
            onNodeClick={(node) => setSelectedNode(node || null)}
          />
        )}

        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-frontend)' }} /> Frontend
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-backend)' }} /> Backend
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-language)' }} /> Language
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-database)' }} /> Database
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-devops)' }} /> DevOps
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-role)' }} /> Role
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-company)' }} /> Company
          </div>
        </div>

        <SidePanel
          nodeId={selectedNode?.id}
          onClose={() => setSelectedNode(null)}
        />
      </main>
    </div>
  );
}

export default App;
