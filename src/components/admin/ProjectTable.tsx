import { useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, Modifier } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAdminStore } from '../../store/useAdminStore'
import type { Project } from '../../types'
import ProjectRow from './ProjectRow'

interface ProjectTableProps {
  onEdit: (project: Project) => void
}

interface RowGroup {
  /** The raw `project.category` value — exactly what reorderWithinCategory expects. */
  key: string
  label: string
  note?: string
  projects: Project[]
}

/** Rows only ever travel up and down. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

/** A row may only drop among rows of its own category. */
const sameGroupCollision: CollisionDetection = (args) => {
  const groupId: unknown = args.active.data.current?.groupId
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.data.current?.groupId === groupId,
    ),
  })
}

const COLUMNS = ['', 'Preview', 'Name', 'Category', 'Featured', 'Aspect', 'URL', ''] as const

/**
 * Every project, grouped by category — because ordering is scoped to a
 * category, a flat list would make the drag targets a lie. Projects whose
 * category no longer exists surface in their own "Uncategorised" group rather
 * than disappearing.
 */
export default function ProjectTable({ onEdit }: ProjectTableProps) {
  const categories = useAdminStore((state) => state.categories)
  const projects = useAdminStore((state) => state.projects)
  const reorderWithinCategory = useAdminStore((state) => state.reorderWithinCategory)

  const groups = useMemo<RowGroup[]>(() => {
    const known = new Set(categories.map((entry) => entry.id))

    const named: RowGroup[] = categories.map((entry) => ({
      key: entry.id,
      label: entry.label,
      projects: projects.filter((project) => project.category === entry.id),
    }))

    // One bucket per orphaned category value, so each still has a coherent
    // local order to drag within.
    const orphanKeys: string[] = []
    for (const project of projects) {
      if (!known.has(project.category) && !orphanKeys.includes(project.category)) {
        orphanKeys.push(project.category)
      }
    }

    const orphans: RowGroup[] = orphanKeys.map((key) => ({
      key,
      label: 'Uncategorised',
      note: key ? `category "${key}" no longer exists` : 'no category set — invisible on the site',
      projects: projects.filter((project) => project.category === key),
    }))

    return [...named, ...orphans]
  }, [categories, projects])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const groupId: unknown = active.data.current?.groupId
    const overGroupId: unknown = over.data.current?.groupId
    if (typeof groupId !== 'string' || groupId !== overGroupId) return

    const group = groups.find((entry) => entry.key === groupId)
    if (!group) return

    // Indices local to the category — the store re-slots them into the flat list.
    const from = group.projects.findIndex((project) => project.id === active.id)
    const to = group.projects.findIndex((project) => project.id === over.id)
    if (from < 0 || to < 0 || from === to) return

    reorderWithinCategory(groupId, from, to)
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-ink-line px-4 py-10 text-center text-[13px] text-bone-faint">
        No projects yet. Add one, or import a projects.json.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-line">
      <DndContext
        sensors={sensors}
        collisionDetection={sameGroupCollision}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <caption className="sr-only">
            All projects grouped by category. Use the grip button in each row to reorder projects
            within their category.
          </caption>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 230 }} />
            <col style={{ width: 168 }} />
            <col style={{ width: 84 }} />
            <col style={{ width: 104 }} />
            <col />
            <col style={{ width: 176 }} />
          </colgroup>

          <thead>
            <tr className="border-b border-ink-line bg-ink-raised/60">
              {COLUMNS.map((column, index) => (
                <th
                  key={column || `spacer-${index}`}
                  scope="col"
                  className={`px-2 py-2.5 text-[10px] font-medium tracking-[0.16em] text-bone-faint uppercase ${
                    column === 'Featured' ? 'text-center' : ''
                  }`}
                >
                  {column || <span className="sr-only">{index === 0 ? 'Reorder' : 'Actions'}</span>}
                </th>
              ))}
            </tr>
          </thead>

          {groups.map((group) => (
            <tbody key={`group:${group.key}`}>
              <tr className="bg-ink">
                <th
                  scope="colgroup"
                  colSpan={COLUMNS.length}
                  className="border-y border-ink-line px-3 py-2 text-left"
                >
                  <span className="text-[11px] font-medium tracking-[0.2em] text-bone uppercase">
                    {group.label}
                  </span>
                  <span className="ml-2 text-[11px] text-bone-faint">
                    {group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'}
                    {group.note ? ` · ${group.note}` : ''}
                  </span>
                </th>
              </tr>

              <SortableContext
                items={group.projects.map((project) => project.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    categories={categories}
                    groupId={group.key}
                    onEdit={onEdit}
                  />
                ))}
              </SortableContext>

              {group.projects.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="border-b border-ink-line/70 px-3 py-4 text-[12px] text-bone-faint"
                  >
                    Nothing in this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </DndContext>
    </div>
  )
}
