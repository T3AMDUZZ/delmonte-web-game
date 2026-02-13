
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, BrickType, Brick, Ball } from '../types';
import { GAME_CONFIG, FRUIT_COLORS } from '../constants';
import { sfxPool } from '../services/audioPool';
import { supabaseService } from '../services/supabase';

declare global {
  interface Window {
    Kakao: any;
  }
}

interface Props {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  user: { id: string; nickname: string } | null;
  onStart: (nickname: string) => void;
  goToRanking: () => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
  isBgmMuted: boolean;
  setIsBgmMuted: (m: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  isSfxMuted: boolean;
  setIsSfxMuted: (m: boolean) => void;
}

const Confetti: React.FC = () => {
  const pieces = Array.from({ length: 80 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
      {pieces.map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-4 opacity-90"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            backgroundColor: ['#FFD700', '#FF4500', '#ADFF2F', '#00BFFF', '#FF69B4', '#FFFFFF'][Math.floor(Math.random() * 6)],
            animation: `confetti-fall ${2 + Math.random() * 3}s linear infinite`,
            animationDelay: `${Math.random() * 4}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(700px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const GameCanvas: React.FC<Props> = ({
  gameState, setGameState, user: _user, onStart, goToRanking,
  bgmVolume, setBgmVolume, isBgmMuted, setIsBgmMuted: _setIsBgmMuted,
  sfxVolume, setSfxVolume, isSfxMuted, setIsSfxMuted: _setIsSfxMuted
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [nicknameInput, setNicknameInput] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCrossActive, setIsCrossActive] = useState<boolean>(false);
  const [crossAnimId, setCrossAnimId] = useState<string | null>(null);
  const [pauseResumeCountdown, setPauseResumeCountdown] = useState<number>(0);
  const [animatingBrickIds, setAnimatingBrickIds] = useState<Set<string>>(new Set());

  const brickImages = useRef<Record<string, HTMLImageElement>>({});
  const mobileBgImage = useRef<HTMLImageElement | null>(null);
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  const bgmVolumeRef = useRef(bgmVolume);
  const isBgmMutedRef = useRef(isBgmMuted);
  const sfxVolumeRef = useRef(sfxVolume);
  const isSfxMutedRef = useRef(isSfxMuted);
  const isCrossFadingRef = useRef(false);

  const isPausedRef = useRef(isPaused);
  const isCrossActiveRef = useRef(isCrossActive);
  const pauseResumeCountdownRef = useRef(pauseResumeCountdown);

  const handleBrickBreakRef = useRef<((brick: Brick, sourceBall?: Ball, isEffect?: boolean) => void) | null>(null);

  useEffect(() => { bgmVolumeRef.current = bgmVolume; }, [bgmVolume]);
  useEffect(() => { isBgmMutedRef.current = isBgmMuted; }, [isBgmMuted]);
  useEffect(() => { sfxVolumeRef.current = sfxVolume; }, [sfxVolume]);
  useEffect(() => { isSfxMutedRef.current = isSfxMuted; }, [isSfxMuted]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isCrossActiveRef.current = isCrossActive; }, [isCrossActive]);
  useEffect(() => { pauseResumeCountdownRef.current = pauseResumeCountdown; }, [pauseResumeCountdown]);

  useEffect(() => {
    Object.entries(GAME_CONFIG.ASSETS.AUDIO).forEach(([key, src]) => {
      if (!key.startsWith('BGM')) sfxPool.preload(key, src);
    });
  }, []);

  const triggerSfx = useCallback((type: keyof typeof GAME_CONFIG.ASSETS.AUDIO) => {
    if (isSfxMutedRef.current || sfxVolumeRef.current <= 0) return;
    sfxPool.play(type, sfxVolumeRef.current);
  }, []);

  const paddleRef = useRef({ 
    x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH) / 2, 
    w: GAME_CONFIG.PADDLE_WIDTH 
  });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const scoreRef = useRef<number>(0);
  const speedRef = useRef<number>(GAME_CONFIG.INITIAL_BALL_SPEED);
  const lastCrossSpawnScore = useRef<number>(0);

  const PADDLE_Y_FROM_BOTTOM = 70;
  const CEILING_Y = 80; 

  useEffect(() => {
    Object.entries(GAME_CONFIG.ASSETS.BRICKS).forEach(([key, path]) => {
      const img = new Image();
      img.src = path;
      brickImages.current[key] = img;
    });

    const bgi = new Image();
    bgi.src = GAME_CONFIG.ASSETS.BACKGROUND_MOBILE;
    bgi.onload = () => { mobileBgImage.current = bgi; };
  }, []);

  useEffect(() => {
    const savedNick = localStorage.getItem('kakao_linked_nickname');
    if (savedNick) setNicknameInput(savedNick);
  }, []);

  const randomizeBGM = useCallback(() => {
    if (bgmAudio.current) {
      bgmAudio.current.pause();
      bgmAudio.current.removeAttribute('src');
      bgmAudio.current.load();
      bgmAudio.current = null;
    }
    const track = Math.floor(Math.random() * 5) + 1;
    const bgmName = `BGM${track}` as keyof typeof GAME_CONFIG.ASSETS.AUDIO;
    const bgm = new Audio(GAME_CONFIG.ASSETS.AUDIO[bgmName]);
    bgm.loop = true;
    bgmAudio.current = bgm;
  }, []);

  useEffect(() => {
    if (!bgmAudio.current) {
      randomizeBGM();
    }
    return () => {
      if (bgmAudio.current) {
        bgmAudio.current.pause();
        bgmAudio.current.removeAttribute('src');
        bgmAudio.current.load();
        bgmAudio.current = null;
      }
    };
  }, [randomizeBGM]);

  const handleInteractionSfx = useCallback((type: 'hover' | 'click', sfxType: keyof typeof GAME_CONFIG.ASSETS.AUDIO = 'CLICK') => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (type === 'hover' && !isMobile) triggerSfx(sfxType);
    if (type === 'click') triggerSfx(sfxType);
  }, [triggerSfx]);

  const playRandomHit = useCallback(() => {
    const hits: (keyof typeof GAME_CONFIG.ASSETS.AUDIO)[] = ['HIT1', 'HIT2', 'HIT3'];
    const randomHit = hits[Math.floor(Math.random() * hits.length)];
    triggerSfx(randomHit);
  }, [triggerSfx]);

  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  useEffect(() => {
    if (bgmAudio.current) {
      if (!isCrossActive && !isCrossFadingRef.current) {
        bgmAudio.current.volume = isBgmMuted ? 0 : bgmVolume;
      }
      const isMenuOrPlaying = (gameState === GameState.READY_TO_START || gameState === GameState.COUNTDOWN || gameState === GameState.PLAYING);
      if (isMenuOrPlaying && !isBgmMuted && !isCrossActive) {
        bgmAudio.current.play().catch(() => {});
      } else if (!isCrossActive) {
        bgmAudio.current.pause();
      }
    }
  }, [gameState, bgmVolume, isBgmMuted, isCrossActive]);

  const triggerCrossEffect = useCallback((centerBrick: Brick) => {
    setIsCrossActive(true); 
    setCrossAnimId(centerBrick.id);
    if (bgmAudio.current) { bgmAudio.current.volume = 0; }
    triggerSfx('CROSS_START');
    
    setTimeout(() => {
      const sameRow = bricksRef.current.filter(b => b.active && b.row === centerBrick.row && b.id !== centerBrick.id && b.type !== BrickType.GRAY);
      const sameCol = bricksRef.current.filter(b => b.active && b.col === centerBrick.col && b.id !== centerBrick.id && b.type !== BrickType.GRAY);
      const allToDestroy = [...sameRow, ...sameCol].sort((a, b) => {
        const distA = Math.abs(a.row - centerBrick.row) + Math.abs(a.col - centerBrick.col);
        const distB = Math.abs(b.row - centerBrick.row) + Math.abs(b.col - centerBrick.col);
        return distA - distB;
      });
      
      const totalStaggerTime = 400;
      const interval = allToDestroy.length > 0 ? totalStaggerTime / allToDestroy.length : 0;
      
      allToDestroy.forEach((b, idx) => {
        const delay = idx * interval; 
        setTimeout(() => {
          if (b.active) {
            handleBrickBreakRef.current?.(b, undefined, true); 
          }
        }, delay);
      });
      
      setTimeout(() => {
        isCrossFadingRef.current = true;
        const fadeDuration = 800; 
        const steps = 16;
        const stepTime = fadeDuration / steps;
        let currentStep = 0;
        
        const fadeTimer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          if (bgmAudio.current) {
            const liveTarget = isBgmMutedRef.current ? 0 : bgmVolumeRef.current;
            bgmAudio.current.volume = liveTarget * progress;
          }
          if (currentStep >= steps) {
            clearInterval(fadeTimer);
            isCrossFadingRef.current = false;
            setIsCrossActive(false);
            setCrossAnimId(null);
            if (bgmAudio.current) {
                bgmAudio.current.volume = isBgmMutedRef.current ? 0 : bgmVolumeRef.current;
            }
          }
        }, stepTime);
      }, 600); 
    }, 500); 
  }, [triggerSfx]);

  const handleBrickBreak = useCallback((brick: Brick, sourceBall?: Ball, isEffect: boolean = false) => {
    if (!brick.active) return;
    brick.active = false; 
    scoreRef.current += (brick.type === BrickType.BOMB || brick.type === BrickType.CROSS || brick.type === BrickType.RAINBOW) ? 15 : 10;
    setScore(scoreRef.current);
    
    const shouldAnimate = isEffect || brick.type === BrickType.BOMB || brick.type === BrickType.CROSS;
    if (shouldAnimate) {
      const brickId = brick.id;
      setAnimatingBrickIds(prev => {
        const next = new Set(prev);
        next.add(brickId);
        return next;
      });
      setTimeout(() => {
        setAnimatingBrickIds(prev => {
          const next = new Set(prev);
          next.delete(brickId);
          return next;
        });
      }, 300); 
    }

    if (brick.type === BrickType.BOMB) {
      triggerSfx('BOMB_EXPLODE');
      bricksRef.current.forEach(b => {
        if (b.active && b.type !== BrickType.GRAY) {
          if (Math.abs(b.row - brick.row) <= 1 && Math.abs(b.col - brick.col) <= 1) {
            handleBrickBreak(b, undefined, true); 
          }
        }
      });
    } else if (brick.type === BrickType.CROSS) {
      triggerCrossEffect(brick);
    } else if (brick.type === BrickType.RAINBOW) {
      triggerSfx('RAINBOW_HIT');
      if (sourceBall) {
        ballsRef.current.push({ ...sourceBall, dx: -sourceBall.dx, dy: -Math.abs(sourceBall.dy), active: true });
      } else if (ballsRef.current.length > 0) {
        const activeBall = ballsRef.current.find(b => b.active) || ballsRef.current[0];
        ballsRef.current.push({ ...activeBall, dx: -activeBall.dx, dy: -Math.abs(activeBall.dy), active: true });
      }
    } else {
      triggerSfx('BREAK');
    }
  }, [triggerSfx, triggerCrossEffect]);

  useEffect(() => {
    handleBrickBreakRef.current = handleBrickBreak;
  }, [handleBrickBreak]);

  const initBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const fruits = [BrickType.BANANA, BrickType.PINEAPPLE, BrickType.APPLE, BrickType.BLUEBERRY, BrickType.AVOCADO];
    const colWidth = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.BRICK_COLS;
    const brickWidth = colWidth - GAME_CONFIG.BRICK_PADDING;
    const brickHeight = brickWidth; 
    
    // 블록 개수 산출: 레벨 1에서 45개 시작, 매 레벨 5개 증가, 최대 120개
    const targetCount = Math.min(120, 45 + (lvl - 1) * 5);
    
    const midC = (GAME_CONFIG.BRICK_COLS - 1) / 2;
    const midR = (GAME_CONFIG.BRICK_ROWS - 1) / 2;
    const patternId = Math.floor(Math.random() * 20);
    
    const patternPositions: [number, number][] = [];
    const otherPositions: [number, number][] = [];

    for (let r = 0; r < GAME_CONFIG.BRICK_ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.BRICK_COLS; c++) {
        let isPattern = false;
        const dr = r - midR;
        const dc = c - midC;
        const dist = Math.sqrt(dr*dr + dc*dc);

        switch(patternId) {
          case 0: isPattern = true; break; // 전체 채우기
          case 1: isPattern = (r + c) % 2 === 0; break; // 체크무늬
          case 2: isPattern = Math.abs(dc) <= (r < 6 ? r : 5) && r < 9; break; // 피라미드
          case 3: isPattern = Math.abs(dc) <= (r > 3 ? 9 - r : 5) && r > 0; break; // 역피라미드
          case 4: isPattern = Math.abs(dr) + Math.abs(dc) <= 5.5; break; // 다이아몬드
          case 5: // 하트
            const heartCoords = [[0,2],[0,3],[0,8],[0,9],[1,1],[1,2],[1,3],[1,4],[1,7],[1,8],[1,9],[1,10],[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[7,4],[7,5],[7,6],[7,7],[8,5],[8,6]];
            isPattern = heartCoords.some(([hr, hc]) => hr === r && hc === c);
            break;
          case 6: isPattern = Math.abs(Math.abs(dr) - Math.abs(dc)) <= 1.5; break; // X자
          case 7: isPattern = r === 0 || r === 9 || c === 0 || c === 11 || r === 1 || r === 8 || c === 1 || c === 10; break; // 두꺼운 테두리
          case 8: isPattern = r % 2 === 0 || r % 3 === 0; break; // 가로 줄무늬
          case 9: isPattern = c % 2 === 0 || c % 3 === 0; break; // 세로 줄무늬
          case 10: isPattern = Math.abs(dr) <= 1.5 || Math.abs(dc) <= 1.5; break; // 십자가 (+)
          case 11: isPattern = dist >= 2 && dist <= 5.5; break; // 도넛/링
          case 12: isPattern = (r < 4 || r > 5) && (c < 4 || c > 7); break; // 네 모서리
          case 13: isPattern = (r + c) % 2 === 0 || (r - c) % 4 === 0; break; // 복합 격자
          case 14: isPattern = c < 4 || c > 7 || r < 2 || r > 7; break; // 두 기둥
          case 15: isPattern = r > 0 && r < 9 && c > 0 && c < 11; break; // 중앙 상자
          case 16: isPattern = (r === 0 || r === 2 || r === 4 || r === 6 || r === 8 || r === 9); break; // 계단식 줄
          case 17: isPattern = Math.abs(dc) >= Math.abs(dr) - 1 && r < 10; break; // 나비 날개
          case 18: isPattern = Math.abs(dr) >= Math.abs(dc) - 1 && r < 10; break; // 모래시계
          case 19: isPattern = (r + c) % 3 !== 0; break; // 밀집 조각들
          default: isPattern = true;
        }
        if (isPattern) patternPositions.push([r, c]);
        else otherPositions.push([r, c]);
      }
    }

    // 위치 셔플
    const shuffle = (arr: any[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffle(patternPositions);
    shuffle(otherPositions);

    // 최종 위치 선택 (패턴 우선, 부족하면 무작위 보충하여 targetCount 달성)
    let selected: [number, number][] = patternPositions.slice(0, targetCount);
    if (selected.length < targetCount) {
      selected = [...selected, ...otherPositions.slice(0, targetCount - selected.length)];
    }

    const gridTotalWidth = (GAME_CONFIG.BRICK_COLS * colWidth) - GAME_CONFIG.BRICK_PADDING;
    const xOffset = (GAME_CONFIG.CANVAS_WIDTH - gridTotalWidth) / 2;

    selected.forEach(([r, c]) => {
      let type = fruits[Math.floor(Math.random() * fruits.length)];
      bricks.push({
        id: `${r}-${c}`, row: r, col: c,
        x: xOffset + c * colWidth,
        y: r * (brickHeight + GAME_CONFIG.BRICK_PADDING) + GAME_CONFIG.BRICK_OFFSET_TOP,
        width: brickWidth, height: brickHeight,
        type, hits: 1, active: true
      });
    });

    // 벽돌(Gray) 배치 로직 (기존 유지)
    const grayCount = Math.floor((lvl + 1) / 2);
    const mC = Math.floor(GAME_CONFIG.BRICK_COLS / 2);
    let grayPlaced = 0;
    if (grayCount % 2 !== 0) {
      const centerBrick = bricks.find(b => b.col === mC && b.type !== BrickType.GRAY);
      if (centerBrick) { centerBrick.type = BrickType.GRAY; centerBrick.hits = 999; grayPlaced++; }
    }
    const remainingToPlace = grayCount - grayPlaced;
    if (remainingToPlace > 0) {
      const pairsNeeded = remainingToPlace / 2;
      let pairsPlaced = 0;
      for (let r = 0; r < GAME_CONFIG.BRICK_ROWS && pairsPlaced < pairsNeeded; r++) {
        for (let c = 0; c < mC && pairsPlaced < pairsNeeded; c++) {
          const bLeft = bricks.find(b => b.row === r && b.col === c && b.type !== BrickType.GRAY);
          const bRight = bricks.find(b => b.row === r && b.col === (GAME_CONFIG.BRICK_COLS - 1 - c) && b.type !== BrickType.GRAY);
          if (bLeft && bRight) {
            bLeft.type = BrickType.GRAY; bLeft.hits = 999;
            bRight.type = BrickType.GRAY; bRight.hits = 999;
            pairsPlaced++;
          }
        }
      }
    }

    // 특수 블록 생성 로직 (기존 유지)
    const specialTarget = Math.floor(Math.random() * 4) + 1;
    let specialsPlaced = 0;
    const normalBricks = bricks.filter(b => b.type !== BrickType.GRAY);
    if (lvl === 1 && normalBricks.length > 0) {
       const luckyIdx = Math.floor(Math.random() * normalBricks.length);
       const b = normalBricks[luckyIdx];
       b.type = BrickType.CROSS; b.hits = 1; specialsPlaced++;
    }
    for (let i = 0; i < normalBricks.length && specialsPlaced < specialTarget; i++) {
      const randIdx = Math.floor(Math.random() * normalBricks.length);
      const b = normalBricks[randIdx];
      if (b.type === BrickType.BOMB || b.type === BrickType.RAINBOW || b.type === BrickType.CROSS) continue;
      const rand = Math.random();
      if (lvl === 1) {
        if (rand > 0.5) { b.type = BrickType.BOMB; b.hits = 2; } 
        else { b.type = BrickType.RAINBOW; b.hits = 1; }
      } else {
        if (rand > 0.6) { b.type = BrickType.BOMB; b.hits = 2; } 
        else if (rand > 0.3) { b.type = BrickType.RAINBOW; b.hits = 1; } 
        else { b.type = BrickType.CROSS; b.hits = 1; }
      }
      specialsPlaced++;
    }
    return bricks;
  }, []);

  const spawnCrossItem = useCallback(() => {
    const occupied = new Set(bricksRef.current.filter(b => b.active).map(b => `${b.row}-${b.col}`));
    const empties: [number, number][] = [];
    for (let r = 0; r < GAME_CONFIG.BRICK_ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.BRICK_COLS; c++) {
        if (!occupied.has(`${r}-${c}`)) empties.push([r, c]);
      }
    }
    if (empties.length > 0) {
      const [r, c] = empties[Math.floor(Math.random() * empties.length)];
      const colWidth = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.BRICK_COLS;
      const brickWidth = colWidth - GAME_CONFIG.BRICK_PADDING;
      const xOffset = (GAME_CONFIG.CANVAS_WIDTH - (GAME_CONFIG.BRICK_COLS * colWidth - GAME_CONFIG.BRICK_PADDING)) / 2;
      bricksRef.current.push({
        id: `cross-${Date.now()}`, row: r, col: c,
        x: xOffset + c * colWidth,
        y: r * (brickWidth + GAME_CONFIG.BRICK_PADDING) + GAME_CONFIG.BRICK_OFFSET_TOP,
        width: brickWidth, height: brickWidth,
        type: BrickType.CROSS, hits: 1, active: true
      });
      triggerSfx('CROSS_APPEAR');
    }
  }, [triggerSfx]);

  const resetGame = useCallback((keepScore = false, lvlOverride?: number) => {
    const lvl = lvlOverride ?? level;
    if (!keepScore) {
      scoreRef.current = 0; setScore(0); setLevel(1); lastCrossSpawnScore.current = 0;
    } else {
      lastCrossSpawnScore.current = Math.floor(scoreRef.current / 500) * 500;
    }
    const rawSpeed = GAME_CONFIG.INITIAL_BALL_SPEED + (lvl - 1) * GAME_CONFIG.SPEED_INCREMENT;
    speedRef.current = Math.min(rawSpeed, GAME_CONFIG.MAX_BALL_SPEED);
    paddleRef.current = {
      x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH) / 2,
      w: Math.max(GAME_CONFIG.PADDLE_WIDTH / 3, GAME_CONFIG.PADDLE_WIDTH * Math.pow(GAME_CONFIG.PADDLE_SHRINK_FACTOR, lvl - 1))
    };
    ballsRef.current = [{
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: GAME_CONFIG.CANVAS_HEIGHT - (PADDLE_Y_FROM_BOTTOM + 20),
      dx: speedRef.current * 0.5 * (Math.random() > 0.5 ? 1 : -1),
      dy: -speedRef.current,
      radius: GAME_CONFIG.BALL_RADIUS,
      active: true
    }];
    bricksRef.current = initBricks(lvl);
    setIsPaused(false); setIsCrossActive(false); setPauseResumeCountdown(0); setAnimatingBrickIds(new Set());
  }, [initBricks, level]);

  useEffect(() => {
    if (gameState === GameState.COUNTDOWN) {
      setCountdown(3);
      triggerSfx('COUNTDOWN_3_2');
      const timer = setInterval(() => {
        setCountdown(prev => {
          const nV = prev - 1;
          if (nV === 2) triggerSfx('COUNTDOWN_3_2');
          if (nV === 1) triggerSfx('COUNTDOWN_1');
          if (nV <= 0) {
            clearInterval(timer);
            setGameState(GameState.PLAYING);
            return 0;
          }
          return nV;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, setGameState, triggerSfx]);

  useEffect(() => {
    if (gameState === GameState.COUNTDOWN && countdown === 3) {
      const shouldKeepScore = level > 1 && scoreRef.current > 0;
      resetGame(shouldKeepScore);
    }
  }, [gameState, countdown, resetGame, level]);

  useEffect(() => {
    if (level > 1) {
      const currentPointsAboveLast = score - lastCrossSpawnScore.current;
      if (currentPointsAboveLast >= 500) {
        const count = Math.floor(currentPointsAboveLast / 500);
        for (let i = 0; i < count; i++) { spawnCrossItem(); }
        lastCrossSpawnScore.current += count * 500;
      }
    }
  }, [score, level, spawnCrossItem]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (gameState !== GameState.PLAYING && gameState !== GameState.COUNTDOWN)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    let lastTime = 0;
    const draw = (timestamp: number = 0) => {
      const delta = lastTime ? (timestamp - lastTime) / (1000 / 60) : 1;
      lastTime = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bricksRef.current.forEach(brick => {
        if (!brick.active) return;
        if (brick.type === BrickType.BOMB || brick.type === BrickType.RAINBOW || brick.type === BrickType.CROSS || brick.type === BrickType.GRAY) return;
        let img = brickImages.current[brick.type];
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, brick.x, brick.y, brick.width, brick.width);
        } else {
          ctx.save();
          ctx.fillStyle = FRUIT_COLORS[brick.type] || '#fff';
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          ctx.restore();
        }
      });
      ctx.fillStyle = '#333';
      ctx.fillRect(paddleRef.current.x, canvas.height - PADDLE_Y_FROM_BOTTOM, paddleRef.current.w, GAME_CONFIG.PADDLE_HEIGHT);
      ballsRef.current.forEach(ball => {
        if (!ball.active) return;
        if (gameState === GameState.PLAYING && !isPausedRef.current && !isCrossActiveRef.current && pauseResumeCountdownRef.current === 0) {
          ball.x += ball.dx * delta; ball.y += ball.dy * delta;
          if (ball.x + ball.radius > canvas.width) { ball.x = canvas.width - ball.radius; ball.dx = -Math.abs(ball.dx); playRandomHit(); }
          else if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.dx = Math.abs(ball.dx); playRandomHit(); }
          if (ball.y - ball.radius < CEILING_Y) { ball.y = CEILING_Y + ball.radius; ball.dy = Math.abs(ball.dy); playRandomHit(); }
          if (ball.y + ball.radius > canvas.height - PADDLE_Y_FROM_BOTTOM && ball.y - ball.radius < canvas.height - PADDLE_Y_FROM_BOTTOM + GAME_CONFIG.PADDLE_HEIGHT && ball.x > paddleRef.current.x && ball.x < paddleRef.current.x + paddleRef.current.w) {
            ball.y = canvas.height - PADDLE_Y_FROM_BOTTOM - ball.radius;
            const hitPos = (ball.x - (paddleRef.current.x + paddleRef.current.w / 2)) / (paddleRef.current.w / 2);
            ball.dx = hitPos * speedRef.current * 1.5;
            ball.dy = -Math.abs(ball.dy);
            playRandomHit();
          }
          for (let i = 0; i < bricksRef.current.length; i++) {
            const brick = bricksRef.current[i];
            if (!brick.active) continue;
            const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
            const dX = ball.x - closestX; const dY = ball.y - closestY;
            if ((dX * dX) + (dY * dY) < (ball.radius * ball.radius)) {
              const oL = (ball.x + ball.radius) - brick.x; const oR = (brick.x + brick.width) - (ball.x - ball.radius);
              const oT = (ball.y + ball.radius) - brick.y; const oB = (brick.y + brick.height) - (ball.y - ball.radius);
              const minO = Math.min(oL, oR, oT, oB);
              if (minO <= 0) continue;
              if (minO === oL) { ball.x = brick.x - ball.radius; ball.dx = -Math.abs(ball.dx); }
              else if (minO === oR) { ball.x = brick.x + brick.width + ball.radius; ball.dx = Math.abs(ball.dx); }
              else if (minO === oT) { ball.y = brick.y - ball.radius; ball.dy = -Math.abs(ball.dy); }
              else if (minO === oB) { ball.y = brick.y + brick.height + ball.radius; ball.dy = Math.abs(ball.dy); }
              if (brick.type !== BrickType.GRAY) {
                brick.hits--; if (brick.hits <= 0) { handleBrickBreakRef.current?.(brick, ball); }
                else { playRandomHit(); }
              } else playRandomHit();
              break;
            }
          }
          if (ball.y + ball.radius > canvas.height) { ball.active = false; }
        }
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = GAME_CONFIG.BALL_COLOR; ctx.fill(); ctx.closePath();
      });
      if (gameState === GameState.PLAYING && !isPausedRef.current && !isCrossActiveRef.current && pauseResumeCountdownRef.current === 0) {
        if (bricksRef.current.filter(b => b.active && b.type !== BrickType.GRAY).length === 0) {
          triggerSfx('LEVELUP'); setGameState(GameState.LEVEL_CLEAR); return;
        }
        if (ballsRef.current.every(b => !b.active)) {
          triggerSfx('GAMEOVER'); setGameState(GameState.GAME_OVER); return;
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, triggerSfx, playRandomHit, setGameState]);

  const handleInput = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    if (gameState !== GameState.PLAYING || isPaused || isCrossActive || pauseResumeCountdown > 0) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    if ('touches' in e.nativeEvent && (e.nativeEvent as TouchEvent).touches && (e.nativeEvent as TouchEvent).touches[0]) {
      clientX = (e.nativeEvent as TouchEvent).touches[0].clientX;
    } else { clientX = (e as React.MouseEvent).clientX; }
    const canvasX = (clientX - rect.left) * (GAME_CONFIG.CANVAS_WIDTH / rect.width);
    const newX = canvasX - (paddleRef.current.w / 2);
    paddleRef.current.x = Math.max(0, Math.min(GAME_CONFIG.CANVAS_WIDTH - paddleRef.current.w, newX));
  };

  const handleStartGameClick = () => {
    handleInteractionSfx('click'); scoreRef.current = 0; setScore(0); setLevel(1);
    onStart(nicknameInput || 'GUEST');
  };

  const handleNextLevel = () => {
    handleInteractionSfx('click');
    const nextLevel = level + 1;
    setLevel(nextLevel);
    resetGame(true, nextLevel);
    randomizeBGM();
    setGameState(GameState.COUNTDOWN);
  };

  const toggleOptions = () => { handleInteractionSfx('click'); setShowOptions(!showOptions); };
  const toggleHelp = () => { handleInteractionSfx('click'); setShowHelp(!showHelp); };

  const handleSubmitScore = () => {
    handleInteractionSfx('click', 'RANKING_OPEN');
    const currentFinalScore = scoreRef.current;
    localStorage.setItem('last_session_score', currentFinalScore.toString());
    const finalNick = localStorage.getItem('kakao_linked_nickname') || nicknameInput;
    if(finalNick && finalNick !== 'GUEST') supabaseService.submitScore(finalNick, currentFinalScore);
    goToRanking();
  };

  const handlePause = () => { if (gameState === GameState.PLAYING) { handleInteractionSfx('click'); setIsPaused(true); } };

  const handleResume = () => { 
    handleInteractionSfx('click'); setIsPaused(false); setPauseResumeCountdown(3);
    triggerSfx('COUNTDOWN_3_2');
    const interval = window.setInterval(() => {
      setPauseResumeCountdown(prev => {
        const nV = prev - 1;
        if (nV === 2) triggerSfx('COUNTDOWN_3_2');
        if (nV === 1) triggerSfx('COUNTDOWN_1');
        if (nV <= 0) { clearInterval(interval); return 0; }
        return nV;
      });
    }, 1000);
  };

  const handleKakaoLink = () => {
    handleInteractionSfx('click');
    if (!window.Kakao) { alert("카카오 SDK를 불러오지 못했습니다."); return; }
    if (!window.Kakao.isInitialized()) { window.Kakao.init(GAME_CONFIG.KAKAO_JS_KEY); }
    window.Kakao.Auth.authorize({
      redirectUri: window.location.origin + window.location.pathname,
      scope: 'profile_nickname',
    });
  };

  const HelpItem = ({ img, title, main, sub }: { img: string, title: string, main: string, sub?: string }) => (
    <div className="flex items-center gap-[2svh] w-full bg-black/5 p-[1.2svh] rounded-[1.5svh] border border-black/5">
      <div className="w-[5svh] h-[5svh] flex-shrink-0 flex items-center justify-center">
        <img src={img} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} alt={title} />
      </div>
      <div className="flex flex-col text-left">
        <div className="pixel-font font-bold text-[1.8svh] text-black mb-[0.2svh] whitespace-nowrap" style={{ wordSpacing: '-0.2em' }}>{title}</div>
        <div className="pixel-font text-[1.4svh] text-gray-700 leading-tight break-keep" style={{ wordSpacing: '-0.2em' }}>{main}</div>
        {sub && <div className="pixel-font text-[1.2svh] text-red-500 mt-[0.3svh] italic font-bold" style={{ wordSpacing: '-0.2em' }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col" onMouseMove={handleInput} onTouchMove={handleInput}>
      {gameState === GameState.PLAYING && (
        <div className="absolute inset-0 bg-[#5bb5f2]/20 sm:bg-white/5 sm:rounded-2xl sm:border sm:border-white/20 z-0 overflow-hidden">
          <div className="liquid-glass-overlay" />
        </div>
      )}
      
      <div className="flex-grow relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-w-full z-10 flex items-center justify-center">
          <canvas ref={canvasRef} width={GAME_CONFIG.CANVAS_WIDTH} height={GAME_CONFIG.CANVAS_HEIGHT} className="w-full h-full block touch-none relative z-10" />
          
          {bricksRef.current.map(brick => {
            const isFruit = [BrickType.BANANA, BrickType.PINEAPPLE, BrickType.APPLE, BrickType.BLUEBERRY, BrickType.AVOCADO].includes(brick.type);
            const isAnim = animatingBrickIds.has(brick.id);
            const isCent = crossAnimId === brick.id && isCrossActive;
            
            if (!brick.active && !isAnim && !isCent) return null;
            if (isFruit && !isAnim) return null;
            
            let imgSrc = GAME_CONFIG.ASSETS.BRICKS[brick.type as keyof typeof GAME_CONFIG.ASSETS.BRICKS];
            if (brick.type === BrickType.BOMB && brick.hits === 1) imgSrc = GAME_CONFIG.ASSETS.BRICKS.BOMB_ACTIVE;
            if (brick.type === BrickType.CROSS && brick.hits === 1) imgSrc = GAME_CONFIG.ASSETS.BRICKS.CROSS_ACTIVE;
            
            return (
              <div 
                key={brick.id}
                style={{ 
                  position: 'absolute', 
                  left: `${(brick.x / GAME_CONFIG.CANVAS_WIDTH) * 100}%`, 
                  top: `${(brick.y / GAME_CONFIG.CANVAS_HEIGHT) * 100}%`, 
                  width: `${(brick.width / GAME_CONFIG.CANVAS_WIDTH) * 100}%`, 
                  height: `${(brick.height / GAME_CONFIG.CANVAS_HEIGHT) * 100}%`, 
                  pointerEvents: 'none', 
                  zIndex: (isCent || isAnim) ? 25 : 15, 
                  transform: isCent ? 'scale(1.5)' : (isAnim ? 'scale(1.5)' : 'scale(1)'), 
                  transition: isCent ? 'transform 0.4s ease-out' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={imgSrc} 
                  alt="Brick" 
                  className={`w-full h-full block ${isAnim ? 'animate-vanish' : ''} ${isCent ? 'animate-cross-sparkle' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {(gameState === GameState.PLAYING || gameState === GameState.COUNTDOWN || gameState === GameState.LEVEL_CLEAR) && (
        <div className="absolute top-[1.5svh] left-0 right-0 px-[3%] flex justify-between items-center z-[100] pointer-events-none">
          <div className="flex items-center min-w-0 text-white pixel-font pixel-outline leading-none"><span className="text-[1.6svh] text-yellow-300 font-bold whitespace-nowrap leading-none">SCORE: {score.toString().padStart(6, '0')}</span></div>
          <div className="flex items-center min-w-0 gap-[1svh] pointer-events-auto">
            <div className="flex items-center min-w-0 text-white pixel-font pixel-outline leading-none"><span className="text-[1.6svh] font-bold whitespace-nowrap leading-none">STAGE: {level}</span></div>
            <button onClick={handlePause} onMouseEnter={() => handleInteractionSfx('hover')} className={`w-[3.5svh] h-[3.5svh] flex-shrink-0 flex items-center justify-center bg-white/30 hover:bg-white/50 rounded-full border border-white/40 sm:backdrop-blur-md transition-all active:scale-95 shadow-lg ${gameState === GameState.PLAYING && !isPaused && !isCrossActive && pauseResumeCountdown === 0 ? '' : 'invisible'}`}>
              <div className="flex gap-[0.4svh]"><div className="w-[0.5svh] h-[1.4svh] bg-white rounded-full"></div><div className="w-[0.5svh] h-[1.4svh] bg-white rounded-full"></div></div>
            </button>
          </div>
        </div>
      )}
      {(gameState === GameState.COUNTDOWN || pauseResumeCountdown > 0) && (
        <div className="absolute inset-0 flex items-center justify-center z-[110] pointer-events-none">
          <div className="text-[12svh] text-white pixel-font pixel-outline animate-ping">{pauseResumeCountdown > 0 ? pauseResumeCountdown : countdown}</div>
        </div>
      )}
      {gameState === GameState.READY_TO_START && (
        <div className="absolute inset-0 bg-[#ffffff] flex flex-col items-center justify-between py-[0svh] py-[-15svh] text-center z-[200] overflow-hidden">
          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${GAME_CONFIG.ASSETS.BACKGROUND_PC})` }} />
          <div className="liquid-glass-overlay" />
           <div className="relative z-10 flex flex-col items-center justify-between h-full w-full px-[8%]">
             <div className="absolute top-[3svh] left-0 right-0 px-[6%] flex justify-end items-center z-[200] pointer-events-none">
               <button onClick={toggleHelp} onMouseEnter={() => handleInteractionSfx('hover')} className="pointer-events-auto w-[4.5svh] h-[4.5svh] flex items-center justify-center bg-white/30 hover:bg-white/50 rounded-full border border-white/40 sm:backdrop-blur-md transition-all active:scale-95 shadow-lg">
                 <span className="text-white font-bold text-[2.8svh] pixel-font leading-none translate-y-[0.1svh]">?</span>
               </button>
             </div>
             <div className="h-[12svh] w-full flex items-center justify-center mt-[15.5svh]"><img src={GAME_CONFIG.ASSETS.BRAND_LOGO} alt="Brand Logo" className="max-h-full w-auto object-contain drop-shadow-md" /></div>
             <div className="flex-grow flex items-center justify-center w-full max-w-[44svh] pt-[0svh] pb-[5svh] animate-sparkle px-[2svh] overflow-visible">
               {!imgErrors.mainLogo ? ( <img src={GAME_CONFIG.ASSETS.LOGO_GATE} alt="Title" className="max-h-full w-auto object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.75)]" onError={() => handleImgError('mainLogo')} /> ) : ( <h1 className="text-[4svh] font-bold text-yellow-200 pixel-font drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase leading-tight whitespace-nowrap">DELMONT<br/>BRICK BREAKER</h1> )}
             </div>
             <div className="flex flex-col items-center gap-[3svh] w-full mb-[9svh]">
               <button onClick={handleStartGameClick} onMouseEnter={() => { setHoveredButton('START'); handleInteractionSfx('hover'); }} onMouseLeave={() => setHoveredButton(null)} className="text-white text-[3.2svh] font-bold pixel-font flex items-center transition-all active:scale-95 animate-yellow-sparkle whitespace-nowrap">{hoveredButton === 'START' && <span className="mr-[1.5svh]">▶</span>} GAME START</button>
               <button onClick={toggleOptions} onMouseEnter={() => { setHoveredButton('OPTION'); handleInteractionSfx('hover'); }} onMouseLeave={() => setHoveredButton(null)} className="text-white text-[2.6svh] font-bold pixel-font flex items-center transition-all whitespace-nowrap drop-shadow-[0_0px_4px_rgba(0,0,0,1)] uppercase">{hoveredButton === 'OPTION' && <span className="mr-[1.5svh]">▶</span>} OPTION</button>
               <div className="flex flex-col items-center gap-[1svh] w-full mt-[0svh]">
                 <button onClick={handleKakaoLink} onMouseEnter={() => { setHoveredButton('KAKAO'); handleInteractionSfx('hover'); }} onMouseLeave={() => setHoveredButton(null)} className="text-yellow-300 text-[2.6svh] font-bold pixel-font flex items-center transition-all whitespace-nowrap drop-shadow-[0_0px_4px_rgba(0,0,0,1)] uppercase">{hoveredButton === 'KAKAO' && <span className="mr-[1.5svh]">▶</span>} KAKAO LOGIN</button>
                 <div className="text-[1.3svh] text-white/100 pixel-font tracking-tighter leading-none bg-black/20 px-[4%] py-[2%] rounded-full uppercase whitespace-nowrap flex items-center justify-center" style={{ wordSpacing: '-0.2em' }}>랭킹 등록을 위해 로그인해주세요</div>
               </div>
             </div>
           </div>

           {showHelp && (
             <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-md flex items-center justify-center z-[250] p-[5%] animate-fade-in">
                <div className="bg-white/95 p-[6%] rounded-[3svh] w-full max-w-[40svh] shadow-2xl flex flex-col gap-[2svh] text-black border-4 border-yellow-400">
                  <h3 className="pixel-font font-bold text-[2.2svh] mb-[1svh] underline decoration-yellow-400 uppercase text-center whitespace-nowrap">HOW TO PLAY</h3>
                  <div className="flex flex-col gap-[1svh]">
                    <HelpItem 
                      img={GAME_CONFIG.ASSETS.BRICKS.BOMB} 
                      title="폭탄 블럭" 
                      main="주변의 1칸 이내 블록을 모두 터트립니다." 
                      sub="*두번 터치해야 해요!*"
                    />
                    <HelpItem 
                      img={GAME_CONFIG.ASSETS.BRICKS.RAINBOW} 
                      title="별 블럭" 
                      main="공의 갯수가 늘어납니다." 
                      sub="*너무 많잖아!*"
                    />
                    <HelpItem 
                      img={GAME_CONFIG.ASSETS.BRICKS.CROSS} 
                      title="델몬트 블럭" 
                      main="가로, 세로에 있는 블럭을 모두 터트립니다." 
                      sub="*500점 마다 나와요!*"
                    />
                    <HelpItem 
                      img={GAME_CONFIG.ASSETS.BRICKS.GRAY} 
                      title="벽돌 블럭" 
                      main="아무리 때려도 깨지지 않아요!"
                    />
                  </div>
                  <button onClick={toggleHelp} onMouseEnter={() => handleInteractionSfx('hover')} className="mt-[1svh] py-[3%] bg-yellow-400 text-black pixel-font font-bold rounded-[1.5svh] shadow-md border-2 border-black active:translate-y-1 whitespace-nowrap uppercase text-[1.5svh]">OK!</button>
                </div>
             </div>
           )}

           {showOptions && (
             <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-md flex items-center justify-center z-50 p-[5%] animate-fade-in">
                <div className="bg-white/95 p-[8%] rounded-[3svh] w-full max-w-[38svh] shadow-2xl flex flex-col gap-[3svh] text-black border-4 border-yellow-400">
                  <h3 className="pixel-font font-bold text-[2.5svh] mb-[1svh] underline decoration-yellow-400 uppercase text-center whitespace-nowrap">VOLUME</h3>
                  <div className="flex flex-col gap-[1.5svh] text-left">
                    <label className="pixel-font text-[1.5svh] font-bold uppercase whitespace-nowrap">BGM: {Math.round(bgmVolume * 100)}%</label>
                    <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={(e: any) => setBgmVolume(parseFloat(e.target.value))} className="w-full h-[1svh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                  </div>
                  <div className="flex flex-col gap-[1.5svh] text-left">
                    <label className="pixel-font text-[1.5svh] font-bold uppercase whitespace-nowrap">SFX: {Math.round(sfxVolume * 100)}%</label>
                    <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e: any) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-[1svh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                  </div>
                  <button onClick={toggleOptions} onMouseEnter={() => handleInteractionSfx('hover')} className="mt-[2svh] py-[4%] bg-yellow-400 text-black pixel-font font-bold rounded-[1.5svh] shadow-md border-2 border-black active:translate-y-1 whitespace-nowrap uppercase">CLOSE</button>
                </div>
             </div>
           )}
        </div>
      )}
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 sm:backdrop-blur-xl flex items-center justify-center z-[120] p-[5%] animate-fade-in">
          <div className="bg-white/95 p-[8%] rounded-[3svh] w-full max-w-[38svh] shadow-2xl flex flex-col gap-[2.5svh] text-black border-4 border-yellow-400">
            <h3 className="pixel-font font-bold text-[3svh] mb-[1svh] underline decoration-yellow-400 uppercase text-center tracking-tighter whitespace-nowrap">PAUSED</h3>
            <div className="flex flex-col gap-[2svh] w-full">
              <div className="flex flex-col gap-[1svh] text-left">
                <label className="pixel-font text-[1.3svh] font-bold uppercase whitespace-nowrap">BGM: {Math.round(bgmVolume * 100)}%</label>
                <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={(e: any) => setBgmVolume(parseFloat(e.target.value))} className="w-full h-[0.8svh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
              </div>
              <div className="flex flex-col gap-[1svh] text-left">
                <label className="pixel-font text-[1.3svh] font-bold uppercase whitespace-nowrap">SFX: {Math.round(sfxVolume * 100)}%</label>
                <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e: any) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-[0.8svh] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
              </div>
            </div>
            <div className="flex flex-col gap-[1.5svh] mt-[1svh]">
              <button onClick={handleResume} onMouseEnter={() => handleInteractionSfx('hover')} className="py-[4%] bg-yellow-400 text-black font-bold rounded-[1.5svh] shadow-md border-2 border-black active:translate-y-1 transition-all whitespace-nowrap uppercase">REPLAY</button>
              <button onClick={() => { handleInteractionSfx('click'); setGameState(GameState.READY_TO_START); setIsPaused(false); randomizeBGM(); }} onMouseEnter={() => handleInteractionSfx('hover')} className="py-[3%] text-gray-500 pixel-font text-[1.2svh] hover:text-black transition-all underline underline-offset-4 uppercase text-center whitespace-nowrap tracking-tighter">QUIT GAME</button>
            </div>
          </div>
        </div>
      )}
      {gameState === GameState.LEVEL_CLEAR && (
        <div className="absolute inset-0 bg-black/50 sm:backdrop-blur-3xl flex flex-col items-center justify-center text-center p-[8%] z-50 animate-fade-in border-none overflow-visible">
           <div className="text-yellow-400 pixel-font text-[3.5svh] mb-[3svh] font-bold pixel-outline uppercase italic tracking-tighter whitespace-nowrap">Level Clear!</div>
           <div className="text-white pixel-font text-[2.5svh] mb-[6svh] font-bold pixel-outline uppercase whitespace-nowrap">Total Score<br/><span className="text-[6svh] text-yellow-400 mt-[1svh] block">{score}</span></div>
           <button onClick={handleNextLevel} onMouseEnter={() => handleInteractionSfx('hover')} className="w-full max-w-[40svh] bg-yellow-400 text-black py-[5%] rounded-[2svh] font-bold text-[2.8svh] pixel-font shadow-[0_0.6svh_0_#b8860b] border-2 border-black active:translate-y-1 whitespace-nowrap uppercase">Next Stage</button>
           <Confetti />
        </div>
      )}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/50 sm:backdrop-blur-3xl flex flex-col items-center justify-center text-center p-[8%] z-50 animate-fade-in border-none">
           <div className="text-red-500 pixel-font text-[3.5svh] mb-[3svh] font-bold pixel-outline uppercase tracking-tighter whitespace-nowrap">Game Over</div>
           <div className="text-white pixel-font text-[2.5svh] mb-[10svh] font-bold pixel-outline uppercase whitespace-nowrap">Final Score<br/><span className="text-[8svh] text-yellow-400 mt-[2svh] block">{score}</span></div>
           <div className="space-y-[3svh] w-full max-w-[40svh]">
             <button onClick={handleSubmitScore} onMouseEnter={() => handleInteractionSfx('hover')} className="w-full bg-yellow-400 text-black py-[5%] rounded-[2svh] font-bold text-[2.2svh] pixel-font shadow-[0_0.6svh_0_#b8860b] border-2 border-black uppercase tracking-wide whitespace-nowrap uppercase" style={{ wordSpacing: '-0.2em' }}>랭킹보기</button>
             <button onClick={() => { handleInteractionSfx('click', 'CLICK'); resetGame(); randomizeBGM(); setGameState(GameState.READY_TO_START); }} onMouseEnter={() => handleInteractionSfx('hover')} className="w-full bg-white text-black py-[5%] rounded-[2svh] font-bold text-[2.2svh] pixel-font shadow-[0_0.6svh_0_#ccc] border-2 border-black uppercase tracking-wide whitespace-nowrap uppercase" style={{ wordSpacing: '-0.2em' }}>다시하기</button>
           </div>
           <Confetti />
        </div>
      )}
      <style>{`
        .pixel-outline { text-shadow: -0.08em -0.08em 0 #000, 0.08em -0.08em 0 #000, -0.08em 0.08em 0 #000, 0.08em 0.08em 0 #000, 0.15em 0.15em 0 rgba(0,0,0,0.5); }
        .animate-yellow-sparkle { animation: yellow-sparkle-anim 1.5s infinite ease-in-out; }
        @keyframes yellow-sparkle-anim { 0%, 100% { filter: drop-shadow(0 0 5px #fbbf24); transform: scale(1); } 50% { filter: drop-shadow(0 0 15px #fbbf24) brightness(1.2); transform: scale(1.05); } }
        @keyframes cross-sparkle { 0%, 100% { filter: brightness(1) drop-shadow(0 0 5px gold); } 50% { filter: brightness(1.8) drop-shadow(0 0 20px yellow); } }
        .animate-cross-sparkle { animation: cross-sparkle 0.4s infinite alternate; }
        @keyframes vanish { 0% { opacity: 1; transform: scale(1.0); } 100% { opacity: 0; transform: scale(1.5); } }
        .animate-vanish { animation: vanish 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default GameCanvas;
