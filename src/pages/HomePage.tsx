import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layouts/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useGame } from '../contexts/GameContext';
import { Play, Users, Crown, Gamepad2, CircleDollarSign, Mail } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { joinGame } = useGame();
  const navigate = useNavigate();

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim() || !nickname.trim()) {
      setError('Please enter both room code and nickname');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await joinGame(roomCode.trim().toUpperCase(), nickname.trim());
      navigate('/game');
    } catch (err: any) { // Explicitly type err as any to access err.message
      setError(err.message || 'Failed to join game. Please check the room code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="text-blue-400" size={48} />
            <h1 className="text-5xl font-bold text-white">Qahoot</h1>
          </div>
          <p className="text-xl text-white/70">
            Join the fun or host your own interactive quiz!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Join Game Section */}
          <Card>
            <div className="text-center mb-6">
              <div className="bg-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Play className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Join a Quiz</h2>
              <p className="text-white/70">Enter a room code to join the fun!</p>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-4">
              <Input
                label="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="text-center text-lg font-bold tracking-wider uppercase"
                required
              />

              <Input
                label="Your Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={20}
                required
              />

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                icon={<Users size={20} />}
              >
                Join Game
              </Button>
            </form>
          </Card>

          {/* Host Game Section */}
          <Card>
            <div className="text-center mb-6">
              <div className="bg-yellow-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Host a Quiz</h2>
              <p className="text-white/70">Create and host your own interactive quiz!</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-2">Host Features:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Create custom quizzes</li>
                  <li>• Real-time player management</li>
                  <li>• Live leaderboards</li>
                  <li>• Full game control</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="w-full"
                size="lg"
                icon={<Crown size={20} />}
              >
                Sign In to Host
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Why Choose Qahoot?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <CircleDollarSign className="text-yellow-400 text-3xl mb-4 mx-auto" />
              <h4 className="text-white font-semibold mb-2">Completely Free</h4>
              <p className="text-white/60 text-sm">
                Enjoy all features without any cost. Unlike Kahoot! or Mentimeter, Qahoot offers a full experience for free!
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-blue-400 text-3xl mb-4">⚡</div>
              <h4 className="text-white font-semibold mb-2">Real-time Experience</h4>
              <p className="text-white/60 text-sm">
                Lightning-fast synchronization across all devices for seamless gameplay
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-green-400 text-3xl mb-4">🎯</div>
              <h4 className="text-white font-semibold mb-2">Easy to Use</h4>
              <p className="text-white/60 text-sm">
                Simple interface that anyone can use - no complicated setup required
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-teal-400 text-3xl mb-4">🏆</div>
              <h4 className="text-white font-semibold mb-2">Engaging Features</h4>
              <p className="text-white/60 text-sm">
                Live leaderboards, timers, and scoring to keep everyone engaged
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Need Help or Have Feedback?</h4>
              <p className="text-white/70 mb-4">
                We'd love to hear from you! Report bugs, suggest features, or just say hello.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open('mailto:arunthomas04042001@gmail.com?subject=Qahoot%20Feedback', '_blank')}
                className="inline-flex items-center gap-2"
              >
                <Mail size={18} />
                Contact Developer
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};