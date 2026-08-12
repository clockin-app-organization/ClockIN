// components/ui/MdaCombobox.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Clock, Building2 } from 'lucide-react'
import { MDA_LIST, searchMdas, type MdaSearchEntry } from '@/lib/mdaData'

interface MdaComboboxProps {
  value: string
  onChange: (value: string) => void
  /** Previously entered MDA/office value (e.g. from a cached prior submission) */
  recentValue?: string
  placeholder?: string
  error?: string
  name?: string
  required?: boolean
}

export default function MdaCombobox({
  value,
  onChange,
  recentValue,
  placeholder = 'Institution *',
  error,
  name = 'institution',
  required = true,
}: MdaComboboxProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const query = value.trim()
  const isSearching = query.length > 0
  const results = useMemo(
    () => (isSearching ? searchMdas(query) : []),
    [isSearching, query]
  )

  const showRecent =
    !!recentValue && recentValue !== value && (!isSearching || recentValue.toLowerCase().includes(query.toLowerCase()))

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight(0)
  }, [query, expanded, open])

  function selectEntry(entryValue: string) {
    onChange(entryValue)
    setOpen(false)
    setExpanded(null)
  }

  // Flattened list of currently-visible, keyboard-navigable rows (search mode only)
  const flatSearchRows: { key: string; value: string }[] = useMemo(() => {
    const rows: { key: string; value: string }[] = []
    if (showRecent && recentValue) rows.push({ key: 'recent', value: recentValue })
    results.forEach((r) => rows.push({ key: r.key, value: r.value }))
    return rows
  }, [results, showRecent, recentValue])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (!isSearching) return // browse mode uses mouse/tap only

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, flatSearchRows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (flatSearchRows[highlight]) {
        e.preventDefault()
        selectEntry(flatSearchRows[highlight].value)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function renderEntry(entry: MdaSearchEntry, rowIndex: number) {
    const isHighlighted = rowIndex === highlight
    return (
      <button
        key={entry.key}
        type="button"
        onMouseDown={(e) => e.preventDefault()} // keep focus, avoid blur before click registers
        onClick={() => selectEntry(entry.value)}
        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors ${
          isHighlighted ? 'bg-indigo-50' : 'hover:bg-gray-50'
        }`}
      >
        <span className="text-gray-900">
          {entry.name} <span className="text-gray-400">({entry.abbr})</span>
        </span>
        {entry.parentName && (
          <span className="text-xs text-gray-400">{entry.parentName}</span>
        )}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        name={name}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true) // typing shows live filtered suggestions
        }}
        onKeyDown={handleKeyDown}
        className={`input-base pr-9 ${error ? 'border-red-300 focus:border-red-400' : ''}`}
        required={required}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // keep focus on input
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-gray-400 hover:text-gray-600"
        aria-label={open ? 'Hide MDA list' : 'Show MDA list'}
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {isSearching ? (
            <>
              {showRecent && recentValue && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectEntry(recentValue)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    highlight === 0 ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                  <span className="text-gray-900">{recentValue}</span>
                  <span className="ml-auto flex-shrink-0 text-xs text-indigo-400">Previously used</span>
                </button>
              )}
              {results.length === 0 && !showRecent && (
                <p className="px-3 py-2 text-sm text-gray-400">
                  No matching MDA or office. You can still type your own entry.
                </p>
              )}
              {results.map((entry, idx) =>
                renderEntry(entry, showRecent ? idx + 1 : idx)
              )}
            </>
          ) : (
            <>
              {recentValue && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectEntry(recentValue)}
                  className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                  <span className="text-gray-900">{recentValue}</span>
                  <span className="ml-auto flex-shrink-0 text-xs text-indigo-400">Previously used</span>
                </button>
              )}
              <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Ministries, Departments &amp; Agencies
              </p>
              {MDA_LIST.map((mda) => {
                const isOpen = expanded === mda.abbr
                return (
                  <div key={mda.abbr}>
                    <div
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                        isOpen ? 'bg-gray-50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setExpanded(isOpen ? null : mda.abbr)}
                        className="flex flex-shrink-0 items-center justify-center rounded p-0.5 text-gray-400 hover:text-gray-600"
                        aria-label={isOpen ? 'Collapse offices' : 'Expand offices'}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectEntry(`${mda.name} (${mda.abbr})`)}
                        className="min-w-0 flex-1 truncate text-left text-gray-900"
                      >
                        {mda.name} <span className="text-gray-400">({mda.abbr})</span>
                      </button>
                    </div>
                    {isOpen && (
                      <div className="border-l border-gray-100 pl-3">
                        {mda.offices.map((office) => (
                          <button
                            key={office.abbr}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              selectEntry(`${office.name} (${office.abbr}) – ${mda.name} (${mda.abbr})`)
                            }
                            className="flex w-full items-center gap-2 py-1.5 pl-2 pr-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Building2 className="h-3 w-3 flex-shrink-0 text-gray-300" />
                            <span className="truncate">
                              {office.name} <span className="text-gray-400">({office.abbr})</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}