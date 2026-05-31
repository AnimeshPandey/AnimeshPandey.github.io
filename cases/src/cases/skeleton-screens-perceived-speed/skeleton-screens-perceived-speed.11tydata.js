/**
 * skeleton-screens-perceived-speed.11tydata.js
 * Directory data file: loads casey.json and exposes it as `caseyData`
 * so case-layout.njk can inline it as <script type="application/json">.
 */

const path = require('path');
const fs   = require('fs');

module.exports = {
  eleventyComputed: {
    caseyData(data) {
      const jsonPath = path.join(__dirname, 'casey.json');
      try {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (_) {
        return {};
      }
    },
  },
};
