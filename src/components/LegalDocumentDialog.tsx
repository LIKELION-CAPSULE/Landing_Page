import type { RefObject } from 'react'
import { LEGAL_DOCUMENTS } from '../data/legal-documents.ts'
import type { LegalDocumentId } from '../data/legal-documents.ts'
import './LegalDocumentDialog.css'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  document: LegalDocumentId | null
  onClose: () => void
}

function inlineText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => (
    part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part
  ))
}

export default function LegalDocumentDialog({ ref, document, onClose }: Props) {
  const content = document ? LEGAL_DOCUMENTS[document] : null

  return (
    <dialog
      ref={ref}
      className="legal-dialog"
      aria-labelledby="legal-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      {content && (
        <div className="legal-dialog__inner">
          <header className="legal-dialog__header">
            <h2 id="legal-dialog-title">{content.title}</h2>
            <button type="button" className="legal-dialog__close" aria-label={`${content.title} 닫기`} autoFocus onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          <article className="legal-dialog__body" aria-label={`${content.title} 전문`} tabIndex={0}>
            {content.blocks.map((block, index) => {
              if (block.type === 'heading') return <h3 key={index}>{block.text}</h3>
              if (block.type === 'paragraph') return <p key={index}>{inlineText(block.text)}</p>
              if (block.type === 'list') {
                const List = block.ordered ? 'ol' : 'ul'
                return <List key={index}>{block.items.map((item) => <li key={item}>{inlineText(item)}</li>)}</List>
              }
              if (block.type === 'table') {
                return (
                  <table key={index}>
                    <thead><tr>{block.headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
                    <tbody>{block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inlineText(cell)}</td>)}</tr>
                    ))}</tbody>
                  </table>
                )
              }
              return null
            })}
          </article>
        </div>
      )}
    </dialog>
  )
}
