import { PublicPlayer } from '../types';

interface Props {
  players: PublicPlayer[];
  playerId: string;
  judgeId: string | null;
  hostId: string;
  pointsToWin: number;
}

const COLORS = ['#e94560', '#4ade80', '#60a5fa', '#facc15', '#f97316', '#a78bfa', '#fb7185', '#34d399'];

export default function PlayerList({ players, playerId, judgeId, hostId, pointsToWin }: Props) {
  return (
    <div className="player-list">
      {players.map((player, i) => {
        const isMe = player.id === playerId;
        const isJudge = player.id === judgeId;
        const isHost = player.id === hostId;
        const initials = player.name.slice(0, 2).toUpperCase();
        const color = COLORS[i % COLORS.length];

        return (
          <div key={player.id} className="player-item" style={{ opacity: player.isConnected ? 1 : 0.5 }}>
            <div className="player-avatar" style={{ background: color + '33', color }}>
              {initials}
            </div>
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-badges">
                {isMe && <span className="badge badge-you">Tu</span>}
                {isJudge && <span className="badge badge-judge">👨‍⚖️ Giudice</span>}
                {isHost && <span className="badge badge-host">👑 Host</span>}
                {!player.isConnected && <span className="badge badge-disconnected">Disconnesso</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div className="player-score">{player.score}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                / {pointsToWin}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
