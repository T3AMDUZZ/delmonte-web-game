const AUDIO_CONTEXT = typeof AudioContext !== 'undefined'
  ? new AudioContext()
  : typeof (window as any).webkitAudioContext !== 'undefined'
    ? new (window as any).webkitAudioContext()
    : null;

class AudioPool {
  private buffers: Map<string, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;

  constructor() {
    if (AUDIO_CONTEXT) {
      this.gainNode = AUDIO_CONTEXT.createGain();
      this.gainNode.connect(AUDIO_CONTEXT.destination);
    }
    this.setupIOSUnlock();
  }

  private setupIOSUnlock() {
    const unlock = () => {
      if (AUDIO_CONTEXT && AUDIO_CONTEXT.state === 'suspended') {
        AUDIO_CONTEXT.resume();
      }
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('touchend', unlock, { passive: true });
    document.addEventListener('click', unlock);
  }

  async preload(key: string, src: string) {
    if (this.buffers.has(key) || !AUDIO_CONTEXT) return;
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await AUDIO_CONTEXT.decodeAudioData(arrayBuffer);
      this.buffers.set(key, audioBuffer);
    } catch (e) {
      console.warn(`[AudioPool] Failed to preload ${key}:`, e);
    }
  }

  play(key: string, volume: number) {
    if (!AUDIO_CONTEXT || !this.gainNode) return;
    const buffer = this.buffers.get(key);
    if (!buffer) return;

    // AudioContext가 suspended면 resume 시도
    if (AUDIO_CONTEXT.state === 'suspended') {
      AUDIO_CONTEXT.resume();
    }

    const source = AUDIO_CONTEXT.createBufferSource();
    source.buffer = buffer;

    // 개별 gain node로 볼륨 제어
    const gainNode = AUDIO_CONTEXT.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(AUDIO_CONTEXT.destination);

    source.start(0);
  }
}

export const sfxPool = new AudioPool();
