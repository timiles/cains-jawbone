interface IMessage<T> {
  data: {
    event: string;
    progressPercent?: number;
    result?: T;
  };
}

export function configureEvents<T>(
  worker: Worker,
  onResult: (result: T | null) => void,
  onProgress?: (progressPercent: number) => void
) {
  worker.onerror = console.error;
  worker.onmessage = ({
    data: { event, progressPercent, result },
  }: IMessage<T>) => {
    switch (event) {
      case "onProgress": {
        progressPercent !== undefined &&
          onProgress &&
          onProgress(progressPercent);
        break;
      }
      case "onResult": {
        result !== undefined && onResult(result);
        break;
      }
      default: {
        throw `Unexpected event: ${event}.`;
      }
    }
  };
}
