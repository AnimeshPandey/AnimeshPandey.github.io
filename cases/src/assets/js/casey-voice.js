/**
 * casey-voice.js — ES module (type="module" in layout)
 * Opt-in text-to-speech via speechSynthesis. Never auto-plays.
 * Cancels on casebook-tone-change and casebook-color-change.
 */

const TONE_KEY = 'casebook-tone';

function initCaseyVoice() {
  if (!('speechSynthesis' in window)) return;

  const dataEl = document.getElementById('casey-data');
  if (!dataEl) return;

  let caseyData;
  try { caseyData = JSON.parse(dataEl.textContent); } catch (e) { return; }

  const voiceBtns = document.querySelectorAll('.casey-coach__voice');
  if (!voiceBtns.length) return;

  function getStoredTone() {
    try { return localStorage.getItem(TONE_KEY) || 'junior'; } catch (e) { return 'junior'; }
  }

  function getCurrentChapterVoice(chapter, tone) {
    if (!caseyData || !caseyData.voice || !caseyData.voice.sections) return null;
    const section = caseyData.voice.sections.find(s => s.chapter === chapter);
    return section ? (section[tone] || section.junior || null) : null;
  }

  function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  }

  voiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tone = getStoredTone();
      // Find first chapter with voice content
      const sections = caseyData.voice && caseyData.voice.sections;
      if (!sections || !sections.length) return;
      const text = sections[0][tone] || sections[0].junior || '';
      speak(text);
    });
  });

  // Cancel on tone or color change
  document.addEventListener('casebook-tone-change', () => window.speechSynthesis.cancel());
  document.addEventListener('casebook-color-change', () => window.speechSynthesis.cancel());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseyVoice);
} else {
  initCaseyVoice();
}
