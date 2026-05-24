import { useEffect, useState } from "react";

export function TypingHeadline({
  phrases,
  className = "",
}: {
  phrases: string[];
  className?: string;
}) {
  const [i, setI] = useState(0);
  const phrase = phrases[i % phrases.length] ?? "";
  const longestPhrase = phrases.reduce((longest, next) => Math.max(longest, next.length), 0);

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => v + 1), 1900);
    return () => window.clearInterval(t);
  }, []);

  return (
    <span
      key={phrase}
      className={`headline-word ${className}`}
      style={{ minWidth: `${longestPhrase}ch` }}
    >
      {phrase}
    </span>
  );
}
