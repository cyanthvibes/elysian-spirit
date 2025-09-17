// Helper function to add decimal points to numbers
import { EMOJIS } from "constants/emojis.js";

export function formatNumber(num: null | number | undefined): string {
  if (num == null) {
    return "N/A";
  }

  return num.toLocaleString("en-UK");
}

// Helper function for medal emojis
export function getMedalEmoji(place: number): string {
  if (place === 1) {
    return EMOJIS.FIRST_PLACE;
  }

  if (place === 2) {
    return EMOJIS.SECOND_PLACE;
  }

  if (place === 3) {
    return EMOJIS.THIRD_PLACE;
  }

  return "";
}

// Helper function for ordinal suffixes
export function ordinalSuffix(number: number): string {
  if (number % 10 === 1 && number % 100 != 11) {
    return `${number}st`;
  }

  if (number % 10 === 2 && number % 100 != 12) {
    return `${number}nd`;
  }

  if (number % 10 === 3 && number % 100 != 13) {
    return `${number}rd`;
  }

  return `${number}th`;
}

// Helper function to create singular or plural text based on count
export function pluralise(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
