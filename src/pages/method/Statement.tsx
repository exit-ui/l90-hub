interface StatementProps {
  /** The statement of the method. */
  text: string;
  /** The source label. The word "Source:" comes before it. */
  source: string;
  /** A small tag below the source, for example "Harvard research". */
  tag?: string;
}

/** One method statement with its source label in small muted text. */
export function Statement({ text, source, tag }: StatementProps) {
  return (
    <div className="min-w-0">
      <p className="type-body leading-6 break-words text-hub-text">{text}</p>
      <p className="mt-2 type-label leading-5 break-words text-hub-label">Source: {source}</p>
      {tag ? (
        <p className="mt-3 inline-flex rounded-full border border-hub-hairline bg-hub-raised px-3 py-1 type-label font-semibold text-hub-accent-text">
          {tag}
        </p>
      ) : null}
    </div>
  );
}

/** The label below each schematic curve. */
export function SchematicLabel() {
  return <p className="mt-2 type-label text-hub-label">Schematic. This is not your data.</p>;
}
