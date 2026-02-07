
import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import { GAME_CONFIG } from './constants';
import InstagramGate from './components/InstagramGate';
import GameCanvas from './components/GameCanvas';
import RankingBoard from './components/RankingBoard';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INSTAGRAM_GATE);
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);

  const [bgmVolume, setBgmVolume] = useState(0.15);
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.2);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  const playSfx = useCallback((type: keyof typeof GAME_CONFIG.ASSETS.AUDIO) => {
    if (isSfxMuted) return;
    const audio = new Audio(GAME_CONFIG.ASSETS.AUDIO[type]);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isSfxMuted, sfxVolume]);

  const handleInstagramFollowed = () => {
    playSfx('CLICK');
    setGameState(GameState.READY_TO_START);
  };

  const handleStartGame = (nickname: string) => {
    setUser({ id: Date.now().toString(), nickname });
    setGameState(GameState.COUNTDOWN);
  };

  const handlePlayAgain = () => {
    playSfx('CLICK');
    setGameState(GameState.READY_TO_START);
  };

  const goToRanking = () => setGameState(GameState.RANKING);
  const openAdmin = () => setGameState(GameState.ADMIN);

  const shouldDimBackground = gameState === GameState.COUNTDOWN || gameState === GameState.GAME_OVER;

  return (
    <div 
      className="h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden bg-black relative font-['Galmuri9']"
    >
      {/* PC 환경 전체 배경 */}
      <div className=" absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: `url(${GAME_CONFIG.ASSETS.BACKGROUND_PC})` }}
        />
      </div>

      {/* 배경 오버레이 (딤드) */}
      {shouldDimBackground && (
        <div className="fixed inset-0 bg-black/40 z-[45] animate-fade-in" />
      )}

      {/* 메인 게임 컨테이너 (레터박스 + Glassmorphism 프레임 적용) */}
      <main className="relative z-[50] flex-grow w-full max-w-[100vw] flex items-center justify-center pointer-events-none overflow-hidden p-4 sm:p-6">
        <div 
          className="relative h-full aspect-[9/16] pointer-events-auto
                        overflow-hidden flex flex-col 
                        bg-[#ffffff]/0 backdrop-blur-xl
                        bg-white/0 backdrop-blur-lg
                        rounded-2xl border border-white/30
                        shadow-2xl transition-all duration-500 ease-out"
        >
          {/* 기본 모바일 배경 깔기 */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${GAME_CONFIG.ASSETS.BACKGROUND_MOBILE})` }}
          />
          
          <div className="flex-grow relative w-full h-full overflow-hidden z-10">
            {gameState === GameState.INSTAGRAM_GATE && (
              <InstagramGate onFollowed={handleInstagramFollowed} sfxVolume={sfxVolume} isSfxMuted={isSfxMuted} />
            )}

            {(gameState === GameState.READY_TO_START || 
              gameState === GameState.COUNTDOWN || 
              gameState === GameState.PLAYING || 
              gameState === GameState.LEVEL_CLEAR || 
              gameState === GameState.GAME_OVER) && (
              <GameCanvas 
                gameState={gameState} 
                setGameState={setGameState} 
                user={user}
                onStart={handleStartGame}
                goToRanking={goToRanking}
                bgmVolume={bgmVolume}
                setBgmVolume={setBgmVolume}
                isBgmMuted={isBgmMuted}
                setIsBgmMuted={setIsBgmMuted}
                sfxVolume={sfxVolume}
                setSfxVolume={setSfxVolume}
                isSfxMuted={isSfxMuted}
                setIsSfxMuted={setIsSfxMuted}
              />
            )}

            {gameState === GameState.RANKING && (
              <RankingBoard
                onBack={handlePlayAgain}
                onAdmin={openAdmin}
                sfxVolume={sfxVolume}
                isSfxMuted={isSfxMuted}
                bgmVolume={bgmVolume}
                isBgmMuted={isBgmMuted}
              />
            )}

            {gameState === GameState.ADMIN && (
              <AdminPanel onBack={() => setGameState(GameState.RANKING)} sfxVolume={sfxVolume} isSfxMuted={isSfxMuted} />
            )}
          </div>
        </div>
      </main>

      {/* 푸터 영역 */}
      <footer className="w-full h-[7svh] min-h-[45px] flex flex-col items-center justify-center px-2 bg-black text-white/100 font-medium text-center z-[60] border-t border-white/5 flex-shrink-0">
        <p className="text-[min(0.9svh,7.5px)] leading-[1.2] uppercase tracking-tighter w-full max-w-[420px] break-keep">
          DEL MONTE and Del Monte Shield Logo are registered trademarks of Del Monte Foods Corporation II Inc. used under license.
        </p>
        <p className="text-[min(0.9svh,7.5px)] leading-[1.2] uppercase tracking-tighter mt-[0.3svh]">
          Ⓒ 2026 Del Monte International GmbH. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
