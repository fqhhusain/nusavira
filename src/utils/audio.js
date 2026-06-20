// src/utils/audio.js

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let bgmOscillators = [];
let bgmInterval = null;
let isMuted = true; // Default muted until user interacts
let currentTrack = 1;

export const initAudio = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
};

export const setMute = (muted) => {
    isMuted = muted;
    if (muted) {
        stopBGM();
    } else {
        initAudio();
        playBGM(currentTrack);
    }
};

export const toggleMute = () => {
    setMute(!isMuted);
    return isMuted;
};

export const getMuteStatus = () => isMuted;

// ================= SFX Generator =================
const playTone = (freq, type, duration, vol=0.1) => {
    if (isMuted) return;
    initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

export const playClick = () => playTone(800, 'sine', 0.1, 0.05);

export const playHit = () => {
   if(isMuted) return;
   initAudio();
   // 8-bit white noise explosion
   const bufferSize = ctx.sampleRate * 0.2; 
   const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
   const data = buffer.getChannelData(0);
   for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
   }
   const noise = ctx.createBufferSource();
   noise.buffer = buffer;
   const gain = ctx.createGain();
   gain.gain.setValueAtTime(0.2, ctx.currentTime);
   gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
   noise.connect(gain);
   gain.connect(ctx.destination);
   noise.start();
};

export const playEpic = () => {
    playTone(440, 'square', 0.3, 0.1);
    setTimeout(() => playTone(554, 'square', 0.3, 0.1), 150);
    setTimeout(() => playTone(659, 'square', 0.5, 0.1), 300);
};

export const playLegendary = () => {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 'sawtooth', 0.4, 0.1), i * 100);
    });
    setTimeout(() => playTone(1046.50, 'sawtooth', 1.0, 0.2), 400);
};

// ================= BGM Sequencer =================
// 3 Different Tracks using Arrays of Frequencies & Durations
export const tracks = {
    1: {
        name: "Lobby (Mysterious Vault)",
        type: 'triangle',
        seq: [
            { f: 220, d: 0.4 }, { f: 261, d: 0.4 }, { f: 329, d: 0.4 }, { f: 261, d: 0.4 },
            { f: 220, d: 0.4 }, { f: 261, d: 0.4 }, { f: 329, d: 0.4 }, { f: 392, d: 0.4 }
        ]
    },
    2: {
        name: "Battle (Tension)",
        type: 'sawtooth',
        seq: [
            { f: 110, d: 0.2 }, { f: 110, d: 0.2 }, { f: 130, d: 0.2 }, { f: 110, d: 0.2 },
            { f: 164, d: 0.2 }, { f: 110, d: 0.2 }, { f: 130, d: 0.2 }, { f: 146, d: 0.2 }
        ]
    },
    3: {
        name: "Victory (Level Up)",
        type: 'square',
        seq: [
            { f: 392, d: 0.3 }, { f: 392, d: 0.3 }, { f: 392, d: 0.3 }, { f: 523, d: 0.6 },
            { f: 392, d: 0.3 }, { f: 440, d: 0.3 }, { f: 493, d: 0.3 }, { f: 523, d: 0.8 }
        ]
    }
};

export const stopBGM = () => {
    bgmOscillators.forEach(osc => { try { osc.stop(); } catch(e){} });
    bgmOscillators = [];
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
};

export const playBGM = (trackId) => {
    stopBGM();
    currentTrack = trackId;
    if (isMuted) return;
    initAudio();
    
    const track = tracks[trackId] || tracks[1];
    let step = 0;
    
    const playStep = () => {
        if(isMuted) { stopBGM(); return; }
        const note = track.seq[step];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = track.type;
        osc.frequency.value = note.f;
        
        // Softer volume for BGM compared to SFX
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.d);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + note.d);
        
        bgmOscillators.push(osc);
        
        // Clean up memory
        setTimeout(() => {
            bgmOscillators = bgmOscillators.filter(o => o !== osc);
        }, note.d * 1000);
        
        step = (step + 1) % track.seq.length;
    };
    
    // Interval based on the duration of notes
    const ms = track.seq[0].d * 1000;
    playStep();
    bgmInterval = setInterval(playStep, ms);
};
