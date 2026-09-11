import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { parseProjectsData, useAdminStore } from '../../store/useAdminStore'
import { BTN_PRIMARY, DANGER_TEXT, HINT, PANEL, SECTION_TITLE } from './adminUi'
import ConfirmButton from './ConfirmButton'
import { fetchProjectsFile } from './fetchProjectsFile'

interface Message {
  tone: 'ok' | 'error'
  text: string
}

/**
 * The publish loop: export what is in the browser, import a file back, or throw
 * local edits away and re-read the deployed one. Nothing here talks to a
 * server — the site's data is a file in the repo.
 */
export default function ImportExportBar() {
  const exportData = useAdminStore((state) => state.exportData)
  const importData = useAdminStore((state) => state.importData)
  const resetToFile = useAdminStore((state) => state.resetToFile)

  const [message, setMessage] = useState<Message | null>(null)
  const [reverting, setReverting] = useState(false)

  const onExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'projects.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    // Revoke on the next tick — revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(href), 0)
    setMessage({
      tone: 'ok',
      text: `Downloaded projects.json — ${data.projects.length} projects, ${data.categories.length} categories.`,
    })
  }

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    // Reset immediately so picking the same file again still fires a change.
    input.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const data = parseProjectsData(parsed)
      importData(data)
      setMessage({
        tone: 'ok',
        text: `Imported ${data.projects.length} projects and ${data.categories.length} categories.`,
      })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'That file could not be imported.',
      })
    }
  }

  const onRevert = () => {
    setReverting(true)
    setMessage(null)
    fetchProjectsFile()
      .then((data) => {
        resetToFile(data)
        setMessage({ tone: 'ok', text: 'Reverted to the deployed projects.json.' })
      })
      .catch((error: unknown) => {
        setMessage({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Could not re-read projects.json.',
        })
      })
      .finally(() => setReverting(false))
  }

  return (
    <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="publish-title">
      <h2 id="publish-title" className={SECTION_TITLE}>
        Publish
      </h2>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div>
          <button type="button" className={BTN_PRIMARY} onClick={onExport}>
            Export JSON
          </button>
          <p className={`${HINT} mt-2`}>
            Commit the downloaded file to <code className="font-mono">public/projects.json</code>,
            then redeploy. That is what makes these edits public.
          </p>
        </div>

        <div>
          <label htmlFor="import-json" className="sr-only">
            Import a projects.json file
          </label>
          <input
            id="import-json"
            type="file"
            accept="application/json,.json"
            onChange={onImport}
            className="block w-full text-[12px] text-bone-dim file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-ink-line file:bg-ink file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-bone-dim hover:file:bg-ink-raised hover:file:text-bone"
          />
          <p className={`${HINT} mt-2`}>
            Import replaces everything currently in the browser with the file you pick.
          </p>
        </div>

        <div>
          <ConfirmButton
            label="Revert to deployed projects.json"
            question="Discard all local edits?"
            ariaLabel="Revert to the deployed projects.json"
            busy={reverting}
            onConfirm={onRevert}
          />
          <p className={`${HINT} mt-2`}>
            Re-reads the file from the live site and throws away every unexported change.
          </p>
        </div>
      </div>

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`mt-4 border-t border-ink-line pt-3 text-[12px] ${
            message.tone === 'error' ? DANGER_TEXT : 'text-accent'
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}
