import type { ReactNode, Ref } from 'react'
import box from '../assets/preorder/checkbox.svg'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  ref?: Ref<HTMLInputElement>
  id?: string
  name?: string
  value?: string
  required?: boolean
  invalid?: boolean
  describedBy?: string
}

// Native checkbox (keyboard, form semantics) dressed in the Figma box icon.
// The design only has the empty box, so the checked mark is drawn here to
// sit exactly inside the icon's 4–20 frame.
export default function Checkbox({ checked, onChange, children, ref, id, name, value, required, invalid, describedBy }: Props) {
  return (
    <label className="check">
      <input
        type="checkbox"
        ref={ref}
        id={id}
        name={name}
        value={value}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="check__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="check__box" aria-hidden="true">
        <img src={box} alt="" width={24} height={24} />
        <svg className="check__mark" viewBox="0 0 24 24" width="24" height="24">
          <rect x="4" y="4" width="16" height="16" rx="1.6" fill="currentColor" />
          <path d="m8 12.2 2.7 2.7 5.5-5.5" fill="none" stroke="#292929" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="check__label">{children}</span>
    </label>
  )
}
