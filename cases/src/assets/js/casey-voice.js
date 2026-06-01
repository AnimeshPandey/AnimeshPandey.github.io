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

function canUseVoice() {
  if (!('speechSynthesis' in window)) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.CaseyCompanion && window.CaseyCompanion.shouldShowCaseyBehavior) {
    return window.CaseyCompanion.shouldShowCaseyBehavior('voice');
  }
  return true;
}

function initCaseyVoice() {
  if (!canUseVoice()) {
    document.querySelectorAll('.casey-coach__voice').forEach((btn) => {
      btn.hidden = true;
    });
    return;
  }

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

  let speaking = false;

  function getChapterVoice(chapter, tone) {
    if (!caseyData?.voice?.sections) return null;
    const section =
      caseyData.voice.sections.find((s) => s.chapter === chapter) ||
      caseyData.voice.sections[0];
    return section ? section[tone] || section.junior || null : null;
  }

  function setSpeaking(active) {
    speaking = active;
    voiceBtns.forEach((btn) => {
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.setAttribute('aria-label', active ? 'Stop Casey voice' : 'Listen with Casey (text-to-speech)');
      const hidden = btn.querySelector('.visually-hidden');
      if (hidden) hidden.textContent = active ? 'Stop' : 'Listen with Casey';
    });
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    document.dispatchEvent(new CustomEvent('casey-voice-stop'));
  }

  function speak(text, tone) {
    if (!text) return;
    stop();
    const profile = getVoiceProfile(tone);
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = profile.rate ?? 0.95;
    utt.pitch = profile.pitch ?? 1.05;
    utt.onend = () => {
      setSpeaking(false);
      document.dispatchEvent(new CustomEvent('casey-voice-stop'));
    };
    utt.onerror = () => {
      setSpeaking(false);
      document.dispatchEvent(new CustomEvent('casey-voice-stop'));
    };
    setSpeaking(true);
    document.dispatchEvent(new CustomEvent('casey-voice-start'));
    window.speechSynthesis.speak(utt);
  }

  voiceBtns.forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      if (speaking) {
        stop();
        return;
      }
      const tone = getStoredTone();
      const chapter = getVisibleChapter();
      const text = getChapterVoice(chapter, tone);
      speak(text, tone);
    });
  });

  document.addEventListener('casebook-tone-change', () => stop());
  document.addEventListener('casebook-color-change', () => stop());
  document.addEventListener('casey-companion-event', (e) => {
    if (e.detail && e.detail.type === 'casey-intensity-change') stop();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseyVoice);
} else {
  initCaseyVoice();
}
