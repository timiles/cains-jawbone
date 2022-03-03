import { html, render } from 'https://unpkg.com/htm/preact/index.mjs?module'
import { useState, useEffect } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module';

/* Web workers */
const extractWordsWorker = new Worker('src/workers/extractWords.js');
const findMatchingQuotesWorker = new Worker('src/workers/findMatchingQuotes.js');

function configureEvents(worker, onResult, onProgress) {
  worker.onerror = console.error;
  worker.onmessage = ({ data: { event, ...args } }) => {
    switch (event) {
      case 'onProgress': {
        onProgress && onProgress(args.progressPercent);
        break;
      }
      case 'onResult': {
        onResult(args.result);
        break;
      }
      default: {
        throw `Unexpected event: ${event}.`;
      }
    }
  };  
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
  const [progressPercent, setProgressPercent] = useState();

  useEffect(() => {
    setQuotes(null);
  }, [searchWords])

  useEffect(() => {
    if (!quotes) {
      configureEvents(findMatchingQuotesWorker, setQuotes, setProgressPercent);
      findMatchingQuotesWorker.postMessage({ words1: jawboneWords, words2: searchWords });
    }
  }, [quotes]);
  
  if (!quotes) {
    return html`<p><i>Processing... ${progressPercent}%</i></p>`;
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

    configureEvents(extractWordsWorker, setJawboneWords);
    extractWordsWorker.postMessage({ text });
  }

  const handleSubmitSearchText = (text) => {
    configureEvents(extractWordsWorker, setSearchWords);
    extractWordsWorker.postMessage({ text });
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
