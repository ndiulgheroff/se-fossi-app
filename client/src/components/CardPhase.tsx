import { useState } from 'react';
import { PublicGameState } from '../types';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  isJudge: boolean;
  hand: string[];
  onSubmit: (cardText: string) => void;
}

export default function CardPhase({ gameState, playerId, isJudge, hand, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fullSentence = gameState.chainPieces.map((p) => p.text).join(' ');
  const hasSubmitted =
    submitted ||
    // The server removes the card from hand when submitted, so if card count dropped, they submitted
    gameState.players.find((p) => p.id === playerId)?.handCount === (hand.length);

  // Detect if we've already submitted (card no longer in our sent state)
  const alreadySubmitted = gameState.players.find((p) => p.id === playerId)?.handCount === hand.length
    ? submitted
    : true;

  function handleSubmit() {
    if (!selected || submitted) return;
    onSubmit(selected);
    setSubmitted(true);
  }

  if (isJudge) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="content-area">
          <div className="phase-label">Fase 2 · Fase Carte</div>

          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚖️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Sei il Giudice
            </div>
            <div style={{ fontSize: 14 }}>
              Aspetta che tutti giochino le loro carte…
            </div>
          </div>

          <div className="full-sentence-box">
            "…{fullSentence}… <span style={{ color: 'var(--accent)', fontWeight: 800 }}>allora sarei ___</span>"
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              Carte ricevute
            </div>
            <div className="progress-chips">
              {Array.from({ length: gameState.totalCardsNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`progress-chip ${i < gameState.submittedCardsCount ? 'revealed' : 'hidden'}`}
                >
                  {i < gameState.submittedCardsCount ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              {gameState.submittedCardsCount} / {gameState.totalCardsNeeded}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="content-area">
          <div className="phase-label">Fase 2 · Fase Carte</div>

          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 56 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)', marginTop: 12 }}>
              Carta giocata!
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              Aspetta che tutti giochino…
            </div>
          </div>

          <div className="full-sentence-box">
            "…{fullSentence}… <span style={{ color: 'var(--accent)', fontWeight: 800 }}>allora sarei {selected}</span>"
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="progress-chips" style={{ justifyContent: 'center' }}>
              {Array.from({ length: gameState.totalCardsNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`progress-chip ${i < gameState.submittedCardsCount ? 'revealed' : 'hidden'}`}
                >
                  {i < gameState.submittedCardsCount ? '✓' : '…'}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              {gameState.submittedCardsCount} / {gameState.totalCardsNeeded} carte ricevute
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="content-area">
        <div className="phase-label">Fase 2 · Scegli una carta</div>

        <div className="full-sentence-box" style={{ marginBottom: 16 }}>
          "…{fullSentence}… <span style={{ color: 'var(--accent)', fontWeight: 800 }}>allora sarei ___</span>"
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          La tua mano — tocca una carta per selezionarla:
        </div>

        <div className="hand-grid">
          {hand.map((cardText) => (
            <div
              key={cardText}
              className={`game-card ${selected === cardText ? 'selected' : ''}`}
              onClick={() => setSelected(cardText === selected ? null : cardText)}
            >
              <div className="game-card-corner">🃏</div>
              <div className="game-card-prefix">…allora sarei</div>
              <div className="game-card-text">{cardText}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-bar">
        {selected && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px 4px' }}>
            Hai selezionato: <strong style={{ color: 'var(--text)' }}>{selected}</strong>
          </div>
        )}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!selected}
        >
          {selected ? `Gioca "${selected}"` : 'Seleziona una carta'}
        </button>
      </div>
    </div>
  );
}
