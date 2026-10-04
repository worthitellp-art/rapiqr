/**
 * Audio Notification Service for live chat and emergency alerts.
 * Synthesizes crystal-clear, modern notification chimes using the Web Audio API
 * without relying on external MP3 asset downloads.
 */

class SoundNotificationService {
  private audioCtx: AudioContext | null = null;
  private audioUnlocked = false;
  /** Message ids already announced — the same socket event reaches several listeners. */
  private announcedMessageIds = new Map<string, number>();
  /** Last announcement per chat thread, so a busy thread doesn't ping every message. */
  private lastAnnouncedAt = new Map<string, number>();

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (!this.audioUnlocked) {
          const ctx = this.getAudioContext();
          if (ctx && ctx.state === 'suspended') {
            ctx.resume();
          }
          this.audioUnlocked = true;
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
        }
      };

      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Play a crisp, gentle dual-tone chime when a new message arrives from the visitor/owner.
   */
  playMessageChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary tone: high clear bell note (A5 - 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Harmony chime note (D6 - 1174.66Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.09);
      gain2.gain.setValueAtTime(0.18, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.42);
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e);
    }
  }

  /**
   * Play urgent alert chime for incoming SOS or critical parking alerts.
   */
  playAlertChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 880, 1046.5]; // E5, A5, C6
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch { /* ignore */ }
  }

  /**
   * Chime + desktop notification for an incoming visitor message. Only when the
   * tab is in the background (the owner can already see a message they're
   * looking at), once per message id, and at most once per 30 s per thread.
   * Every listener calls this, so the dedupe is what keeps one message from
   * alerting several times.
   */
  notifyIncomingMessage({ id, threadId, title, body }: { id?: string; threadId?: string; title: string; body: string }): void {
    const now = Date.now();
    if (id) {
      if (this.announcedMessageIds.has(id)) return;
      this.announcedMessageIds.set(id, now);
    }

    // Prune old entries so the maps stay small on a long-lived dashboard.
    if (this.announcedMessageIds.size > 500) {
      for (const [key, time] of this.announcedMessageIds) {
        if (now - time > 5 * 60 * 1000) this.announcedMessageIds.delete(key);
      }
    }

    if (typeof document !== 'undefined' && !document.hidden) return;

    const thread = threadId || 'default';
    if (now - (this.lastAnnouncedAt.get(thread) || 0) < 30 * 1000) return;
    this.lastAnnouncedAt.set(thread, now);

    this.playMessageChime();
    this.showBrowserNotification(title, body);
  }

  /**
   * Request standard desktop browser notification permission.
   */
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Trigger native browser desktop notification if tab is in background.
   */
  showBrowserNotification(title: string, body: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch { /* best effort */ }
    }
  }
}

export const soundNotification = new SoundNotificationService();
