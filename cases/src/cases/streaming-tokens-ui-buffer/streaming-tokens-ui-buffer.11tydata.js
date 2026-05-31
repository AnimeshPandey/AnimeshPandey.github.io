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
