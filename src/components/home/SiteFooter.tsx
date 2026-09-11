/**
 * The quietest thing on the page: a hairline, a lot of air, and one line of
 * type. No name, no handles, no admin door — the work stays anonymous.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      aria-label="Site footer"
      className="relative border-t border-ink-line px-5 py-16 sm:px-8 md:py-24 lg:px-12"
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 text-[10px] tracking-[0.35em] text-bone-faint uppercase sm:flex-row sm:items-center sm:justify-between">
        <span>Selected work</span>
        <span className="tabular-nums">{year}</span>
      </div>
    </footer>
  )
}
