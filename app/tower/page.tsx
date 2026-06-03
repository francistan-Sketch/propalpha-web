'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface Suggestion {
  name?: string;
  projectName?: string;
  id?: string | number;
  [key: string]: unknown;
}

export default function TowerPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await api.get('/search/suggest', { params: { q: query } });
        const data = res.data;
        const list: Suggestion[] = Array.isArray(data)
          ? data
          : data.suggestions || data.results || data.data || [];
        setSuggestions(list);
        setShowDropdown(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function selectProject(s: Suggestion) {
    const name = (s.name || s.projectName || '') as string;
    setSelectedProject(name);
    setQuery(name);
    setShowDropdown(false);
  }

  return (
    <AppLayout>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Tower View
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
          Visualise unit layouts and availability floor-by-floor.
        </p>

        {/* Search */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
          maxWidth: '520px',
        }}>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
            Search project
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedProject(''); }}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              onBlur={() => { setTimeout(() => setShowDropdown(false), 150); }}
              placeholder="e.g. The Arden, Lentor Hills…"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '9px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface2)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {loadingSuggestions && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '12px' }}>
                …
              </span>
            )}

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0, right: 0,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                overflow: 'hidden',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={(s.id as string) || i}
                    onMouseDown={() => selectProject(s)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                      color: 'var(--text)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    {(s.name || s.projectName) as string}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result area */}
        {selectedProject ? (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗼</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              {selectedProject}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
              Tower grid coming soon for web — available on the PropAlpha mobile app.
            </p>
            <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px' }}>
              📱 Download the app for full tower view
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: '14px',
            padding: '60px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Search for a project above to view its tower layout.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
