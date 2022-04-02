import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

interface IProps {
  url: string;
  onLoaded: (text: string) => void;
}

const ResourceLoader = (props: IProps) => {
  const { url, onLoaded } = props;

  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch(url).then((response) => {
      if (response.ok) {
        response.text().then((text) => {
          onLoaded(text);
        });
      } else {
        setError("Error loading, please try refreshing.");
      }
    });
  }, [url, onLoaded]);

  return error ? <p class="error">{error}</p> : <p>Loading...</p>;
};

export default ResourceLoader;
