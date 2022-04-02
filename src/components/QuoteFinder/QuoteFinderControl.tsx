import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { configureEvents } from "../../utils/workerUtils";

const findMatchingQuotesWorker = new Worker(
  "/assets/workers/findMatchingQuotes.js"
);

interface IQuote {
  startLineIndex: number;
  startCharIndex: number;
  endLineIndex: number;
  endCharIndex: number;
}

interface IProps {
  jawbonePages: string[];
  jawboneWords: string[];
  searchWords: string[];
}

const QuoteFinderControl = (props: IProps) => {
  const { jawbonePages, jawboneWords, searchWords } = props;

  const [quotes, setQuotes] = useState<IQuote[] | null>();
  const [progressPercent, setProgressPercent] = useState<number>();

  useEffect(() => {
    setQuotes(null);
  }, [searchWords]);

  useEffect(() => {
    if (!quotes) {
      configureEvents(findMatchingQuotesWorker, setQuotes, setProgressPercent);
      findMatchingQuotesWorker.postMessage({
        words1: jawboneWords,
        words2: searchWords,
      });
    }
  }, [quotes, jawboneWords, searchWords]);

  if (!quotes) {
    return (
      <p>
        <i>Processing... {progressPercent}%</i>
      </p>
    );
  }

  if (quotes.length === 0) {
    return <p>No quotes found 😞</p>;
  }

  const renderPage = ({ startLineIndex, endLineIndex }: IQuote) =>
    `${startLineIndex + 1}${
      startLineIndex !== endLineIndex ? ` - ${endLineIndex + 1}` : ""
    }`;

  const renderQuote = ({
    startLineIndex,
    startCharIndex,
    endLineIndex,
    endCharIndex,
  }: IQuote) => {
    if (startLineIndex === endLineIndex) {
      return jawbonePages[startLineIndex].substring(
        startCharIndex,
        endCharIndex
      );
    }
    let quote = jawbonePages[startLineIndex].substring(startCharIndex);
    for (
      let lineIndex = startLineIndex + 1;
      lineIndex < endLineIndex;
      lineIndex++
    ) {
      quote += `\n${jawbonePages[lineIndex]}`;
    }
    quote += jawbonePages[endLineIndex].substring(0, endCharIndex);
    return quote;
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>Quote</th>
        </tr>
      </thead>
      <tbody>
        {quotes
          .sort((a, b) => a.startCharIndex - b.startCharIndex)
          .sort((a, b) => a.startLineIndex - b.startLineIndex)
          .map((quote) => (
            <tr key={`${quote.startLineIndex}_${quote.startCharIndex}`}>
              <td>{renderPage(quote)}</td>
              <td>{renderQuote(quote)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default QuoteFinderControl;
