import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GameSession, Player, PlayerAnswer } from '../types';

interface GameContextType {
  gameSession: GameSession | null;
  currentPlayer: Player | null;
  loading: boolean;
  error: string | null;
  joinGame: (roomCode: string, nickname: string) => Promise<void>;
  submitAnswer: (answer: number | string, startedAt?: number, endedAt?: number) => Promise<void>;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = async (roomCode: string, nickname: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Find game session by room code
      const q = query(
        collection(db, 'gameSessions'),
        where('roomCode', '==', roomCode.toUpperCase()),
        where('status', 'in', ['waiting', 'question', 'leaderboard', 'active'])
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Game not found. Please check the room code.');
      }

      const sessionDoc = querySnapshot.docs[0];
      const sessionData = sessionDoc.data();
      
      // Check if game is still accepting players
      if (sessionData.status === 'finished') {
        throw new Error('This game has already ended.');
      }

      // Generate a unique player ID
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if nickname is already taken
      const existingPlayer = sessionData.players?.find((p: any) => 
        p.nickname.toLowerCase() === nickname.toLowerCase()
      );
      
      if (existingPlayer) {
        throw new Error('This nickname is already taken. Please choose another one.');
      }

      const newPlayer: Player = {
        id: playerId,
        nickname,
        score: 0,
        answers: [],
        isConnected: true,
        joinedAt: new Date()
      };

      setCurrentPlayer(newPlayer);
      
      // Add player to game session
      const sessionRef = doc(db, 'gameSessions', sessionDoc.id);
      await updateDoc(sessionRef, {
        players: arrayUnion({
          ...newPlayer,
          joinedAt: Timestamp.fromDate(newPlayer.joinedAt)
        })
      });

      // Set up real-time listener for this session
      const gameSessionData: GameSession = {
        ...sessionData,
        id: sessionDoc.id,
        createdAt: sessionData.createdAt?.toDate() || new Date(),
        players: sessionData.players?.map((player: any) => ({
          ...player,
          joinedAt: player.joinedAt?.toDate() || new Date()
        })) || []
      } as GameSession;
      
      setGameSession(gameSessionData);

    } catch (err: any) {
      console.error('Error joining game:', err);
      setError(err.message || 'Failed to join game. Please check the room code and try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: number | string, startedAt?: number, endedAt?: number): Promise<void> => {
    if (!gameSession || !currentPlayer) {
      return;
    }

    const isSelfPaced = gameSession.mode === 'self-paced';

    if (isSelfPaced) {
       if (gameSession.status !== 'active') return;
    } else {
       if (gameSession.status !== 'question') return;
    }

    try {
      const currentQuestionIndex = isSelfPaced
        ? currentPlayer.answers.length
        : gameSession.currentQuestionIndex;

      const currentQuestion = gameSession.quiz.questions[currentQuestionIndex];

      let isCorrect = false;
      let selectedOption: number | undefined;
      let textAnswer: string | undefined;

      if (currentQuestion.type === 'text') {
        // Text answer validation
        textAnswer = String(answer).trim();
        const correctAnswer = String(currentQuestion.correctAnswer || "").trim();

        // If no correct answer is set, treat it as a survey (always "correct" or just valid response)
        if (correctAnswer === "") {
            isCorrect = true;
        } else {
            isCorrect = textAnswer.toLowerCase() === correctAnswer.toLowerCase();
        }
      } else {
        // MCQ validation (default)
        selectedOption = Number(answer);
        // Handle timeout case: if answer is -1, it's incorrect.
        isCorrect = selectedOption !== -1 && selectedOption === Number(currentQuestion.correctAnswer);
      }

      let timeToAnswer = 0;
      if (isSelfPaced && startedAt && endedAt) {
          timeToAnswer = endedAt - startedAt;
      } else if (gameSession.questionStartTime) {
          timeToAnswer = Date.now() - gameSession.questionStartTime;
      }
      
      // Calculate points based on correctness and speed
      let points = 0;
      if (isCorrect) {
        // const timeBonus = Math.max(0, currentQuestion.timeLimit * 1000 - timeToAnswer); // Time bonus logic removed for now
        points = currentQuestion.points; // Use points defined for the question
      }

      const playerAnswer: PlayerAnswer = {
        questionId: currentQuestion.id,
        selectedOption, // Will be undefined for text questions
        textAnswer, // Will be undefined for MCQ questions
        isCorrect,
        timeToAnswer,
        points,
        startedAt,
        endedAt
      };

      // Update local player state
      const updatedPlayer = {
        ...currentPlayer,
        score: currentPlayer.score + points,
        answers: [...currentPlayer.answers, playerAnswer]
      };
      setCurrentPlayer(updatedPlayer);

      // Update Firestore - find and update the specific player
      const sessionRef = doc(db, 'gameSessions', gameSession.id);
      const updatedPlayers = gameSession.players.map(player => 
        player.id === currentPlayer.id ? {
          ...updatedPlayer,
          joinedAt: Timestamp.fromDate(updatedPlayer.joinedAt)
        } : {
          ...player,
          joinedAt: Timestamp.fromDate(player.joinedAt)
        }
      );
      
      await updateDoc(sessionRef, { players: updatedPlayers });

    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    }
  };

  const leaveGame = (): void => {
    setGameSession(null);
    setCurrentPlayer(null);
    setError(null);
  };

  // Listen to game session updates
  useEffect(() => {
    if (!gameSession?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'gameSessions', gameSession.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const updatedSession: GameSession = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            players: data.players?.map((player: any) => ({
              ...player,
              joinedAt: player.joinedAt?.toDate() || new Date()
            })) || []
          } as GameSession;
          
          setGameSession(updatedSession);
          
          if (currentPlayer) {
            const updatedCurrentPlayer = updatedSession.players.find(p => p.id === currentPlayer.id);
            setCurrentPlayer(updatedCurrentPlayer || null);
          }
        } else {
          setError('Game session no longer exists.');
          setGameSession(null);
        }
      },
      (err) => {
        console.error('Error listening to game session:', err);
        setError('Connection lost. Please try rejoining the game.');
      }
    );

    return unsubscribe;
  }, [gameSession?.id, currentPlayer?.id]);

  const value: GameContextType = {
    gameSession,
    currentPlayer,
    loading,
    error,
    joinGame,
    submitAnswer,
    leaveGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
