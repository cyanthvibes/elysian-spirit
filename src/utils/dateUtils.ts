import * as chrono from "chrono-node";
import {
  DEFAULT_TRANSACTION_DAYS,
  MAX_TRANSACTION_DAYS,
} from "constants/clanPoints.js";
import { DateTime } from "luxon";

export interface DateRangeResult {
  dateCapped: boolean;
  from: DateTime;
  to: DateTime;
}

// Helper function that resolves a date range from strings using chrono-node
export function resolveDateRange(
  fromString: string | undefined,
  toString: string | undefined,
): DateRangeResult {
  // Get time for "now"
  const now: DateTime = DateTime.utc();

  // By default, the range of dates isn't capped to MAX_TRANSACTION_DAYS
  let dateCapped = false;

  // Use chrono-node to parse a date from a string
  const fromParsed: Date | null = fromString
    ? chrono.parseDate(fromString)
    : null;
  const toParsed: Date | null = toString ? chrono.parseDate(toString) : null;

  let from: DateTime;
  let to: DateTime;

  // If both "from" and "to" is provided, set DateTimes from chrono-node parsed dates
  if (fromParsed && toParsed) {
    from = DateTime.fromJSDate(fromParsed).toUTC();
    to = DateTime.fromJSDate(toParsed).toUTC();

    // If only "from" is provided, use DEFAULT_TRANSACTION_DAYS
  } else if (fromParsed) {
    from = DateTime.fromJSDate(fromParsed).toUTC();
    to = from.plus({ days: DEFAULT_TRANSACTION_DAYS });

    // If only "to" is provided, use DEFAULT_TRANSACTION_DAYS
  } else if (toParsed) {
    to = DateTime.fromJSDate(toParsed).toUTC();
    from = to.minus({ days: DEFAULT_TRANSACTION_DAYS });

    // If neither is provided, only use DEFAULT_TRANSACTION_DAYS
  } else {
    to = now;
    from = now.minus({ days: DEFAULT_TRANSACTION_DAYS });
  }

  // Ensure "from" DateTime is always before "to" DateTime
  if (from > to) {
    [from, to] = [to, from];
  }

  // Determine if the range of dates should be capped at MAX_TRANSACTION_DAYS
  if (to.diff(from, "days").days > MAX_TRANSACTION_DAYS) {
    from = to.minus({ days: MAX_TRANSACTION_DAYS });
    dateCapped = true;
  }

  return {
    dateCapped,
    from,
    to,
  };
}
