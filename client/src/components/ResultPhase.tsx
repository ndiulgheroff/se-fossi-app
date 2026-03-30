import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PublicGameState } from '../types';
import PlayerList from './PlayerList';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  isHost: boolean;
  onNextRound: () => void;
  onPlayAgain: () => void;
}

export default function ResultPhase({ gameState, playerId, isHost, onNextRound, onPlayAgain }: Props) {
  const isGameOver = gameState.phase === 'gameOver';
  const fullSentence = gameState.chainPieces.map((p) => p.text).join(' ');

  const roundWinnerCard = gameState.revealedCards.find((c) => c.isWinner);
  const isRoundWinner = gameState.roundWinnerId === playerId;
  const isGameWinner = gameState.winnerPlayerId === playerId;

  useEffect(() => {
    if (isGameOver) {
      // Big confetti burst for game winner
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#e94560', '#ffd700', '#60a5fa', '#4ade80', '#f97316'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 120,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.5 },
          colors: ['#e94560', '#ffd700'],
        });
        confetti({
          particleCount: 120,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.5 },
          colors: ['#60a5fa', '#4ade80'],
        });
      }, 400);
    } else if (isRoundWinner) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#e94560', '#ffd700'],
      });
    }
  }, [isGameOver, isRoundWinner]);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="content-area">
        {isGameOver ? (
          <>
            <div className="gameover-hero">
              <div className="gameover-emoji">🏆</div>
              <div className="gameover-title">Partita Finita!</div>
              <div className="gameover-subtitle">Il vincitore è…</div>
              <div className="gameover-winner-name">{gameState.winnerPlayerName}</div>
              {isGameWinner && (
                <div style={{ marginTop: 8, fontSize: 16, color: 'var(--gold)' }}>
                  🎉 Sei tu il vincitore! Complimenti!
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Classifica Finale</div>
              <div className="scoreboard">
                {[...gameState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, i) => {
                    const pct = Math.min((player.score / gameState.pointsToWin) * 100, 100);
                    return (
                      <div key={player.id} className="score-row">
                        <span style={{ fontSize: 18, width: 28, flexShrink: 0 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>
                          {player.name}
                          {player.id === playerId && (
                            <span style={{ color: 'var(--accent)', marginLeft: 6, fontSize: 12 }}>(tu)</span>
                          )}
                        </span>
                        <div className="score-bar-wrap">
                          <div className="score-bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', width: 28, textAlign: 'right' }}>
                          {player.score}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="phase-label">Fine Round</div>

            {/* Round winner */}
            <div className="result-winner-card">
              <div className="result-winner-emoji">🎉</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Ha vinto il round</div>
              <div className="result-winner-name">{gameState.roundWinnerName}</div>
              {roundWinnerCard && (
                <>
                  <div className="result-winner-card-text" style={{ marginTop: 12 }}>
                    "…{fullSentence}… allora sarei"
                  </div>
                  <div className="result-winner-card-value">"{roundWinnerCard.cardText}"</div>
                </>
              )}
              {isRoundWinner && (
                <div style={{ marginTop: 8, fontSize: 14, color: 'var(--success)' }}>
                  ✨ Sei tu! +1 punto
                </div>
              )}
            </div>

            {/* All cards revealed */}
            {gameState.revealedCards.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Tutte le carte</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {gameState.revealedCards.map((card, i) => (
                    <div
                      key={i}
                      className={`reveal-card ${card.isWinner ? 'winner-pick' : ''}`}
                      style={{ cursor: 'default' }}
                    >
                      <div className="reveal-card-text">{card.cardText}</div>
                      {card.playerName && (
                        <div className="reveal-card-player">
                          giocata da <strong>{card.playerName}</strong>
                          {card.playerId === playerId && ' (tu)'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scores */}
            <div style={{ marginBottom: 8 }}>
              <div className="section-title">Punteggi</div>
              <PlayerList
                players={gameState.players}
                playerId={playerId}
                judgeId={gameState.judgeId}
                hostId={gameState.hostId}
                pointsToWin={gameState.pointsToWin}
              />
            </div>
          </>
        )}
      </div>

      <div className="action-bar">
        {isGameOver ? (
          isHost ? (
            <button className="btn-primary" onClick={onPlayAgain}>
              🔄 Rivincita!
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
              In attesa che l'host decida se giocare ancora…
            </div>
          )
        ) : isHost ? (
          <button className="btn-primary" onClick={onNextRound}>
            ▶ Prossimo Round
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
            In attesa che l'host avvii il prossimo round…
          </div>
        )}
      </div>
    </div>
  );
}
