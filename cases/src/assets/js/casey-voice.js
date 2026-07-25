/**
 * casey-voice.js — ES module. Opt-in TTS for current chapter + tier voice profile.
 *
 * Prefers a pre-generated audio file (Piper TTS, rendered at content-authoring
 * time via scripts/content/generate-voice-audio.mjs) over the browser's native
 * speechSynthesis, which the visitor's OS/browser renders inconsistently — a
 * decent neural voice on some platforms, a harsh robotic fallback on others,
 * with no control from this project either way. Falls back to speechSynthesis
 * automatically if the audio file 404s or fails to play, so this degrades
 * gracefully for any case/chapter/tone combination that hasn't been
 * pre-rendered yet.
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
  const continuousBtns = document.querySelectorAll('.casey-coach__voice-all');

  let speaking = false;
  // Ordered chapter ids still queued for "listen to whole case" playback,
  // or null when not in continuous mode. Deliberately NOT touched by the
  // shared stop() below — stop() runs at the top of every speak() call
  // too, including the ones this module makes internally to advance from
  // one queued chapter to the next, so if stop() cleared this the queue
  // would wipe itself after exactly one chapter every time.
  let continuousChapters = null;
  const audioEl = new Audio();
  audioEl.preload = 'none';
  // Bumped on every stop()/speak() so a stale async callback from a
  // superseded attempt (e.g. play()'s promise rejecting with AbortError
  // because stop() paused/cleared src while it was still pending) can
  // recognize it's no longer current and no-op instead of re-flipping
  // playback state after the fact. Continuous playback reuses this same
  // token for its own cancellation: a stale "chapter N finished, advance
  // to N+1" callback checks it exactly like the single-chapter path does,
  // so stop() (from either the per-chapter or continuous-play button)
  // halts the whole sequence, not just the chapter in flight.
  let playToken = 0;

  function getChapterVoice(chapter, tone) {
    if (!caseyData?.voice?.sections) return null;
    const section =
      caseyData.voice.sections.find((s) => s.chapter === chapter) ||
      caseyData.voice.sections[0];
    return section ? section[tone] || section.junior || null : null;
  }

  function audioUrlFor(chapter, tone) {
    if (!caseyData?.slug) return null;
    const pathPrefix = document.documentElement.dataset.pathPrefix || '/cases/';
    return `${pathPrefix}assets/casey/voice/${caseyData.slug}/${chapter}-${tone}.mp3`;
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
    playToken++;
    window.speechSynthesis.cancel();
    // Clear the handlers before touching src: removing src from a
    // playing/loading <audio> element fires an async error event, which
    // would otherwise trigger the speechSynthesis fallback on every
    // intentional stop, immediately re-flipping speaking back to true.
    audioEl.onerror = null;
    audioEl.onended = null;
    audioEl.pause();
    audioEl.removeAttribute('src');
    setSpeaking(false);
    document.dispatchEvent(new CustomEvent('casey-voice-stop'));
  }

  function speakWithSynthesis(text, tone, token, onEnded) {
    const profile = getVoiceProfile(tone);
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = profile.rate ?? 0.95;
    utt.pitch = profile.pitch ?? 1.05;
    utt.onend = () => {
      if (token !== playToken) return;
      setSpeaking(false);
      document.dispatchEvent(new CustomEvent('casey-voice-stop'));
      if (onEnded) onEnded();
    };
    utt.onerror = () => {
      if (token !== playToken) return;
      setSpeaking(false);
      document.dispatchEvent(new CustomEvent('casey-voice-stop'));
    };
    setSpeaking(true);
    document.dispatchEvent(new CustomEvent('casey-voice-start'));
    window.speechSynthesis.speak(utt);
  }

  // onEnded fires only on a genuine natural completion (audio file ended,
  // or speechSynthesis utterance ended) for THIS call's token — never on
  // error or on an interrupting stop()/newer speak() — which is exactly
  // the signal continuous playback needs to safely advance to the next
  // chapter without racing a cancellation.
  function speak(text, tone, chapter, onEnded) {
    if (!text) return;
    stop();
    const callToken = playToken;

    const audioUrl = audioUrlFor(chapter, tone);
    if (!audioUrl) {
      speakWithSynthesis(text, tone, callToken, onEnded);
      return;
    }

    // Pre-generated audio first (consistent quality, not dependent on the
    // visitor's OS/browser TTS engine) — fall back to speechSynthesis for
    // any case/chapter/tone that hasn't been pre-rendered yet, or if the
    // file fails to load/decode for any reason.
    //
    // play() returns a promise that can reject (AbortError) if stop() runs
    // while it's still pending — clearing onerror/onended in stop() doesn't
    // stop that rejection from reaching .catch() below, so both the error
    // handler and the catch capture this call's token and bail out if
    // stop() (or a newer speak()) has since made them stale.
    const thisToken = ++playToken;
    let fellBack = false;
    const onAudioError = () => {
      if (fellBack || thisToken !== playToken) return;
      fellBack = true;
      speakWithSynthesis(text, tone, thisToken, onEnded);
    };
    audioEl.onerror = onAudioError;
    audioEl.onended = () => {
      if (thisToken !== playToken) return;
      setSpeaking(false);
      document.dispatchEvent(new CustomEvent('casey-voice-stop'));
      if (onEnded) onEnded();
    };
    audioEl.src = audioUrl;
    setSpeaking(true);
    document.dispatchEvent(new CustomEvent('casey-voice-start'));
    audioEl.play().catch(onAudioError);
  }

  function setContinuousUi(active) {
    continuousBtns.forEach((btn) => {
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.setAttribute('aria-label', active ? 'Stop listening to whole case' : 'Listen to whole case');
      btn.classList.toggle('casey-coach__voice-all--active', active);
    });
  }

  // Called whenever playback starts from a source OTHER than the
  // continuous queue itself (the per-chapter button, a tone/color change,
  // etc.) so an in-progress "listen to whole case" run doesn't keep
  // running invisibly with its button still showing "active".
  function interruptContinuous() {
    if (continuousChapters === null) return;
    continuousChapters = null;
    setContinuousUi(false);
  }

  function playNextContinuous(tone) {
    if (!continuousChapters || !continuousChapters.length) {
      continuousChapters = null;
      setContinuousUi(false);
      return;
    }
    const chapter = continuousChapters.shift();
    const text = getChapterVoice(chapter, tone);
    if (!text) {
      playNextContinuous(tone);
      return;
    }
    const chapterEl = document.querySelector('.case-chapter[data-chapter="' + chapter + '"]');
    if (chapterEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      chapterEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // speak() calls stop() internally at its own start on every chapter
    // transition — that's expected and fine, it only clears audio/synth
    // state and bumps playToken, never continuousChapters (see the
    // declaration above for why that split matters).
    speak(text, tone, chapter, () => playNextContinuous(tone));
  }

  function voiceChaptersForTone(tone) {
    const sections = (caseyData && caseyData.voice && caseyData.voice.sections) || [];
    const order = Array.from(document.querySelectorAll('.case-chapter[data-chapter]'))
      .map((el) => el.dataset.chapter);
    return order.filter((chapter) => {
      const section = sections.find((s) => s.chapter === chapter);
      return section && (section[tone] || section.junior);
    });
  }

  voiceBtns.forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      // setSpeaking() flips every .casey-coach__voice button's state
      // whenever ANY playback is active, including chapters driven by the
      // continuous queue — so `speaking` alone can't tell this click apart
      // from "stop the sequence I'm mid-way through". Check continuous
      // mode first and treat a click here as "stop everything" for it,
      // same as clicking the continuous button itself would.
      if (continuousChapters !== null) {
        stop();
        interruptContinuous();
        return;
      }
      if (speaking) {
        stop();
        return;
      }
      const tone = getStoredTone();
      const chapter = getVisibleChapter();
      const text = getChapterVoice(chapter, tone);
      speak(text, tone, chapter);
    });
  });

  if (continuousBtns.length) {
    const tone0 = getStoredTone();
    const eligible = voiceChaptersForTone(tone0).length > 1;
    continuousBtns.forEach((btn) => { btn.hidden = !eligible; });
    continuousBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (continuousChapters !== null) {
          stop();
          continuousChapters = null;
          setContinuousUi(false);
          return;
        }
        const tone = getStoredTone();
        const chapters = voiceChaptersForTone(tone);
        if (!chapters.length) return;
        continuousChapters = chapters;
        setContinuousUi(true);
        playNextContinuous(tone);
      });
    });
  }

  document.addEventListener('casebook-tone-change', () => {
    stop();
    interruptContinuous();
    if (continuousBtns.length) {
      const eligible = voiceChaptersForTone(getStoredTone()).length > 1;
      continuousBtns.forEach((btn) => { btn.hidden = !eligible; });
    }
  });
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
