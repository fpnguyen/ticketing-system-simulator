import { useEffect, useState } from 'react';
import { VenueSetupForm } from './components/VenueSetupForm';
import { SeatGrid } from './components/SeatGrid';
import { SimulationControlPanel } from './components/SimulationControlPanel';
import { QueuePipelineView } from './components/QueuePipelineView';
import { ThroughputChart } from './components/ThroughputChart';
import { TransactionLogFeed } from './components/TransactionLogFeed';
import { ManualControlsPanel } from './components/ManualControlsPanel';
import { useSimulationStore } from './state/useSimulationStore';
import { wireSocketListeners } from './state/wireSocketListeners';

export default function App() {
  const venue = useSimulationStore((s) => s.venue);
  const connected = useSimulationStore((s) => s.connected);
  const leaveVenue = useSimulationStore((s) => s.leaveVenue);
  const [error, setError] = useState<string | null>(null);

  function handleNewVenue() {
    if (!confirm('Start a new venue? This just returns to setup — the current one keeps running in the background.')) return;
    leaveVenue();
  }

  useEffect(() => {
    wireSocketListeners();
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>Ticketing System Simulator</h1>
          {venue && (
            <p className="muted" style={{ fontSize: 13 }}>
              {venue.rows}×{venue.columns} venue — {venue.rows * venue.columns} seats
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {venue && (
            <button type="button" onClick={handleNewVenue}>
              New venue
            </button>
          )}
          <span className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? 'var(--status-good)' : 'var(--status-critical)',
                display: 'inline-block',
              }}
            />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {error && (
        <div
          className="card"
          style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)', marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      {!venue ? (
        <VenueSetupForm />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SeatGrid venueId={venue.venueId} columns={venue.columns} onError={setError} />
            <SimulationControlPanel venueId={venue.venueId} totalSeats={venue.rows * venue.columns} onError={setError} />
            <ManualControlsPanel venueId={venue.venueId} onError={setError} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <QueuePipelineView />
            <ThroughputChart />
            <TransactionLogFeed />
          </div>
        </div>
      )}
    </div>
  );
}
