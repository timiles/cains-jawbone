const WORD_BREAK_CHARS = ' —\t\r\n'.split('');

function normalizeWord(word) {
  // Replace diacritics; remove non-alpha characters; lowercase
  return word.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();
}

function extractWords(text, progressCallback) {
  let progressPercent = 0;
  progressCallback(progressPercent);

  const lines = text.split('\n');
  const words = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let word = '';
    const line = lines[lineIndex];
    let startCharIndex = -1;
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (WORD_BREAK_CHARS.includes(char)) {
        word = normalizeWord(word);
        if (word) {
          words.push({ word, lineIndex, startCharIndex, endCharIndex: charIndex });
          word = '';
          startCharIndex = -1;
        }
      } else {
        if (startCharIndex === -1) {
          startCharIndex = charIndex;
        }
        word += char;
      }
    }
    word = normalizeWord(word);
    if (word) {
      words.push({ word, lineIndex, startCharIndex, endCharIndex: line.length });
    }

    const currentProgressPercent = Math.floor(100 * (lineIndex + 1) / lines.length);
    if (currentProgressPercent > progressPercent) {
      progressPercent = currentProgressPercent;
      progressCallback(progressPercent);
    }
  }

  return words;
}

// Wire up web worker messages
onmessage = ({ data: { text } }) => {
  const postProgress = (progressPercent) =>
    postMessage({ event: 'onProgress', progressPercent });
  const postResult = (result) =>
    postMessage({ event: 'onResult', result });
  
  const words = extractWords(text, postProgress);
  postResult(words);
};
