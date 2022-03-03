const MINIMUM_QUOTE_LENGTH = 5;

function findMatchingQuotes(words1, words2, progressCallback) {
  let progressPercent = 0;
  progressCallback(progressPercent);

  const quotes = [];
  for (let index1 = 0; index1 < words1.length; index1++) {
    let quoteLength = 0;
    for (let index2 = 0; index2 < words2.length; index2++) {
      if ((index1 + quoteLength) >= words1.length ||
        index2 === words2.length - 1 ||
        words1[index1 + quoteLength].word !== words2[index2].word) {
        // Reached the end of a matching quote
        if (quoteLength >= MINIMUM_QUOTE_LENGTH) {
          const quoteEndIndex = index1 + quoteLength - 1;
          const longerQuoteAlreadyFound = quotes.some(({ startLineIndex, startCharIndex, endLineIndex, endCharIndex }) =>
            startLineIndex === words1[index1].lineIndex && startCharIndex <= words1[index1].startCharIndex &&
            endLineIndex === words1[quoteEndIndex].lineIndex && endCharIndex >= words1[quoteEndIndex].endCharIndex);
          if (!longerQuoteAlreadyFound) {
            quotes.push({
              startLineIndex: words1[index1].lineIndex,
              startCharIndex: words1[index1].startCharIndex,
              endLineIndex: words1[quoteEndIndex].lineIndex,
              endCharIndex: words1[quoteEndIndex].endCharIndex,
            });
          }
        }
        quoteLength = 0;
      } else {
        quoteLength++;
      }
    }

    const currentProgressPercent = Math.floor(100 * (index1 + 1) / words1.length);
    if (currentProgressPercent > progressPercent) {
      progressPercent = currentProgressPercent;
      progressCallback(progressPercent);
    }
  }

  return quotes;
}

// Wire up web worker messages
onmessage = ({ data: { words1, words2 } }) => {
  const postProgress = (progressPercent) =>
    postMessage({ event: 'onProgress', progressPercent });
  const postResult = (result) =>
    postMessage({ event: 'onResult', result });
  
  const quotes = findMatchingQuotes(words1, words2, postProgress);
  postResult(quotes);
};
