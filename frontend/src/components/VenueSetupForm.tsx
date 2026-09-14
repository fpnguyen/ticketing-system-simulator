import { useState } from 'react';
import { createVenue } from '../api/client';
import { joinVenue } from '../api/socket';
import { useSimulationStore } from '../state/useSimulationStore';

const MAX_DIMENSION = 30;

export function VenueSetupForm() {
  const [rowsInput, setRowsInput] = useState('8');
  const [columnsInput, setColumnsInput] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const applySnapshot = useSimulationStore((s) => s.applySnapshot);

  const rows = Number(rowsInput);
  const columns = Number(columnsInput);
  const rowsValid = Number.isInteger(rows) && rows >= 1 && rows <= MAX_DIMENSION;
  const columnsValid = Number.isInteger(columns) && columns >= 1 && columns <= MAX_DIMENSION;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rowsValid || !columnsValid) {
      setError(`Rows and columns must be whole numbers between 1 and ${MAX_DIMENSION}`);
      return;
    }
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
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary">Columns</span>
          <input
            type="number"
            min={1}
            max={MAX_DIMENSION}
            value={columnsInput}
            onChange={(e) => setColumnsInput(e.target.value)}
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {rowsValid && columnsValid ? rows * columns : '—'} total seats (max {MAX_DIMENSION}×{MAX_DIMENSION})
        </p>
        {error && <p style={{ color: 'var(--status-critical)' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create venue'}
        </button>
      </form>
    </div>
  );
}
