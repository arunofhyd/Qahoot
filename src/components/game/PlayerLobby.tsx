import React from 'react';
import { Player } from '../../types';
import { Card } from '../ui/Card';
import { Users, Crown, UserMinus } from 'lucide-react';

interface PlayerLobbyProps {
  players: Player[];
  roomCode: string;
  isHost?: boolean;
  gameStatus?: string;
  onKickPlayer?: (playerId: string) => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({
  players,
  roomCode,
  isHost = false,
  gameStatus = 'waiting',
  onKickPlayer
}) => {
  return (
    <div className="space-y-6">
      <Card className="text-center">
        <div className="mb-4">
          {isHost && <Crown className="mx-auto mb-2 text-yellow-400" size={32} />}
          <h2 className="text-3xl font-bold text-white mb-2">
            Room Code: {roomCode}
          </h2>
          <p className="text-white/70">
            {isHost 
              ? `${players.length} player${players.length !== 1 ? 's' : ''} in lobby` 
              : 'Waiting for the game to start...'
            }
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-white/60">
          <Users size={20} />
          <span>
            {players.length} player{players.length !== 1 ? 's' : ''} 
            {gameStatus === 'waiting' ? ' joined' : ' playing'}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Players</h3>
        </div>
        {players.length === 0 ? (
          <p className="text-white/60 text-center py-8">
            No players have joined yet...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white/10 hover:bg-white/15 rounded-lg p-3 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center flex-1 min-w-0 mr-2">
                  <span className="text-white font-medium truncate">{player.nickname}</span>
                  <div className={`w-3 h-3 rounded-full ml-2 flex-shrink-0 ${
                  player.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} 
                    title={player.isConnected ? 'Online' : 'Offline'}
                  />
                </div>

                {isHost && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="text-white/40 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Kick player"
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};