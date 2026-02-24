import React from 'react';
import { LeaderboardEntry } from '../../types';
import { Card } from '../ui/Card';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showLastQuestionPoints?: boolean;
  enablePoints?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  title = 'Leaderboard',
  showLastQuestionPoints = false,
  enablePoints = true
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">{rank}</div>;
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/40 shadow-lg shadow-gray-400/10';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/40 shadow-lg shadow-amber-600/10';
      default:
        return 'bg-white/5 border-white/20 hover:bg-white/10 transition-colors';
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-white text-center mb-6">{title}</h2>
      
      {entries.length === 0 ? (
        <p className="text-white/60 text-center py-8">No players yet...</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.playerId}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${getRankColors(entry.rank)}`}
            >
              <div className="flex items-center gap-4">
                {getRankIcon(entry.rank)}
                <div>
                  <div className="text-white font-semibold text-lg">
                    {entry.nickname}
                  </div>
                  {enablePoints && showLastQuestionPoints && entry.lastQuestionPoints !== undefined && (
                    <div className="text-sm text-white/70">
                      Last question: +{entry.lastQuestionPoints} pts
                    </div>
                  )}
                </div>
              </div>
              
              {enablePoints && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60">points</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
