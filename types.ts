
export enum GameState {
  INSTAGRAM_GATE = 'INSTAGRAM_GATE',
  READY_TO_START = 'READY_TO_START',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  RANKING = 'RANKING',
  ADMIN = 'ADMIN'
}

export enum BrickType {
  // 과일 5종
  BANANA = 'BANANA',
  PINEAPPLE = 'PINEAPPLE',
  APPLE = 'APPLE',
  BLUEBERRY = 'BLUEBERRY',
  AVOCADO = 'AVOCADO',
  // 특수 4종
  BOMB = 'BOMB',
  GRAY = 'GRAY',
  RAINBOW = 'RAINBOW',
  CROSS = 'CROSS'
}

export interface Brick {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  hits: number;
  active: boolean;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  active: boolean;
}

export interface ScoreEntry {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
}
