export const generateAcronym = (title: string): string => {
  const words = title
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "";

  if (words.length >= 4) {
    return words
      .slice(0, 4)
      .map((word) => word[0])
      .join("");
  }

  let acronym = "";

  for (const word of words) {
    acronym += word[0];

    if (acronym.length < 4 && word.length > 1) {
      const remainingLetters = word.slice(1);
      const randomIndex = Math.floor(Math.random() * remainingLetters.length);
      acronym += remainingLetters[randomIndex];
    }

    if (acronym.length >= 4) break;
  }

  while (acronym.length < 4) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomIndex = Math.floor(Math.random() * randomWord.length);
    acronym += randomWord[randomIndex];
  }

  return acronym.slice(0, 4);
};
