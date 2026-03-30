import { socket } from '../socket';
import { PublicGameState } from '../types';
import PlayerList from './PlayerList';
import ChainPhase from './ChainPhase';
import CardPhase from './CardPhase';
import JudgingPhase from './JudgingPhase';
import ResultPhase from './ResultPhase';
import LobbyRoom from './LobbyRoom';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  roomCode: string;
  hand: string[];
  error: string | null;
  onLeave: () => void;
}

export default function GameRoom({ gameState, playerId, roomCode, hand, error, onLeave }: Props) {
  const { phase } = gameState;
  const isHost = gameState.hostId === playerId;
  const isJudge = gameState.judgeId === playerId;
  const myPlayer = gameState.players.find((p) => p.id === playerId);

  function emit(event: string, data?: object) {
    socket.emit(event, { roomCode, ...data });
  }

  return (
    <div className="screen">
      {error && <div className="toast-error">{error}</div>}

      {/* ── Header ── */}
      <div className="room-header">
        <div>
          <div className="room-code-label">Stanza</div>
          <div className="room-code-badge">{roomCode}</div>
        </div>

        {phase !== 'lobby' && phase !== 'gameOver' && (
          <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {phase === 'chain' && 'Fase Catena'}
              {phase === 'cards' && 'Fase Carte'}
              {phase === 'judging' && 'Fase Giudizio'}
              {phase === 'roundEnd' && 'Fine Round'}
            </div>
            {myPlayer && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                {myPlayer.score} / {gameState.pointsToWin} punti
              </div>
            )}
          </div>
        )}

        <button className="btn-ghost" onClick={onLeave} style={{ padding: '8px 4px' }}>
          Esci
        </button>
      </div>

      {/* ── Phase content ── */}
      {phase === 'lobby' && (
        <LobbyRoom
          gameState={gameState}
          playerId={playerId}
          isHost={isHost}
          onStart={() => emit('startGame')}
        />
      )}

      {phase === 'chain' && (
        <ChainPhase
          gameState={gameState}
          playerId={playerId}
          isJudge={isJudge}
          onSubmit={(text) => emit('submitChainPiece', { text })}
        />
      )}

      {phase === 'cards' && (
        <CardPhase
          gameState={gameState}
          playerId={playerId}
          isJudge={isJudge}
          hand={hand}
          onSubmit={(cardText) => emit('submitCard', { cardText })}
        />
      )}

      {phase === 'judging' && (
        <JudgingPhase
          gameState={gameState}
          playerId={playerId}
          isJudge={isJudge}
          onReveal={() => emit('revealNextCard')}
          onPickWinner={(cardIndex) => emit('pickWinner', { cardIndex })}
        />
      )}

      {(phase === 'roundEnd' || phase === 'gameOver') && (
        <ResultPhase
          gameState={gameState}
          playerId={playerId}
          isHost={isHost}
          onNextRound={() => emit('startNextRound')}
          onPlayAgain={() => emit('playAgain')}
        />
      )}
    </div>
  );
}
