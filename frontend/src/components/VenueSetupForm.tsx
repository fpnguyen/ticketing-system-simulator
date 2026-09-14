import { useState } from 'react';
import { createVenue } from '../api/client';
import { joinVenue } from '../api/socket';
import { useSimulationStore } from '../state/useSimulationStore';

const MAX_DIMENSION = 30;

export function VenueSetupForm() {
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const applySnapshot = useSimulationStore((s) => s.applySnapshot);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const snapshot = await createVenue({ rows, columns });
      applySnapshot(snapshot);
      joinVenue(snapshot.venue.venueId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create venue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '64px auto' }}>
      <h2>Set up your venue</h2>
      <p className="secondary" style={{ marginBottom: 20 }}>
        Choose how many rows and columns of seats the venue has.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary">Rows</span>
          <input
            type="number"
            min={1}
            max={MAX_DIMENSION}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary">Columns</span>
          <input
            type="number"
            min={1}
            max={MAX_DIMENSION}
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {rows * columns} total seats (max {MAX_DIMENSION}×{MAX_DIMENSION})
        </p>
        {error && <p style={{ color: 'var(--status-critical)' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create venue'}
        </button>
      </form>
    </div>
  );
}
