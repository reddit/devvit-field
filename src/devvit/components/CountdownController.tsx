import {
  Devvit,
  useState,
  useInterval,
  type Context,
} from '@devvit/public-api';
import { CountdownView } from './CountdownView.js';
import { clamp } from '../../shared/math.js';

// The CountdownView has a detatched head to separate out the utilities
// not available to us in the preview state. Enabling us to reuse the template
// between the default and preview states.

export function CountdownController(
  _props: unknown,
  context: Context
): JSX.Element {
  const TARGET_EPOCH = 1743512400000;
  const MIN_SECONDS = 0;
  const MAX_SECONDS = 359999; // 99:59:59 (hours:minutes:seconds)
  const DEFAULT_PIXEL_RATIO = 2;

  const pixelRatio = context.dimensions?.scale ?? DEFAULT_PIXEL_RATIO;

  const [secondsLeft, setSecondsLeft] = useState(
    clamp((TARGET_EPOCH - Date.now()) / 1000, MIN_SECONDS, MAX_SECONDS)
  );

  const tick = useInterval(() => {
    setSecondsLeft((prev) => {
      if (prev > MIN_SECONDS) {
        return prev - 1;
      }
      tick.stop();
      return MIN_SECONDS;
    });
  }, 1000);

  if (secondsLeft > MIN_SECONDS) {
    tick.start();
  }

  return <CountdownView secondsLeft={secondsLeft} pixelRatio={pixelRatio} />;
}
