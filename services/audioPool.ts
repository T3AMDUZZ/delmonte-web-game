class AudioPool {
  private pools: Map<string, HTMLAudioElement[]> = new Map();
  private indices: Map<string, number> = new Map();
  private poolSize: number;
  private unlocked = false;

  constructor(poolSize = 4) {
    this.poolSize = poolSize;
    this.setupIOSUnlock();
  }

  private setupIOSUnlock() {
    const unlock = () => {
      if (this.unlocked) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.unlocked = true;
      ['touchstart', 'touchend', 'click'].forEach(e =>
        document.removeEventListener(e, unlock, true)
      );
    };
    ['touchstart', 'touchend', 'click'].forEach(e =>
      document.addEventListener(e, unlock, true)
    );
  }

  preload(key: string, src: string) {
    if (this.pools.has(key)) return;
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      pool.push(audio);
    }
    this.pools.set(key, pool);
    this.indices.set(key, 0);
  }

  play(key: string, volume: number) {
    const pool = this.pools.get(key);
    if (!pool) return;
    const idx = this.indices.get(key) || 0;
    const audio = pool[idx];
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {});
    this.indices.set(key, (idx + 1) % pool.length);
  }

  stopAll() {
    this.pools.forEach(pool => {
      pool.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
  }
}

export const sfxPool = new AudioPool(4);
