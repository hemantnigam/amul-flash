import { Platform, Vibration, AppState } from 'react-native';
import { LOCAL_ALARM_SOUNDS, LocalSoundItem } from '../constants/alarmSounds';

let expoAudioModule: any = null;
try {
  expoAudioModule = require('expo-audio');
  console.log('🔍 [alarmSoundService] expo-audio loaded successfully. Exports:', Object.keys(expoAudioModule || {}));
  if (expoAudioModule && expoAudioModule.setAudioModeAsync) {
    expoAudioModule
      .setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      })
      .catch((e: any) => {
        console.log('⚠️ [alarmSoundService] setAudioModeAsync error:', e);
      });
  }
} catch (e: any) {
  console.log('❌ [alarmSoundService] expo-audio require failed:', e?.message || e);
  expoAudioModule = null;
}

let activePlayer: any = null;
let previewPlayer: any = null;

class AlarmSoundService {
  private isRinging: boolean = false;
  private isPreviewing: boolean = false;
  private audioCtx: any = null;
  private loopTimer: any = null;

  async startAlarm(soundId?: string) {
    console.log('🔔 [AlarmSoundService.startAlarm] soundId:', soundId);
    if (this.isRinging) {
      await this.stopAlarm();
    }
    this.isRinging = true;

    // Stop any preview that was playing
    await this.stopPreview();

    // 1. Repeating vibration
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 600, 200, 600, 200, 600, 800], true);
      } catch (_e) {}
    }

    // 2. Play local WAV sound from src/music via expo-audio continuously
    const targetSound: LocalSoundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    console.log('🎵 [AlarmSoundService] Target sound:', targetSound.name, targetSound.filename);

    if (expoAudioModule && typeof expoAudioModule.createAudioPlayer === 'function') {
      try {
        if (activePlayer) {
          try {
            activePlayer.pause();
            activePlayer.release();
          } catch (_e) {}
          activePlayer = null;
        }

        const player = expoAudioModule.createAudioPlayer(targetSound.fileSource);
        player.loop = true;
        player.volume = 1.0;

        // Auto-loop guarantee listener
        if (typeof player.addListener === 'function') {
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status?.didJustFinish && this.isRinging) {
              player.seekTo(0).then(() => player.play()).catch(() => {});
            }
          });
        }

        activePlayer = player;
        player.play();
        console.log('✅ [AlarmSoundService] Playing continuously via expo-audio (loop = true)');
        return;
      } catch (err) {
        console.log('⚠️ [expo-audio startAlarm error]:', err);
      }
    }

    // Web fallback
    if (Platform.OS === 'web') {
      this.startChimeLoop();
    }
  }

  getIsPreviewing(): boolean {
    return this.isPreviewing;
  }

  getIsRinging(): boolean {
    return this.isRinging;
  }

  async previewSound(soundId: string) {
    console.log('▶️ [AlarmSoundService.previewSound] soundId:', soundId);
    await this.stopPreview();
    if (this.isRinging) return;
    this.isPreviewing = true;

    // Trigger single non-repeating vibration
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 300, 150, 300], false);
      } catch (_e) {}
    }

    const targetSound: LocalSoundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    console.log('🎵 [previewSound] Target:', targetSound.name, targetSound.filename);

    if (expoAudioModule && typeof expoAudioModule.createAudioPlayer === 'function') {
      try {
        const player = expoAudioModule.createAudioPlayer(targetSound.fileSource);
        player.loop = false;
        player.volume = 1.0;

        // Auto-stop preview when audio finishes
        if (typeof player.addListener === 'function') {
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status?.didJustFinish && this.isPreviewing) {
              this.stopPreview();
            }
          });
        }

        previewPlayer = player;
        player.play();
        console.log('✅ [previewSound] Playing preview via expo-audio');
        return;
      } catch (err) {
        console.log('⚠️ [expo-audio preview error]:', err);
      }
    } else {
      console.log('⚠️ [previewSound] expoAudioModule is not available. createAudioPlayer type:', typeof expoAudioModule?.createAudioPlayer);
    }
  }

  async stopPreview() {
    this.isPreviewing = false;

    if (Platform.OS !== 'web') {
      try {
        Vibration.cancel();
      } catch (_e) {}
    }

    if (previewPlayer) {
      try {
        if (typeof previewPlayer.pause === 'function') {
          previewPlayer.pause();
        }
        if (typeof previewPlayer.release === 'function') {
          previewPlayer.release();
        }
      } catch (_e) {}
      previewPlayer = null;
    }
  }

  async stopAlarm() {
    this.isRinging = false;
    this.isPreviewing = false;

    // 1. Stop active player
    if (activePlayer) {
      try {
        if (typeof activePlayer.pause === 'function') {
          activePlayer.pause();
        }
        if (typeof activePlayer.release === 'function') {
          activePlayer.release();
        }
      } catch (_e) {}
      activePlayer = null;
    }

    // 2. Stop preview
    await this.stopPreview();

    // 3. Cancel vibration
    if (Platform.OS !== 'web') {
      try {
        Vibration.cancel();
      } catch (_e) {}
    }

    // 4. Stop web chimes
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_e) {}
      this.audioCtx = null;
    }
  }

  private startChimeLoop() {
    if (typeof window === 'undefined') return;

    const playBeep = () => {
      if (!this.isRinging) return;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(950, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, now + 0.18);
        gain2.gain.setValueAtTime(0.45, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.35);
      } catch (_e) {}
    };

    playBeep();
    this.loopTimer = setInterval(() => {
      if (this.isRinging) {
        playBeep();
      } else {
        clearInterval(this.loopTimer);
      }
    }, 1200);
  }
}

export const alarmSoundService = new AlarmSoundService();

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (nextState) => {
    if (nextState !== 'active') {
      if (alarmSoundService.getIsPreviewing()) {
        alarmSoundService.stopPreview();
      }
    }
  });
}
