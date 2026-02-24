import React from 'react';
import { Player } from '../../types';
import { Card } from '../ui/Card';
import { Trophy } from 'lucide-react';

interface LiveMiniLeaderboardProps {
  players: Player[];
  enablePoints?: boolean;
}

export const LiveMiniLeaderboard: React.FC<LiveMiniLeaderboardProps> = ({ players, enablePoints = true }) => {
  const sortedPlayers = React.useMemo(() =>
    [...players]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    [players]
  );

  return (
    <Card className="mt-6 p-4">
      <div className="flex items-center mb-3">
        <Trophy size={20} className="text-yellow-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Top 5 Players</h3>
      </div>
      {sortedPlayers.length === 0 ? (
        <p className="text-center text-white/70 py-4">No scores to display yet.</p>
      ) : (
        <ol className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10"
            >
              <div className="flex items-center overflow-hidden">
                <span
                  className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mr-3 shadow-md ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-800' :
                    index === 2 ? 'bg-yellow-600 text-yellow-100' :
                    'bg-white/10 text-white/70'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-white font-semibold truncate">{player.nickname}</span>
              </div>
              {enablePoints && (
                <span className="text-blue-400 font-bold whitespace-nowrap text-sm">
                  {player.score.toLocaleString()} pts
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
