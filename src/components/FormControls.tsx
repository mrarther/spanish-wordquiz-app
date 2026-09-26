import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  )
}

export function Chip({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1 text-sm select-none ${
        checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
      }`}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

export function Radio<T extends string | number | boolean>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          checked={o.value === value}
          onChange={() => onChange(o.value)}
          label={o.label}
        />
      ))}
    </div>
  )
}
