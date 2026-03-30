import { useState } from 'react';
import { PublicGameState } from '../types';
import PlayerList from './PlayerList';

interface Props {
  gameState: PublicGameState;
  playerId: string;
  isJudge: boolean;
  onSubmit: (text: string) => void;
}

const PIECE_COLORS = ['#60a5fa', '#4ade80', '#facc15', '#f97316', '#a78bfa', '#fb7185', '#34d399', '#e94560', '#38bdf8', '#c084fc'];

export default function ChainPhase({ gameState, playerId, isJudge, onSubmit }: Props) {
  const [input, setInput] = useState('');

  const isMyTurn = gameState.currentChainPlayerId === playerId;
  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentChainPlayerId);
  const alreadyContributed = gameState.chainPieces.some((p) => p.playerId === playerId);

  // Placeholder hint for first piece
  const isFirstPiece = gameState.chainPieces.length === 0;
  const placeholder = isFirstPiece ? 'Es: "Se andassi in vacanza..."' : 'Es: "...e avessi il costume..."';

  function handleSubmit() {
    const text = input.trim();
    if (!text) return;
    onSubmit(text);
    setInput('');
  }

  // Build full sentence for display
  function buildSentence() {
    if (gameState.chainPieces.length === 0) return null;
    return gameState.chainPieces.map((piece, i) => ({
      ...piece,
      color: PIECE_COLORS[gameState.chainOrder.indexOf(piece.playerId) % PIECE_COLORS.length],
      index: i,
    }));
  }

  const pieces = buildSentence();

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sentence chain — visual centerpiece */}
      <div className="content-area">
        <div className="phase-label">Fase 1 · Costruisci la frase</div>

        <div className="chain-display">
          {pieces && pieces.length > 0 ? (
            <div className="chain-sentence">
              {pieces.map((piece, i) => (
                <span key={piece.playerId + i} className="chain-piece">
                  {i > 0 && <span className="chain-piece-sep"> </span>}
                  <span className="chain-piece-text" style={{ color: piece.color }}>
                    {piece.text}
                  </span>
                </span>
              ))}
              {isMyTurn && input && (
                <span style={{ color: 'var(--text-muted)' }}> {input}<span className="chain-cursor" /></span>
              )}
              {isMyTurn && !input && <span className="chain-cursor" style={{ marginLeft: 6 }} />}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 18 }}>
              {isMyTurn ? 'Sei il primo! Inizia la frase con "Se..."' : 'In attesa che la catena inizi…'}
              {isMyTurn && input && (
                <span style={{ color: 'var(--text)', fontStyle: 'normal', fontWeight: 700 }}>
                  {' '}{input}<span className="chain-cursor" />
                </span>
              )}
              {isMyTurn && !input && <span className="chain-cursor" style={{ marginLeft: 6 }} />}
            </div>
          )}
        </div>

        {/* Turn order */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Ordine di turno
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {gameState.chainOrder.map((pid, i) => {
              const player = gameState.players.find((p) => p.id === pid);
              const isDone = i < gameState.chainPieces.length;
              const isCurrent = pid === gameState.currentChainPlayerId;
              const isMe = pid === playerId;
              return (
                <div
                  key={pid}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 500,
                    background: isDone
                      ? 'rgba(76,175,80,0.15)'
                      : isCurrent
                      ? 'var(--accent-light)'
                      : 'rgba(255,255,255,0.05)',
                    color: isDone
                      ? 'var(--success)'
                      : isCurrent
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                    border: `1px solid ${isCurrent ? 'rgba(233,69,96,0.3)' : 'transparent'}`,
                  }}
                >
                  {isDone ? '✓ ' : isCurrent ? '→ ' : ''}{player?.name}{isMe ? ' (tu)' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Waiting message for non-current players */}
        {!isMyTurn && !alreadyContributed && currentPlayer && (
          <div className="turn-indicator">
            <div className="turn-dot" />
            <span style={{ fontSize: 14 }}>
              Tocca a <strong style={{ color: 'var(--text)' }}>{currentPlayer.name}</strong>
            </span>
          </div>
        )}

        {alreadyContributed && gameState.currentChainPlayerId !== null && (
          <div className="turn-indicator" style={{ background: 'rgba(76,175,80,0.1)', borderColor: 'rgba(76,175,80,0.3)' }}>
            <span style={{ color: 'var(--success)', fontSize: 14 }}>✓ Hai già aggiunto il tuo pezzo!</span>
          </div>
        )}
      </div>

      {/* Input area */}
      {isMyTurn && (
        <div className="action-bar">
          <textarea
            placeholder={placeholder}
            value={input}
            maxLength={120}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
            style={{
              resize: 'none',
              fontStyle: 'italic',
              fontSize: 15,
              borderRadius: 'var(--radius-sm)',
            }}
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={!input.trim()}>
            Aggiungi alla frase →
          </button>
        </div>
      )}
    </div>
  );
}
