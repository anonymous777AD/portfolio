import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { posterUrl } from '../../lib/cloudinary'
import { useAdminStore } from '../../store/useAdminStore'
import { ASPECTS } from '../../types'
import type { Aspect, Category, Project } from '../../types'
import { BTN, SELECT } from './adminUi'
import ConfirmButton from './ConfirmButton'
import InlineText from './InlineText'

interface ProjectRowProps {
  project: Project
  categories: Category[]
  /** The raw category value this row's sortable group is keyed on. */
  groupId: string
  onEdit: (project: Project) => void
}

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="3" r="1.4" />
      <circle cx="8" cy="3" r="1.4" />
      <circle cx="2" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="2" cy="13" r="1.4" />
      <circle cx="8" cy="13" r="1.4" />
    </svg>
  )
}

/**
 * One editable project. Every field commits straight to the admin store; the
 * thumbnail is a still poster, never a video — the table would otherwise pull
 * dozens of clips off the CDN at once.
 */
export default function ProjectRow({ project, categories, groupId, onEdit }: ProjectRowProps) {
  const updateProject = useAdminStore((state) => state.updateProject)
  const toggleFeatured = useAdminStore((state) => state.toggleFeatured)
  const deleteProject = useAdminStore((state) => state.deleteProject)

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id, data: { groupId } })

  const poster = posterUrl(project.url, 160)
  const knownCategory = categories.some((entry) => entry.id === project.category)

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`border-b border-ink-line/70 transition-colors duration-150 ${
        isDragging ? 'bg-ink-raised shadow-[0_12px_30px_-12px_rgb(0_0_0/0.9)]' : 'hover:bg-ink-raised'
      }`}
    >
      <td className="px-1 py-2 align-middle">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-bone-faint hover:bg-ink hover:text-bone active:cursor-grabbing"
          aria-label={`Reorder ${project.name} within its category`}
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      </td>

      <td className="px-2 py-2 align-middle">
        <div className="relative h-11 w-[72px] overflow-hidden rounded-[3px] border border-ink-line bg-black">
          {poster ? (
            <img
              src={poster}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[9px] tracking-[0.12em] text-bone-faint uppercase">
              n/a
            </span>
          )}
        </div>
      </td>

      <td className="px-2 py-2 align-middle">
        <InlineText
          value={project.name}
          ariaLabel={`Name of ${project.name}`}
          onCommit={(next) => updateProject(project.id, { name: next })}
        />
      </td>

      <td className="px-2 py-2 align-middle">
        <select
          value={project.category}
          aria-label={`Category of ${project.name}`}
          onChange={(event) => updateProject(project.id, { category: event.target.value })}
          className={SELECT}
        >
          {categories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
          {!knownCategory && project.category !== '' && (
            <option value={project.category}>{project.category} (missing)</option>
          )}
          <option value="">— Uncategorised —</option>
        </select>
      </td>

      <td className="px-2 py-2 text-center align-middle">
        <input
          type="checkbox"
          checked={project.featured}
          aria-label={`Feature ${project.name} in the opening reel`}
          onChange={() => toggleFeatured(project.id)}
          className="h-4 w-4 cursor-pointer accent-[#00e5ff]"
        />
      </td>

      <td className="px-2 py-2 align-middle">
        <select
          value={project.aspect}
          aria-label={`Aspect ratio of ${project.name}`}
          onChange={(event) => updateProject(project.id, { aspect: event.target.value as Aspect })}
          className={SELECT}
        >
          {ASPECTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>

      <td className="px-2 py-2 align-middle">
        <InlineText
          value={project.url}
          title={project.url}
          ariaLabel={`Video URL of ${project.name}`}
          className="truncate font-mono text-[11px] text-bone-dim"
          onCommit={(next) => updateProject(project.id, { url: next })}
        />
      </td>

      <td className="px-2 py-2 align-middle">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            className={BTN}
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name} in a dialog`}
          >
            Edit
          </button>
          <ConfirmButton
            label="Delete"
            ariaLabel={`Delete ${project.name}`}
            onConfirm={() => deleteProject(project.id)}
          />
        </div>
      </td>
    </tr>
  )
}
