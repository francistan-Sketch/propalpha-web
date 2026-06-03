'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface Project {
  id?: string | number;
  name?: string;
  projectName?: string;
  district?: string | number;
  units?: number | string;
  totalUnits?: number | string;
  launchDate?: string;
  launch_date?: string;
  [key: string]: unknown;
}

const DISTRICTS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function LaunchesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await api.get('/newlaunch/projects');
        const data = res.data;
        const list: Project[] = Array.isArray(data)
          ? data
          : data.projects || data.results || data.data || [];
        setProjects(list);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr?.response?.data?.message || 'Failed to load new launches.');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const filtered = districtFilter
    ? projects.filter((p) => String(p.district) === districtFilter)
    : projects;

  const getName = (p: Project) => (p.name || p.projectName || 'Unnamed Project') as string;
  const getUnits = (p: Project) => p.units || p.totalUnits;
  const getDate = (p: Project) => p.launchDate || p.launch_date || '—';

  return (
    <AppLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              New Launches
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Active and upcoming new launch projects in Singapore.
            </p>
          </div>
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="">All Districts</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={String(d)}>District {d}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading new launches…
          </div>
        )}

        {error && !loading && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            padding: '16px',
            color: '#f87171',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</div>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              {districtFilter ? `No projects found in District ${districtFilter}.` : 'No new launches available.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map((project, i) => (
              <div
                key={(project.id as string) || i}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                }}
              >
                {/* Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(79,142,247,0.15)',
                    color: 'var(--accent)',
                    letterSpacing: '0.04em',
                  }}>
                    {project.district ? `D${project.district}` : 'NEW LAUNCH'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {getDate(project)}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 }}>
                  {getName(project)}
                </h3>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {getUnits(project) && (
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>UNITS</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                        {getUnits(project)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
