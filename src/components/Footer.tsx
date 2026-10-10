import copyrightCircle from '../assets/story/copyright-circle.svg'
import { useLegalDocument } from '../hooks/useLegalDocument.ts'
import LegalDocumentDialog from './LegalDocumentDialog.tsx'

export default function Footer() {
  const { ref: legalRef, document: legalDocument, showDocument, close: closeLegal } = useLegalDocument()

  return (
    <>
      <footer className="footer">
        <div className="footer__divider" aria-hidden="true" />
        <a className="footer__insta" href="https://www.instagram.com/capsule_studywithme">인스타그램 @capsule_studywithme</a>
        <p className="footer__mail">문의 <a href="mailto:capsulestudywithme@gmail.com">capsulestudywithme@gmail.com</a></p>
        <p className="footer__copy">
          <span className="footer__c" aria-hidden="true"><img src={copyrightCircle} alt="" /><span>c</span></span>
          <span className="sr-only">©</span> 2026 capsule
        </p>
        <nav className="footer__links" aria-label="약관">
          <button type="button" aria-haspopup="dialog" onClick={(event) => showDocument('terms', event.currentTarget)}>이용 약관</button>
          <span className="footer__link-separator" aria-hidden="true" />
          <button type="button" className="footer__privacy" aria-haspopup="dialog" onClick={(event) => showDocument('privacy', event.currentTarget)}>개인정보처리방침</button>
        </nav>
      </footer>
      <LegalDocumentDialog ref={legalRef} document={legalDocument} onClose={closeLegal} />
    </>
  )
}
