import { useState } from 'react'
import { flushSync } from 'react-dom'
import type { LegalDocumentId } from '../data/legal-documents.ts'
import { useAnimatedDialog } from './useAnimatedDialog.ts'

export function useLegalDocument() {
  const [document, setDocument] = useState<LegalDocumentId | null>(null)
  const { ref, open, close } = useAnimatedDialog()

  const showDocument = (id: LegalDocumentId, trigger: HTMLElement) => {
    // Safari doesn't focus buttons on pointer activation. Give the native
    // dialog an opener to return focus to when it closes.
    trigger.focus({ preventScroll: true })
    flushSync(() => setDocument(id))
    open()
    ref.current?.querySelector('.legal-dialog__body')?.scrollTo(0, 0)
  }

  return { document, ref, showDocument, close }
}
