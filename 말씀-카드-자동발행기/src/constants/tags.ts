export const MANDATORY_AUTO_TAGS = [
  '#지혜의말씀',
  '#명언',
  '#주일말씀',
  '#정명석목사님',
  '#기독교복음선교회',
  '#월명동자연성전',
  '#잠언',
  '#예수님',
  '#하나님',
] as const;

export const MANDATORY_AUTO_TAGS_STRING = MANDATORY_AUTO_TAGS.join(' ');

/**
 * Strict character limit for X (Twitter) tweet body INCLUDING the 9 mandatory tags
 */
export const MAX_TWEET_CHARS = 270;

/**
 * Checks if all mandatory tags exist in the text.
 */
export function hasAllMandatoryTags(text: string): boolean {
  if (!text) return false;
  return MANDATORY_AUTO_TAGS.every((tag) => text.includes(tag));
}

/**
 * Returns which mandatory tags are missing from the text.
 */
export function getMissingMandatoryTags(text: string): string[] {
  if (!text) return [...MANDATORY_AUTO_TAGS];
  return MANDATORY_AUTO_TAGS.filter((tag) => !text.includes(tag));
}

/**
 * Fits tweet text within maxLimit (default 270) strictly INCLUDING all 9 mandatory tags.
 * Truncates core text gracefully if necessary so that total character count <= maxLimit.
 */
export function fitTweetUnderLimit(text: string, maxLimit: number = MAX_TWEET_CHARS): string {
  let clean = (text || '').trim();

  // Strip existing mandatory tags from content to prevent duplicates and calculate pure message length
  for (const tag of MANDATORY_AUTO_TAGS) {
    clean = clean.replace(new RegExp(tag, 'g'), '').trim();
  }
  // Remove dangling hashes or empty lines at the end of the text
  clean = clean.replace(/[\n\s]*#+\s*$/g, '').trim();

  // The tag suffix: "\n\n" (2 chars) + MANDATORY_AUTO_TAGS_STRING (48 chars) = 50 chars
  const tagSuffix = `\n\n${MANDATORY_AUTO_TAGS_STRING}`;
  const maxBodyLength = Math.max(20, maxLimit - tagSuffix.length); // 270 - 50 = 220 characters

  if (clean.length > maxBodyLength) {
    // Truncate cleanly with ellipsis so total length stays within maxLimit
    const sliceLen = Math.max(10, maxBodyLength - 3);
    clean = clean.slice(0, sliceLen).trim() + '...';
  }

  const result = `${clean}${tagSuffix}`.trim();
  return result;
}

/**
 * Appends missing mandatory tags to the end of the text and enforces maxLimit <= 270 chars.
 */
export function appendMissingMandatoryTags(text: string, maxLimit: number = MAX_TWEET_CHARS): string {
  return fitTweetUnderLimit(text, maxLimit);
}

/**
 * Cleans any disorganized occurrences of the mandatory tags and re-appends them cleanly at the end,
 * strictly guaranteeing that total length is <= 270 characters.
 */
export function reformatWithMandatoryTags(text: string, maxLimit: number = MAX_TWEET_CHARS): string {
  return fitTweetUnderLimit(text, maxLimit);
}

/**
 * Ensures all mandatory tags are present and the full tweet body is <= 270 characters.
 */
export const ensureMandatoryTags = fitTweetUnderLimit;
