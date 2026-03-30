import { useState } from 'react';

interface Props {
  onCreateRoom: (playerName: string, explicitMode: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  error: string | null;
}

export default function Lobby({ onCreateRoom, onJoinRoom, error }: Props) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [explicitMode, setExplicitMode] = useState(false);

  function handleCreate() {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim(), explicitMode);
  }

  function handleJoin() {
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  }

  return (
    <div className="lobby">
      {error && <div className="toast-error">{error}</div>}

      <div className="lobby-logo">🃏</div>
      <h1 className="lobby-title">Se Fossi...</h1>
      <p className="lobby-subtitle">Il gioco di carte italiano da morire dal ridere</p>

      <div className="lobby-tabs">
        <button
          className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
          onClick={() => setTab('create')}
        >
          Crea Stanza
        </button>
        <button
          className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
          onClick={() => setTab('join')}
        >
          Entra
        </button>
      </div>

      <div className="lobby-form">
        <input
          type="text"
          placeholder="Il tuo nome"
          value={playerName}
          maxLength={20}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tab === 'create' ? handleCreate() : handleJoin();
          }}
          autoComplete="off"
          autoCapitalize="words"
        />

        {tab === 'join' && (
          <input
            type="text"
            placeholder="Codice stanza (es. ABCD)"
            value={roomCode}
            maxLength={4}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
            autoComplete="off"
            autoCapitalize="characters"
            style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: '700' }}
          />
        )}

        {tab === 'create' && (
          <div
            className="explicit-toggle"
            onClick={() => setExplicitMode(!explicitMode)}
          >
            <div className="explicit-toggle-label">
              <span>🔞 Modalità Esplicita</span>
              <span>Aggiunge 75 carte piccanti (+18)</span>
            </div>
            <div className={`toggle-pill ${explicitMode ? 'on' : ''}`} />
          </div>
        )}

        {tab === 'create' ? (
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={!playerName.trim()}
          >
            Crea Stanza
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleJoin}
            disabled={!playerName.trim() || !roomCode.trim()}
          >
            Entra nella Stanza
          </button>
        )}
      </div>

      <div style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 340 }}>
        <p>3–10 giocatori · Primo a 5 punti vince</p>
        <p style={{ marginTop: 6 }}>Ogni round: costruite una frase assurda insieme,<br />poi completatela con le vostre carte!</p>
      </div>
    </div>
  );
}
