import { h } from "preact";
import { useState } from "preact/hooks";

interface IProps {
  onSubmit: (text: string) => void;
}

const SearchTextInputControl = (props: IProps) => {
  const { onSubmit } = props;

  const [searchText, setSearchText] = useState("");

  const handleChangeTextArea = (
    e: h.JSX.TargetedEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.currentTarget;
    setSearchText(value);
  };

  const handleChangeFile = (e: h.JSX.TargetedEvent<HTMLInputElement>) => {
    const { files } = e.currentTarget;
    if (files) {
      const file = files[0];
      if (file) {
        file.text().then(setSearchText);
      }
    }
  };

  const handleSubmit = (e: h.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(searchText);
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <label>
          Enter text to search for matching quotes:
          <textarea
            placeholder="Search text"
            class="mb-0"
            value={searchText}
            onBlur={handleChangeTextArea}
          />
        </label>
        <label class="label-inline">
          or import from a text file:
          <input type="file" class="ml-1" onInput={handleChangeFile} />
        </label>
        <div>
          <input class="button-primary" type="submit" value="Process" />
        </div>
      </fieldset>
      <p>
        <small>
          All processing happens in your browser, nothing is uploaded to the
          internet.
        </small>
      </p>
    </form>
  );
};

export default SearchTextInputControl;
