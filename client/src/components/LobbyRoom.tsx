import { PublicGameState } from '../types';
import PlayerList from './PlayerList';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  isHost: boolean;
  onStart: () => void;
}

export default function LobbyRoom({ gameState, playerId, isHost, onStart }: Props) {
  const connected = gameState.players.filter((p) => p.isConnected).length;
  const canStart = connected >= 3;

  return (
    <div className="lobby-room">
      <div className="content-area">
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36 }}>🃏</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: 'var(--accent)' }}>
            In attesa dei giocatori
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Condividi il codice{' '}
            <span style={{ fontWeight: 800, color: 'var(--text)', letterSpacing: 2 }}>
              {gameState.code}
            </span>{' '}
            con gli amici
          </div>
          {gameState.explicitMode && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)' }}>
              🔞 Modalità esplicita attiva
            </div>
          )}
        </div>

        <div className="section-title">
          Giocatori ({connected}/10)
        </div>

        <PlayerList
          players={gameState.players}
          playerId={playerId}
          judgeId={null}
          hostId={gameState.hostId}
          pointsToWin={gameState.pointsToWin}
        />

        {!canStart && (
          <div className="waiting-label" style={{ marginTop: 12, justifyContent: 'center' }}>
            <div className="dot-flashing">
              <span /><span /><span />
            </div>
            <span>Servono almeno 3 giocatori ({connected}/3)</span>
          </div>
        )}
      </div>

      <div className="action-bar">
        {isHost ? (
          <button
            className="btn-primary"
            onClick={onStart}
            disabled={!canStart}
          >
            {canStart ? '🚀 Inizia Partita' : `Aspetta altri giocatori (${connected}/3)`}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
            In attesa che l'host avvii la partita…
          </div>
        )}
      </div>
    </div>
  );
}
