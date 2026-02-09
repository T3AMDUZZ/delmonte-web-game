
import React from 'react';

export const GAME_CONFIG = {
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640,
  PADDLE_WIDTH: 80,
  PADDLE_HEIGHT: 12,
  BALL_RADIUS: 6,
  BALL_COLOR: '#FFD700',
  BRICK_ROWS: 10,
  BRICK_COLS: 12,
  BRICK_HEIGHT: 26,
  BRICK_PADDING: 4,
  BRICK_OFFSET_TOP: 80,
  INITIAL_BALL_SPEED: 4, // 레벨1 시작 속도
  SPEED_INCREMENT: 0.7, // 레벨당 속도 증가폭
  MAX_BALL_SPEED: 8, // 7단계 이후 고정 속도
  SPEED_CAP: 4.5, // 절대 최대값
  PADDLE_SHRINK_MIN: 40,
  PADDLE_SHRINK_FACTOR: 0.9,
  INSTAGRAM_URL: 'https://www.instagram.com/delmontekorea/',
  ADMIN_SECRET: import.meta.env.VITE_ADMIN_SECRET || 'retro99',
  KAKAO_JS_KEY: import.meta.env.VITE_KAKAO_JS_KEY || '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  ASSETS: {
    BACKGROUND_PC: './assets/images/background_pc.png',
    BACKGROUND_MOBILE: './assets/images/background_mobile.png',
    LOGO_TITLE: './assets/images/logo.png',
    LOGO_GATE: './assets/images/title.png',
    LOGO_START: './assets/images/logo.png',
    LOGO_HEARTS: './assets/images/logo.png',
    BRAND_LOGO: './assets/images/logo.png', // 메인 화면 상단 브랜드 로고
    BRICKS: {
      BANANA: './assets/images/bricks/banana.png',
      PINEAPPLE: './assets/images/bricks/pineapple.png',
      APPLE: './assets/images/bricks/apple.png',
      BLUEBERRY: './assets/images/bricks/blueberry.png',
      AVOCADO: './assets/images/bricks/avocado.png',
      BOMB: './assets/images/bricks/bomb.gif',
      BOMB_ACTIVE: './assets/images/bricks/bomb1.gif',
      GRAY: './assets/images/bricks/gray.png',
      RAINBOW: './assets/images/bricks/rainbow.gif',
      CROSS: './assets/images/bricks/cross.gif',
      CROSS_ACTIVE: './assets/images/bricks/cross1.gif'
    },
    AUDIO: {
      BGM1: './assets/sounds/bgm1.wav',
      BGM2: './assets/sounds/bgm2.wav',
      BGM3: './assets/sounds/bgm3.wav',
      BGM4: './assets/sounds/bgm4.wav',
      BGM5: './assets/sounds/bgm5.wav',
      BGM6: './assets/sounds/bgm6.wav',
      HIT1: './assets/sounds/hit1.wav',
      HIT2: './assets/sounds/hit2.wav',
      HIT3: './assets/sounds/hit1.wav',   // TODO: 별도 음향 파일 필요 (현재 HIT1과 동일)
      BREAK: './assets/sounds/hit1.wav',  // TODO: 별도 음향 파일 필요 (현재 HIT1과 동일)
      GAMEOVER: './assets/sounds/gameover.wav',
      LEVELUP: './assets/sounds/levelup.wav',
      CLICK: './assets/sounds/click.wav',
      GAME_START: './assets/sounds/game_start.wav',
      RANKING_OPEN: './assets/sounds/ranking_open.wav',
      BOMB_EXPLODE: './assets/sounds/bomb_explode.wav',
      RAINBOW_HIT: './assets/sounds/rainbow_hit.wav',
      CROSS_APPEAR: './assets/sounds/cross_appear.wav',
      CROSS_START: './assets/sounds/cross_start.wav',
      CROSS_LOOP: './assets/sounds/cross_loop.wav',
      // 카운트다운용 명시적 키
      COUNTDOWN_3_2: './assets/sounds/count.wav',
      COUNTDOWN_1: './assets/sounds/game_start.wav'
    }
  }
};

export const FRUIT_COLORS: Record<string, string> = {
  BANANA: '#FFE135',
  PINEAPPLE: '#FFC300',
  APPLE: '#FF0800',
  BLUEBERRY: '#4F86F7',
  AVOCADO: '#568203',
  BOMB: '#FFFFFF',
  GRAY: '#555555',
  RAINBOW: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)',
  CROSS: '#FFFFFF'
};

export const MAP_PATTERNS = Array.from({ length: 20 }, (_, i) => {
  const pattern: number[][] = [];
  const rows = GAME_CONFIG.BRICK_ROWS;
  const cols = GAME_CONFIG.BRICK_COLS;
  const midC = Math.floor(cols / 2);
  const midR = Math.floor(rows / 2);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let active = false;
      switch (i) {
        case 0: active = true; break;
        case 1: active = (r + c) % 2 === 0; break;
        case 2: active = r < 6; break;
        case 3: active = c === 0 || c === cols - 1 || r === 0 || r === rows - 1; break;
        case 4: active = r === c || r + c === cols - 1; break;
        case 5: active = r % 2 === 0; break;
        case 6: active = c % 2 === 0; break;
        case 7: active = r > 2 && r < rows - 3 && c > 1 && c < cols - 2; break;
        case 8: active = c === midC || r === midR; break;
        case 9: active = r >= c - 1 && r >= (cols - 1 - c) - 1; break;
        case 10: active = r <= c + 3 && r <= (cols - 1 - c) + 3; break;
        case 11: active = (r + c) % 3 === 0 || (r - c) % 3 === 0; break;
        case 12: active = Math.abs(c - midC) <= (r < 4 ? r : 3) && r < 8; break;
        case 13: active = c % 3 !== 0; break;
        case 14: active = r === 0 || r === midR || r === rows - 1 || c === 0 || c === cols - 1; break;
        case 15: active = (r < midR && c < midC) || (r >= midR && c >= midC); break;
        case 16: active = r % 4 === 0 || c % 3 === 0; break;
        case 17: active = Math.pow(r - midR, 2) + Math.pow(c - midC, 2) <= 12; break;
        case 18: active = r < 4 || r > rows - 5; break;
        case 19: active = (r % 2 === 0 && c % 2 !== 0) || (r % 2 !== 0 && c % 2 === 0); break;
        default: active = true;
      }
      if (active) pattern.push([r, c]);
    }
  }
  return pattern;
});
