import { PublicGameState, RevealedCard } from '../types';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  isJudge: boolean;
  onReveal: () => void;
  onPickWinner: (cardIndex: number) => void;
}

export default function JudgingPhase({ gameState, playerId, isJudge, onReveal, onPickWinner }: Props) {
  const fullSentence = gameState.chainPieces.map((p) => p.text).join(' ');
  const allRevealed = gameState.currentRevealIndex >= gameState.allCardsCount;
  const remaining = gameState.allCardsCount - gameState.currentRevealIndex;

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="content-area">
        <div className="phase-label">Fase 3 · Giudizio</div>

        <div className="full-sentence-box" style={{ marginBottom: 16 }}>
          "…{fullSentence}… <span style={{ color: 'var(--accent)', fontWeight: 800 }}>allora sarei ___</span>"
        </div>

        {/* Progress chips */}
        <div style={{ marginBottom: 16 }}>
          <div className="progress-chips">
            {Array.from({ length: gameState.allCardsCount }).map((_, i) => (
              <div
                key={i}
                className={`progress-chip ${i < gameState.currentRevealIndex ? 'revealed' : 'hidden'}`}
              >
                {i < gameState.currentRevealIndex ? i + 1 : '?'}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {gameState.currentRevealIndex} / {gameState.allCardsCount} carte rivelate
          </div>
        </div>

        {/* Revealed cards */}
        {gameState.revealedCards.length > 0 && (
          <div className="reveal-grid">
            {gameState.revealedCards.map((card: RevealedCard, i: number) => (
              <div
                key={i}
                className={`reveal-card ${allRevealed && isJudge ? 'pickable' : ''}`}
                onClick={() => { if (allRevealed && isJudge) onPickWinner(i); }}
                style={{
                  cursor: allRevealed && isJudge ? 'pointer' : 'default',
                  border: allRevealed && isJudge ? '2px solid rgba(233,69,96,0.3)' : '2px solid transparent',
                }}
              >
                <div className="reveal-card-sentence">
                  "…{fullSentence}… allora sarei"
                </div>
                <div className="reveal-card-text">{card.cardText}</div>
                {allRevealed && isJudge && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                    Tocca per scegliere come vincitore 👆
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Face-down remaining cards */}
        {!allRevealed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: gameState.revealedCards.length > 0 ? 8 : 0 }}>
            {Array.from({ length: remaining }).map((_, i) => (
              <div key={i} className="face-down-card">🃏</div>
            ))}
          </div>
        )}

        {!isJudge && !allRevealed && (
          <div className="turn-indicator" style={{ marginTop: 16 }}>
            <div className="turn-dot" />
            <span style={{ fontSize: 14 }}>
              Il giudice sta rivelando le carte…
            </span>
          </div>
        )}

        {!isJudge && allRevealed && (
          <div className="turn-indicator" style={{ marginTop: 16 }}>
            <div className="turn-dot" />
            <span style={{ fontSize: 14 }}>
              Il giudice sta scegliendo il vincitore…
            </span>
          </div>
        )}
      </div>

      {/* Action bar for judge */}
      {isJudge && (
        <div className="action-bar">
          {!allRevealed ? (
            <button className="btn-primary" onClick={onReveal}>
              Rivela prossima carta ({remaining} rimast{remaining === 1 ? 'a' : 'e'})
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
              👆 Tocca la carta più divertente per decretare il vincitore
            </div>
          )}
        </div>
      )}
    </div>
  );
}
