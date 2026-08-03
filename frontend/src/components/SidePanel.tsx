import { X, Briefcase, Building2, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface SidePanelProps {
  nodeId: string | null;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function BadgeSection({ title, items, icon: Icon }: { title: string; items: any[]; icon: any }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="badge-section">
      <div className="badge-section-header">
        <Icon size={14} />
        <span>{title}</span>
      </div>
      <div className="badge-list">
        {items.map((n: any) => (
          <div key={n.id} className="badge-item">
            {n.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SidePanel({ nodeId, onClose }: SidePanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!nodeId) {
      setData(null);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    axios
      .get(`${API_BASE}/node/${nodeId}`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [nodeId]);

  return (
    <div className={`side-panel ${nodeId ? 'open' : ''}`}>
      <button className="panel-close" onClick={onClose} aria-label="Close panel">
        <X size={16} />
      </button>

      {loading ? (
        <div className="panel-loading">
          <div className="loading-spinner" />
          <span style={{ fontSize: '13px' }}>Loading details...</span>
        </div>
      ) : error ? (
        <div className="panel-error">
          <AlertCircle size={28} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ fontSize: '13px' }}>Failed to load node details. Please try again.</p>
        </div>
      ) : data ? (
        <div style={{ marginTop: '12px' }}>
          <div
            className="panel-type-badge"
            style={{ backgroundColor: `var(--color-${data.node.type})` }}
          >
            {data.node.label}
          </div>

          <h2 className="panel-title">{data.node.name}</h2>

          <BadgeSection
            title="Prerequisites"
            items={data.details.requires || data.details.requiredSkills}
            icon={CheckCircle2}
          />
          <BadgeSection title="Leads To" items={data.details.leadsTo} icon={ArrowRight} />
          <BadgeSection title="Unlocks Roles" items={data.details.usedInRoles} icon={Briefcase} />
          <BadgeSection title="Hiring Companies" items={data.details.hiredBy} icon={Building2} />
          <BadgeSection title="Hiring For" items={data.details.hiringRoles} icon={Briefcase} />
        </div>
      ) : null}
    </div>
  );
}
