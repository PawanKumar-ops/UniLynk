const POLL_HEADER_PATTERN = /^Poll:\s*$/i;
const POLL_OPTION_PATTERN = /^\s*\d+[.)]\s+(.+)\s*$/;
const POLL_DURATION_PATTERN = /^Duration:\s*(\d+)\s*day/i;

export const clampPollDurationDays = (durationDays) => {
  const requestedPollDays = Number(durationDays);

  if (!Number.isFinite(requestedPollDays)) return 1;
  return Math.min(Math.max(Math.floor(requestedPollDays), 1), 7);
};

export const normalizePollOptions = (options) => {
  if (!Array.isArray(options)) return [];

  const seen = new Set();

  return options
    .map((option) => (typeof option === "string" ? option : option?.text))
    .filter((option) => typeof option === "string" && option.trim())
    .map((option) => option.trim())
    .filter((option) => {
      const key = option.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
};

export const buildPollDocument = ({ options, durationDays, now = Date.now() }) => {
  const normalizedOptions = normalizePollOptions(options);
  if (normalizedOptions.length < 2) return undefined;

  const safePollDays = clampPollDurationDays(durationDays);

  return {
    options: normalizedOptions.map((text, index) => ({
      id: `option-${index + 1}`,
      text,
      votes: 0,
    })),
    totalVotes: 0,
    endsAt: new Date(now + safePollDays * 24 * 60 * 60 * 1000),
    votes: [],
  };
};

export const parseLegacyPollContent = (content, createdAt = Date.now()) => {
  if (typeof content !== "string" || !content.trim()) return null;

  const lines = content.split(/\r?\n/);
  const pollHeaderIndex = lines.findIndex((line) => POLL_HEADER_PATTERN.test(line.trim()));
  if (pollHeaderIndex === -1) return null;

  const optionLines = [];
  let durationDays = 1;
  let endIndex = pollHeaderIndex;

  for (let index = pollHeaderIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const optionMatch = line.match(POLL_OPTION_PATTERN);
    const durationMatch = line.match(POLL_DURATION_PATTERN);

    if (optionMatch) {
      optionLines.push(optionMatch[1]);
      endIndex = index;
      continue;
    }

    if (durationMatch) {
      durationDays = clampPollDurationDays(durationMatch[1]);
      endIndex = index;
      break;
    }

    if (line) break;
  }

  const normalizedOptions = normalizePollOptions(optionLines);
  if (normalizedOptions.length < 2) return null;

  const contentWithoutPoll = [
    ...lines.slice(0, pollHeaderIndex),
    ...lines.slice(endIndex + 1),
  ].join("\n").trim();

  const createdAtMs = new Date(createdAt || Date.now()).getTime();
  const safeCreatedAtMs = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();

  return {
    content: contentWithoutPoll,
    poll: buildPollDocument({
      options: normalizedOptions,
      durationDays,
      now: safeCreatedAtMs,
    }),
  };
};
