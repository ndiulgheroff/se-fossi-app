export type GamePhase = 'lobby' | 'chain' | 'cards' | 'judging' | 'roundEnd' | 'gameOver';

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  handCount: number;
}

export interface ChainPiece {
  playerId: string;
  playerName: string;
  text: string;
}

export interface RevealedCard {
  cardText: string;
  playerId?: string;
  playerName?: string;
  isWinner?: boolean;
}

export interface PublicGameState {
  code: string;
  phase: GamePhase;
  hostId: string;
  players: PublicPlayer[];
  judgeId: string;
  chainPieces: ChainPiece[];
  chainOrder: string[];
  currentChainPlayerId: string | null;
  submittedCardsCount: number;
  totalCardsNeeded: number;
  revealedCards: RevealedCard[];
  currentRevealIndex: number;
  allCardsCount: number;
  explicitMode: boolean;
  roundWinnerId: string | null;
  roundWinnerName: string | null;
  pointsToWin: number;
  winnerPlayerId: string | null;
  winnerPlayerName: string | null;
}
