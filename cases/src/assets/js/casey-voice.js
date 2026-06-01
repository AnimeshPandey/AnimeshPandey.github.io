/**
 * casey-voice.js — ES module. Opt-in TTS for current chapter + tier voice profile.
 */
const TONE_KEY = 'casebook-tone';

function getStoredTone() {
  try {
    const t = localStorage.getItem(TONE_KEY);
    if (['junior', 'mid', 'staff'].includes(t)) return t;
  } catch (e) { /* ignore */ }
  return 'junior';
}

function getVisibleChapter() {
  const chapters = document.querySelectorAll('.case-chapter[data-chapter]');
  let best = null;
  chapters.forEach((ch) => {
    const rect = ch.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const ratio = visible / Math.min(rect.height, vh);
    if (ratio >= 0.25 && (!best || ratio > best.ratio)) {
      best = { id: ch.dataset.chapter, ratio };
    }
  });
  return best ? best.id : 'hook';
}

function getVoiceProfile(tone) {
  if (window.CaseyCompanion && window.CaseyCompanion.getInteractions) {
    const cfg = window.CaseyCompanion.getInteractions();
    if (cfg && cfg.voiceProfiles && cfg.voiceProfiles[tone]) {
      return cfg.voiceProfiles[tone];
    }
  }
  return { rate: 0.95, pitch: 1.05 };
}

function initCaseyVoice() {
  if (!('speechSynthesis' in window)) return;

  const dataEl = document.getElementById('casey-data');
  if (!dataEl) return;

  let caseyData;
  try {
    caseyData = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  const voiceBtns = document.querySelectorAll('.casey-coach__voice');
  if (!voiceBtns.length) return;

  function getChapterVoice(chapter, tone) {
    if (!caseyData?.voice?.sections) return null;
    const section =
      caseyData.voice.sections.find((s) => s.chapter === chapter) ||
      caseyData.voice.sections[0];
    return section ? section[tone] || section.junior || null : null;
  }

  function speak(text, tone) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const profile = getVoiceProfile(tone);
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = profile.rate ?? 0.95;
    utt.pitch = profile.pitch ?? 1.05;
    window.speechSynthesis.speak(utt);
  }

  voiceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tone = getStoredTone();
      const chapter = getVisibleChapter();
      const text = getChapterVoice(chapter, tone);
      speak(text, tone);
    });
  });

  document.addEventListener('casebook-tone-change', () => window.speechSynthesis.cancel());
  document.addEventListener('casebook-color-change', () => window.speechSynthesis.cancel());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseyVoice);
} else {
  initCaseyVoice();
}
