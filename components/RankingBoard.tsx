import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabaseService } from '../services/supabase';
import { ScoreEntry } from '../types';
import { GAME_CONFIG } from '../constants';
import { sfxPool } from '../services/audioPool';

declare global {
  interface Window {
    Kakao: any;
  }
}

interface Props {
  onBack: () => void;
  onAdmin: () => void;
  sfxVolume: number;
  isSfxMuted: boolean;
  bgmVolume: number;
  isBgmMuted: boolean;
}

const RankingBoard: React.FC<Props> = ({ onBack, onAdmin, sfxVolume, isSfxMuted, bgmVolume, isBgmMuted }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [myRankInfo, setMyRankInfo] = useState<{ rank: number; score: number } | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const myNickname = localStorage.getItem('kakao_linked_nickname');

  const playSfx = useCallback((type: keyof typeof GAME_CONFIG.ASSETS.AUDIO) => {
    if (isSfxMuted) return;
    sfxPool.play(type, sfxVolume);
  }, [isSfxMuted, sfxVolume]);

  const handleInteractionSfx = useCallback((type: 'hover' | 'click', sfxType: keyof typeof GAME_CONFIG.ASSETS.AUDIO = 'CLICK') => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (type === 'hover' && !isMobile) playSfx(sfxType);
    // PC에서도 클릭 사운드가 나도록 수정
    if (type === 'click') playSfx(sfxType);
  }, [playSfx]);

  // 데이터 로딩 useEffect (마운트 시 및 myNickname 변경 시)
  useEffect(() => {
    supabaseService.getScores().then(data => {
      setScores(data);
      setLoading(false);
      if (myNickname) {
        const myIndex = data.findIndex(s => s.nickname === myNickname);
        if (myIndex !== -1) setMyRankInfo({ rank: myIndex + 1, score: data[myIndex].score });
      }
    });

    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(GAME_CONFIG.KAKAO_JS_KEY);
    }
  }, [myNickname]);

  // BGM 초기화 useEffect (마운트 시 1회만)
  useEffect(() => {
    const randomTrack = Math.floor(Math.random() * 5) + 1;
    const bgmKey = `BGM${randomTrack}` as keyof typeof GAME_CONFIG.ASSETS.AUDIO;
    const bgm = new Audio(GAME_CONFIG.ASSETS.AUDIO[bgmKey]);
    bgm.loop = true;
    bgm.volume = isBgmMuted ? 0 : bgmVolume;
    bgm.play().catch(() => {});
    bgmRef.current = bgm;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.removeAttribute('src');
        bgmRef.current.load();
        bgmRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BGM 볼륨 업데이트 useEffect
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = isBgmMuted ? 0 : bgmVolume;
    }
  }, [bgmVolume, isBgmMuted]);

  const maskNickname = (name: string): string => {
    if (name.length <= 2) return name[0] + '*';
    return name.substring(0, Math.floor(name.length / 2)) + '***';
  };

  const handleShare = async () => {
    handleInteractionSfx('click');
    await supabaseService.trackAction('kakao_share');
    
    const lastSessionScoreStr = localStorage.getItem('last_session_score');
    const lastSessionScore = lastSessionScoreStr ? parseInt(lastSessionScoreStr) : 0;
    const myBestScore = myRankInfo ? myRankInfo.score : (scores.length > 0 ? scores[0].score : 0);
    
    const scoreToShare = lastSessionScore > 0 ? lastSessionScore : myBestScore;
    const shareText = `방금 델몬트 브릭 브레이커에서 ${scoreToShare.toLocaleString()}점을 기록했어요! 🍎 제 기록을 깰 수 있을까요?`;

    if (window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '델몬트 브릭 브레이커 🍎',
          description: shareText,
          imageUrl: window.location.origin + GAME_CONFIG.ASSETS.LOGO_GATE,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '나도 도전하기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else if (navigator.share) {
      navigator.share({
        title: '델몬트 브릭 브레이커',
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("링크를 복사해 공유해주세요!");
    }
  };

  const handleBackClick = () => {
    // 다시하기 클릭 시 COUNTDOWN_1 대신 CLICK 소리가 나도록 수정
    handleInteractionSfx('click', 'CLICK');
    onBack();
  };

  return (
    <div className="absolute inset-0 
                    bg-white/0
                    rounded-2xl border border-white/30
                    shadow-none
                    flex flex-col py-[8%] px-[8%] z-40 overflow-hidden text-white">
          
      <div className="liquid-glass-overlay" />

      <div className="relative mb-[3svh] text-center flex-shrink-0 z-10">
        <h2 className="pixel-font text-[4svh] sm:text-[4svh] text-yellow-300 font-bold tracking-tight uppercase title-shadow whitespace-nowrap">RANKING TOP 10</h2>
        <p className="text-[1.3svh] mt-[0.5svh] text-white pixel-font uppercase opacity-100 tracking-tighter whitespace-nowrap" style={{ wordSpacing: '-0.7em' }}>매주 수요일마다 랭킹이 초기화됩니다</p>
      </div>

      <div className="relative bg-white/15 rounded-[3svh] p-[5%] flex-grow overflow-hidden flex flex-col border border-white/50 shadow-inner z-10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center pixel-font text-[2svh] font-bold" style={{ wordSpacing: '-0.7em' }}>로딩 중...</div>
        ) : (
          <div className="flex-grow flex flex-col justify-between overflow-visible gap-[0.5svh]">
            {Array.from({ length: 10 }, (_, i) => scores[i] || null).map((s, idx) => {
              let boxClass = "bg-white/10 border-white/10";
              let textClass = "text-[1.6svh] font-bold text-black";
              let scoreClass = "text-[1.5svh] pixel-font font-bold text-black";
              let rankIcon: React.ReactNode = null;

              if (idx === 0) {
                boxClass = "bg-white border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.4)] z-10 scale-[1.02]";
                textClass = "text-[1.8svh] text-black font-black";
                scoreClass = "text-[1.7svh] text-black font-black pixel-font";
                rankIcon = <span className="text-[2.2svh] mr-[1svh]">👑</span>;
              } else if (idx === 1) {
                boxClass = "bg-white/100 border-yellow-200/50";
                textClass = "text-[1.7svh] text-black font-bold";
                scoreClass = "text-[1.6svh] text-black font-bold pixel-font";
                rankIcon = <span className="text-[2svh] mr-[1svh]">🥈</span>;
              } else if (idx === 2) {
                boxClass = "bg-white/40 border-white/30";
                textClass = "text-[1.7svh] font-bold text-black";
                scoreClass = "text-[1.6svh] pixel-font font-bold text-black";
                rankIcon = <span className="text-[2svh] mr-[1svh]">🥉</span>;
              } else {
                boxClass = "bg-black/5 border-black/5";
                rankIcon = <span className="text-[1.4svh] mr-[1svh] min-w-[3svh] text-center text-black font-bold">#{idx + 1}</span>;
              }

              return (
                <div key={s ? s.id : `empty-${idx}`} className={`flex items-center justify-between rounded-[1.5svh] border transition-all duration-300 h-[calc(10%-0.6svh)] px-[7%] ${s ? boxClass : 'bg-white/50 border-white/100 opacity-100'}`}>
                  <div className="flex items-center overflow-visible">
                    <div>{rankIcon}</div>
                    <span className={`truncate ${textClass} ${s && s.nickname === myNickname ? 'underline underline-offset-2 decoration-yellow-500 decoration-2' : ''}`}>
                      {s ? maskNickname(s.nickname) : '---'}
                    </span>
                  </div>
                  <span className={scoreClass}>{s ? s.score.toLocaleString() : '0'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative mt-[2svh] grid grid-cols-2 gap-[3svh] flex-shrink-0 z-10">
        <button 
          onClick={handleBackClick} 
          onMouseEnter={() => handleInteractionSfx('hover')}
          className="py-[1.4svh] bg-yellow-400 text-black font-bold text-[1.8svh] rounded-[1.5svh] pixel-font shadow-[0_0.3svh_0_#b8860b] border-2 border-black active:translate-y-[0.2svh] active:shadow-none transition-all uppercase whitespace-nowrap overflow-hidden"
          style={{ wordSpacing: '-0.7em' }}
        >
          다시하기
        </button>
        <button 
          onClick={handleShare} 
          onMouseEnter={() => handleInteractionSfx('hover')}
          className="py-[1.4svh] bg-white text-black font-bold text-[1.8svh] rounded-[1.5svh] pixel-font shadow-[0_0.3svh_0_#ccc] border-2 border-black flex items-center justify-center gap-[0.5svh] active:translate-y-[0.2svh] active:shadow-none transition-all uppercase whitespace-nowrap overflow-hidden"
          style={{ wordSpacing: '-0.7em' }}
        >
          공유하기
        </button>
      </div>

      <style>{`
        .title-shadow { text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2); }
      `}</style>
    </div>
  );
};

export default RankingBoard;