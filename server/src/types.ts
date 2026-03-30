export type GamePhase = 'lobby' | 'chain' | 'cards' | 'judging' | 'roundEnd' | 'gameOver';

export interface Player {
  id: string;
  name: string;
  score: number;
  hand: string[];
  isConnected: boolean;
}

export interface ChainPiece {
  playerId: string;
  playerName: string;
  text: string;
}

export interface SubmittedCard {
  playerId: string;
  cardText: string;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  judgeIndex: number;
  chainPieces: ChainPiece[];
  chainOrder: string[];
  currentChainTurn: number;
  submittedCards: SubmittedCard[];
  shuffledCards: SubmittedCard[];
  currentRevealIndex: number;
  explicitMode: boolean;
  deck: string[];
  roundWinnerId: string | null;
  pointsToWin: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  handCount: number;
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
