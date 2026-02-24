import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 min-h-screen flex items-center justify-center p-4">
        {/* Background decorative elements matching Layout.tsx */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div id="login-view" className="view-container w-full max-w-md mx-auto relative z-10">
            <div className="auth-card rounded-xl shadow-2xl p-6 sm:p-8 text-center transform transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20">
                 <img src="/assets/logo.svg" className="w-24 h-24 mb-4 mx-auto rounded-full object-cover logo-glow transition-all duration-300" alt="App Logo" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2 sm:mb-4 break-words transition-colors duration-300">Qahoot</h1>
                <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
                    <p className="text-white/80 text-sm sm:text-base transition-colors duration-300">Create and host interactive quizzes.</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4 text-left mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-gray-800/50 border border-gray-700 text-white rounded-full shadow-inner focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-300 outline-none hover:bg-gray-800/80"
                    />
                    <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-gray-800/50 border border-gray-700 text-white rounded-full shadow-inner focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-300 outline-none hover:bg-gray-800/80"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-white/50 hover:text-white transition-colors duration-200 rounded-full outline-none"
                          aria-label="Toggle password visibility"
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>
                <div className="text-right mb-4">
                    <button className="text-sm text-blue-300 hover:text-blue-200 hover:underline focus:outline-none transition-colors duration-200">Forgot Password?</button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <button
                      onClick={handleEmailSignIn}
                      disabled={loading}
                      className="w-full btn-primary py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '...' : 'Sign In'}
                    </button>
                    <button
                      onClick={handleEmailSignUp}
                      disabled={loading}
                      className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '...' : 'Sign Up'}
                    </button>
                </div>
                <div className="relative flex py-3 sm:py-4 items-center">
                    <div className="flex-grow border-t border-white/20 transition-colors duration-300"></div>
                    <span className="flex-shrink mx-2 sm:mx-4 text-white/50 text-xs sm:text-sm font-medium px-2 transition-colors duration-300">OR</span>
                    <div className="flex-grow border-t border-white/20 transition-colors duration-300"></div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full bg-white text-gray-800 hover:bg-gray-100 py-2 sm:py-3 px-3 sm:px-4 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <img src="/assets/google.webp" className="w-5 h-5 sm:w-6 sm:h-6 me-2 sm:me-3" alt="Google icon" />
                        <span>Continue with Google</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
