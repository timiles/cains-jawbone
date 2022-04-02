import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import QuoteFinderControl from "../../components/QuoteFinder/QuoteFinderControl";
import ResourceLoader from "../../components/QuoteFinder/ResourceLoader";
import SearchTextInputControl from "../../components/QuoteFinder/SearchTextInputControl";
import { configureEvents } from "../../utils/workerUtils";

const extractWordsWorker = new Worker("/assets/workers/extractWords.js");

const QuoteFinder = () => {
  const [jawbonePages, setJawbonePages] = useState<string[]>();
  const [jawboneWords, setJawboneWords] = useState<string[] | null>();
  const [searchWords, setSearchWords] = useState<string[] | null>();

  const handleJawboneTextLoaded = (text: string) => {
    setJawbonePages(text.split("\n"));

    configureEvents(extractWordsWorker, setJawboneWords);
    extractWordsWorker.postMessage({ text });
  };

  const handleSubmitSearchText = (text: string) => {
    configureEvents(extractWordsWorker, setSearchWords);
    extractWordsWorker.postMessage({ text });
  };

  if (!jawbonePages) {
    return (
      <ResourceLoader
        url="/assets/cainsjawbone.txt"
        onLoaded={handleJawboneTextLoaded}
      />
    );
  }

  return (
    <Fragment>
      <h1>Cain’s Jawbone Quote Finder</h1>
      <SearchTextInputControl onSubmit={handleSubmitSearchText} />
      {jawboneWords && searchWords && (
        <QuoteFinderControl
          jawbonePages={jawbonePages}
          jawboneWords={jawboneWords}
          searchWords={searchWords}
        />
      )}
    </Fragment>
  );
};

export default QuoteFinder;
