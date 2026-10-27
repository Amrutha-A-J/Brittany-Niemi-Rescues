import { Fragment } from "react";

/** Renders heading text from the admin: a new line becomes a line break, and *words* in asterisks are italic. */
export function RichHeading({ text }: { text: string }) {
  return text
    .trim()
    .split("\n")
    .map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {line.split(/\*([^*]+)\*/).map((part, j) => (j % 2 ? <em key={j}>{part}</em> : part))}
      </Fragment>
    ));
}

