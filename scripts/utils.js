const fs = require("fs");
const path = require("path");

const DICT_DIR = path.join(__dirname, "../src/dict");

function countWords() {
  if (!fs.existsSync(DICT_DIR)) {
    return 0;
  }

  let totalWords = 0;
  const files = fs.readdirSync(DICT_DIR);

  files.forEach((file) => {
    if (path.extname(file) === ".json") {
      const filePath = path.join(DICT_DIR, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const json = JSON.parse(content);
        totalWords += Object.keys(json).length;
      } catch (err) {
        // Ignore errors for counting
      }
    }
  });
  return totalWords;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
  countWords,
  formatNumber,
  DICT_DIR,
};
