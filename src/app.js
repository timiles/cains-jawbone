import { html, render } from 'https://unpkg.com/htm/preact/index.mjs?module'
import { useState, useEffect } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module';

const MINIMUM_QUOTE_LENGTH = 5;
const WORD_BREAK_CHARS = ' —\t\r\n'.split('');

/* Utils */
function normalizeWord(word) {
  // Replace diacritics; remove non-alpha characters; lowercase
  return word.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();
}

function extractWords(text) {
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
  }
  return words;
}

function findMatchingQuotes(words1, words2) {
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
  }
  return quotes;
}

/* React components */
function ResourceLoader({ url, onLoaded }) {
  const [error, setError] = useState();

  useEffect(() => {
    fetch(url).then((response) => {
      if (response.ok) {
        response.text().then((text) => {
          onLoaded(text);
        });
      } else {
        setError('Error loading, please try refreshing.');
      }
    });
  }, []);

  return error ? html`<p class="error">${error}</p>` : html`<p>Loading...</p>`;
}

function SearchTextInputControl({ onSubmit }) {
  const [searchText, setSearchText] = useState();

  const handleChangeTextArea = (e) => {
    const { value } = e.currentTarget;
    setSearchText(value);
  };

  const handleChangeFile = (e) => {
    const [file] = e.currentTarget.files;
    if (file) {
      file.text().then(setSearchText);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(searchText);
  };

  return html`
    <form onSubmit=${handleSubmit}>
      <fieldset>
        <label>
          Enter text to search for matching quotes:
          <textarea
            placeholder="Search text"
            class="mb-0"
            value=${searchText}
            onBlur=${handleChangeTextArea}
          />
        </label>
        <label class="label-inline">
          or import from a text file:
          <input
            type="file"
            class="ml-1"
            onInput=${handleChangeFile}
          />
        </label>
        <div>
          <input class="button-primary" type="submit" value="Process" />
        </div>
      </fieldset>
      <p><small>All processing happens in your browser, nothing is uploaded to the internet.</small></p>
    </form>
  `;  
}

function QuoteFinder({ jawboneText, jawboneWords, searchWords }) {
  const [quotes, setQuotes] = useState();

  useEffect(() => {
    setQuotes(null);
  }, [searchWords])

  useEffect(() => {
    if (!quotes) {
      setQuotes(findMatchingQuotes(jawboneWords, searchWords));
    }
  }, [quotes]);
  
  if (!quotes) {
    return html`<p><i>Processing...</i></p>`;
  }

  if (quotes.length === 0) {
    return html`<p>No quotes found 😞</p>`;
  }

  const renderPage = ({ startLineIndex, endLineIndex }) =>
    `${(startLineIndex + 1)}${startLineIndex !== endLineIndex ? ` - ${(endLineIndex + 1)}` : ''}`;

  const renderQuote = ({ startLineIndex, startCharIndex, endLineIndex, endCharIndex }) => {
    if (startLineIndex === endLineIndex) {
      return jawboneText[startLineIndex].substring(startCharIndex, endCharIndex);
    }
    let quote = jawboneText[startLineIndex].substring(startCharIndex);
    for (let lineIndex = startLineIndex + 1; lineIndex < endLineIndex; lineIndex++) {
      quote += '\n' + jawboneText[lineIndex];
    }
    quote += jawboneText[endLineIndex].substring(0, endCharIndex);
    return quote;
  }
  
  return html`
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>Quote</th>
        </tr>
      </thead>
      <tbody>
      ${quotes
        .sort((a, b) => a.startCharIndex - b.startCharIndex)
        .sort((a, b) => a.startLineIndex - b.startLineIndex)
        .map((quote) => html`
          <tr key=${`${quote.startLineIndex}_${quote.startCharIndex}`}>
            <td>${renderPage(quote)}</td>
            <td>${renderQuote(quote)}</td>
          </tr>
        `)}
        </tbody>
      </table>
    `;
}

function QuoteFinderContainer() {
  const [jawbonePages, setJawbonePages] = useState();
  const [jawboneWords, setJawboneWords] = useState();
  const [searchWords, setSearchWords] = useState();

  const handleJawboneTextLoaded = (text) => {
    setJawbonePages(text.split('\n'));
    setJawboneWords(extractWords(text));
  }

  const handleSubmitSearchText = (text) => {
    setSearchWords(extractWords(text));
  }

  if (!jawbonePages) {
    return html`
      <${ResourceLoader}
        url="src/cainsjawbone.txt"
        onLoaded=${handleJawboneTextLoaded}
      />
    `;
  }

  return html`
    <h1>Cain’s Jawbone Quote Finder</h1>
    <${SearchTextInputControl}
      onSubmit=${handleSubmitSearchText}
    />
    ${searchWords && html`
      <${QuoteFinder}
        jawboneText=${jawbonePages}
        jawboneWords=${jawboneWords}
        searchWords=${searchWords}
      />
    `}
  `;
}

function App() {
  return html`
    <div class="container">
      <${QuoteFinderContainer} />
    </div>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
