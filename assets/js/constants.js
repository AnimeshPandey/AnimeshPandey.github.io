/**
 * assets/js/constants.js — Single source of truth for site constants.
 * No DOM side-effects; safe to load in <head> or before DOMContentLoaded.
 * Uses window.AP_CONSTANTS (IIFE, non-module) for no-build-step compat.
 */
(function () {
  'use strict';

  window.AP_CONSTANTS = {

    /* ── Site identity ── */
    SITE: {
      name:   'Animesh Pandey',
      domain: 'https://anmshpndy.com',
      email:  'animeshpandey1909@gmail.com',
    },

    /* ── Resume — single source; use in download links + preview modal ── */
    RESUME: {
      path:     '/resume.pdf',
      filename: 'Animesh_Pandey_Resume.pdf',
    },

    /* ── Themes — must match [data-theme] values and theme.css blocks ── */
    THEMES: ['light', 'dark', 'sage', 'slate', 'dusk', 'high-contrast'],

    THEME_LABELS: {
      light:           'Warm paper',
      dark:            'Charcoal',
      sage:            'Sage mist',
      slate:           'Slate studio',
      dusk:            'Dusk editorial',
      'high-contrast': 'High contrast',
    },

    /* ── i18n — must match LOCALES in i18n.js and available locale JSONs ── */
    LOCALES: ['en', 'hi', 'es', 'fr', 'de', 'pt-BR', 'ja', 'zh-Hans', 'ar'],
    RTL_LOCALES: ['ar'],
    DEFAULT_LOCALE: 'en',

    /* ── Navigation sections ── */
    NAV_SECTIONS: ['about', 'experience', 'skills', 'projects', 'writing', 'contact'],

    /* ── Key CSS breakpoints (mirrors theme.css --bp-* vars) ── */
    BREAKPOINTS: {
      sm:  480,
      md:  640,
      lg:  820,
      xl:  1024,
      xxl: 1280,
    },

    /* ── DOM selectors used by multiple modules ── */
    SELECTORS: {
      header:       'header',
      mobileNav:    '#mobile-nav',
      navOverlay:   '#nav-overlay',
      themeMenu:    '#theme-menu-header',
      langMenu:     '#lang-menu-header',
      resumeModal:  '#resume-preview',
      backTop:      '#back-top',
    },

  };

}());
