import { useState } from 'react';
import { resetVenue, startSimulation } from '../api/client';
import type { ArrivalPattern } from '../types/shared';

interface SimulationControlPanelProps {
  venueId: string;
  totalSeats: number;
  onError: (message: string) => void;
}

export function SimulationControlPanel({ venueId, totalSeats, onError }: SimulationControlPanelProps) {
  const [requestCountInput, setRequestCountInput] = useState(String(Math.round(totalSeats * 2)));
  const [concurrencyInput, setConcurrencyInput] = useState('5');
  const [arrivalPattern, setArrivalPattern] = useState<ArrivalPattern>('burst');
  const [hotSeatRatio, setHotSeatRatio] = useState(0.15);
  const [busy, setBusy] = useState(false);

  const requestCount = Number(requestCountInput);
  const concurrency = Number(concurrencyInput);
  const requestCountValid = Number.isInteger(requestCount) && requestCount >= 1 && requestCount <= 5000;
  const concurrencyValid = Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 20;

  async function handleSimulate() {
    if (!requestCountValid || !concurrencyValid) {
      onError('Requests must be 1-5000 and concurrency must be 1-20');
      return;
    }
    setBusy(true);
    try {
      await startSimulation(venueId, { requestCount, concurrency, arrivalPattern, hotSeatRatio });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to start simulation');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset the venue? All seats will become available again.')) return;
    setBusy(true);
    try {
      await resetVenue(venueId);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to reset venue');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Simulate purchase requests</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary" style={{ fontSize: 13 }}>
            Number of requests
          </span>
          <input
            type="number"
            min={1}
            max={5000}
            value={requestCountInput}
            onChange={(e) => setRequestCountInput(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary" style={{ fontSize: 13 }}>
            Concurrency (workers)
          </span>
          <input
            type="number"
            min={1}
            max={20}
            value={concurrencyInput}
            onChange={(e) => setConcurrencyInput(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary" style={{ fontSize: 13 }}>
            Arrival pattern
          </span>
          <select value={arrivalPattern} onChange={(e) => setArrivalPattern(e.target.value as ArrivalPattern)}>
            <option value="burst">Burst (all at once)</option>
            <option value="trickle">Trickle (staggered)</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="secondary" style={{ fontSize: 13 }}>
            Hot-seat ratio: {(hotSeatRatio * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.05}
            value={hotSeatRatio}
            onChange={(e) => setHotSeatRatio(Number(e.target.value))}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={handleSimulate} disabled={busy}>
          Generate {requestCountValid ? requestCount : ''} requests
        </button>
        <button type="button" onClick={handleReset} disabled={busy}>
          Reset venue
        </button>
      </div>
    </div>
  );
}
