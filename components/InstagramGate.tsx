
import React, { useState, useCallback } from 'react';
import { GAME_CONFIG } from '../constants';
import { supabaseService } from '../services/supabase';

interface Props {
  onFollowed: () => void;
  sfxVolume: number;
  isSfxMuted: boolean;
}

const InstagramGate: React.FC<Props> = ({ onFollowed, sfxVolume, isSfxMuted }) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const playSfx = useCallback((type: keyof typeof GAME_CONFIG.ASSETS.AUDIO) => {
    if (isSfxMuted) return;
    const audio = new Audio(GAME_CONFIG.ASSETS.AUDIO[type]);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  }, [isSfxMuted, sfxVolume]);

  const handleInteractionSfx = useCallback((type: 'hover' | 'click') => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (type === 'hover' && !isMobile) playSfx('CLICK');
    // PC에서도 클릭 사운드가 나도록 수정 (RankingBoard, GameCanvas와 동일 패턴)
    if (type === 'click') playSfx('CLICK');
  }, [playSfx]);

  const handleFollow = async () => {
    handleInteractionSfx('click');
    await supabaseService.trackAction('instagram_follow');
    window.open(GAME_CONFIG.INSTAGRAM_URL, '_blank');
    onFollowed();
  };

  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="absolute inset-0 
                    bg-[#ffffff]/0 bg-white/0
                    rounded-2xl border border-white/30
                    shadow-none shadow-xl
                    flex flex-col items-center justify-center py-[10%] px-[10%] text-center z-50 overflow-hidden">
      
      
      {/* 2. 글라스 오버레이 (Z-5): 배경만 블러 처리하고 UI는 격리 */}
      <div className="liquid-glass-overlay" />

      {/* 3. 상위 UI 레이어 (Z-10): 글라스의 영향을 받지 않고 선명함 유지 */}
      <div className="relative w-full h-[12svh] flex items-center justify-center flex-shrink-0 z-10 translate-y-[1.3svh]">
        {!imgErrors.brandLogo ? (
          <img 
            src={GAME_CONFIG.ASSETS.LOGO_TITLE} 
            alt="Del Monte Brand Logo" 
            className="max-h-full w-auto object-contain drop-shadow-md"
            onError={() => handleImgError('brandLogo')}
          />
        ) : (
          <div className="text-[2.5svh] text-white/70 pixel-font border-2 border-dashed border-white/30 p-2 rounded">
            DEL MONTE
          </div>
        )}
      </div>
      
      <div className="relative flex-grow flex items-center justify-center w-full py-[1svh] max-h-[25svh] animate-sparkle overflow-visible px-4 z-10">
        {!imgErrors.mainLogo ? (
          <img 
            src={GAME_CONFIG.ASSETS.LOGO_GATE} 
            alt="Delmont Brick Breaker Title" 
            className="max-h-[95%] w-auto object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.8)]"
            onError={() => handleImgError('mainLogo')}
          />
        ) : (
          <h1 className="text-[4.5svh] font-bold text-yellow-200 pixel-font drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase leading-tight whitespace-nowrap">
            DELMONT<br/>BRICK BREAKER
          </h1>
        )}
      </div>

      <div className="relative w-full flex flex-col items-center space-y-[2svh] mb-[5%] flex-shrink-0 z-10 mt-[8svh]">
        <button 
          onClick={handleFollow}
          onMouseEnter={() => handleInteractionSfx('hover')}
          className="bg-white/90 text-blue-600 px-[5%] py-[5%] rounded-[2svh] font-bold text-[2svh] shadow-[0_0.6svh_0_rgba(0,0,0,0.2)] active:translate-y-[0.3svh] active:shadow-none transition-all pixel-font leading-none border-none w-full max-w-[320px] hover:bg-white whitespace-nowrap flex items-center justify-center"
        >
          팔로우 하고 게임하기
        </button>

        <div className="text-white pixel-font text-[1.4svh] leading-none bg-black/30 py-[2.5%] px-[8%] rounded-full inline-flex items-center justify-center backdrop-blur-sm whitespace-nowrap">
          델몬트 공식 인스타그램을 팔로우해주세요!
        </div>
      </div>
    </div>
  );
};

export default InstagramGate;
