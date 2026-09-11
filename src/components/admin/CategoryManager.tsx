import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { PROTECTED_CATEGORY_ID } from '../../types'
import { BTN_PRIMARY, FIELD, HINT, PANEL, SECTION_TITLE, TRANSITION } from './adminUi'
import ConfirmButton from './ConfirmButton'
import InlineText from './InlineText'

/**
 * Category list: inline rename, add, delete. The protected category can never
 * be removed — the home page keys its opening reel off it.
 */
export default function CategoryManager() {
  const categories = useAdminStore((state) => state.categories)
  const projects = useAdminStore((state) => state.projects)
  const addCategory = useAdminStore((state) => state.addCategory)
  const renameCategory = useAdminStore((state) => state.renameCategory)
  const deleteCategory = useAdminStore((state) => state.deleteCategory)

  const [draft, setDraft] = useState('')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const project of projects) {
      map.set(project.category, (map.get(project.category) ?? 0) + 1)
    }
    return map
  }, [projects])

  const onAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const label = draft.trim()
    if (!label) return
    addCategory(label)
    setDraft('')
  }

  return (
    <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="categories-title">
      <h2 id="categories-title" className={SECTION_TITLE}>
        Categories
      </h2>
      <p className={`${HINT} mt-2 max-w-prose`}>
        Renaming is safe — the site reads the label, and the id never changes. Deleting a category
        leaves its projects uncategorised: they stay in the table under “Uncategorised” and drop off
        the site until you give them a new category.
      </p>

      <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line">
        {categories.map((category) => {
          const count = counts.get(category.id) ?? 0
          const locked = category.id === PROTECTED_CATEGORY_ID
          return (
            <li
              key={category.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 ${TRANSITION} hover:bg-ink-raised`}
            >
              <div className="min-w-[180px] flex-1">
                <InlineText
                  value={category.label}
                  ariaLabel={`Rename category ${category.label}`}
                  onCommit={(next) => renameCategory(category.id, next)}
                />
              </div>
              <code className="font-mono text-[11px] text-bone-faint">{category.id}</code>
              <span className="w-20 text-right text-[11px] text-bone-faint">
                {count} {count === 1 ? 'project' : 'projects'}
              </span>
              <ConfirmButton
                label="Delete"
                question={count > 0 ? `Delete? ${count} will be uncategorised.` : 'Delete?'}
                ariaLabel={`Delete category ${category.label}`}
                disabled={locked}
                title={
                  locked
                    ? 'The featured category is required by the home page and cannot be deleted.'
                    : undefined
                }
                onConfirm={() => deleteCategory(category.id)}
              />
            </li>
          )
        })}
        {categories.length === 0 && (
          <li className="py-4 text-[12px] text-bone-faint">No categories yet.</li>
        )}
      </ul>

      <form onSubmit={onAdd} className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="new-category" className="sr-only">
          New category name
        </label>
        <input
          id="new-category"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="New category name"
          autoComplete="off"
          className={`${FIELD} max-w-xs flex-1`}
        />
        <button type="submit" className={BTN_PRIMARY} disabled={draft.trim() === ''}>
          Add category
        </button>
      </form>
    </section>
  )
}
