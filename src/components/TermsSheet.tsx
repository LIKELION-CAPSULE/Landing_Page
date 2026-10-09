import type { MouseEvent, RefObject, SyntheticEvent } from 'react'
import type { Consent } from '../data/preorder.ts'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  consent: Consent | null
  agreed: boolean
  onAgree: () => void
  onClose: () => void
}

// Bottom sheet with a plain-language summary of one consent item.
export default function TermsSheet({ ref, consent, agreed, onAgree, onClose }: Props) {
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  // The sheet's content fills the dialog box, so a click on the dialog
  // itself came from the backdrop.
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={ref}
      className="terms-sheet"
      aria-labelledby="terms-sheet-title"
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {consent && (
        <div className="terms-sheet__inner">
          <span className="terms-sheet__grabber" aria-hidden="true"></span>

          <header className="terms-sheet__head">
            <p className="terms-sheet__tag">{consent.required ? '필수' : '선택'}</p>
            <h2 className="terms-sheet__title" id="terms-sheet-title">{consent.terms.title}</h2>
          </header>

          <div className="terms-sheet__body">
            <dl className="terms">
              {consent.terms.rows.map((row) => (
                <div className="terms__row" key={row.label}>
                  <dt className="terms__label">{row.label}</dt>
                  <dd className="terms__value">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="terms-sheet__note">{consent.terms.note}</p>
          </div>

          <div className="terms-sheet__foot">
            <button type="button" className="cta form-submit" onClick={agreed ? onClose : onAgree}>
              {agreed ? '확인' : '동의하기'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
