import logo from '../assets/brand/capsule-horizontal-color.svg'
import { useLegalDocument } from '../hooks/useLegalDocument.ts'
import LegalDocumentDialog from './LegalDocumentDialog.tsx'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../data/social.ts'
import './Footer.css'

export default function Footer() {
  const { ref: legalRef, document: legalDocument, showDocument, close: closeLegal } = useLegalDocument()

  return (
    <>
      <footer className="site-footer" aria-label="캡슐 문의와 약관">
        <div className="site-footer__inner">
          <p className="site-footer__closing">노트북 앞의 시간,<br />이제 혼자가 아니에요</p>
          <p className="site-footer__ai">CAPSULE의 메이트는 실제 사람이 아닌 AI 캐릭터이며, 메이트의 대화는 AI가 생성해요.</p>
          <div className="site-footer__details">
            <div className="site-footer__contact">
              <img className="site-footer__logo" src={logo} width="160" height="37" alt="CAPSULE" draggable={false} />
              <a href={INSTAGRAM_URL}>인스타그램 @{INSTAGRAM_HANDLE}</a>
              <a href="mailto:capsulestudywithme@gmail.com">capsulestudywithme@gmail.com</a>
            </div>
            <div className="site-footer__legal">
              <nav className="site-footer__links" aria-label="약관">
                <button type="button" aria-haspopup="dialog" onClick={(event) => showDocument('terms', event.currentTarget)}>이용약관</button>
                <button type="button" className="site-footer__privacy" aria-haspopup="dialog" onClick={(event) => showDocument('privacy', event.currentTarget)}>개인정보처리방침</button>
              </nav>
              <p className="site-footer__copy">© 2026 CAPSULE</p>
            </div>
          </div>
        </div>
      </footer>
      <LegalDocumentDialog ref={legalRef} document={legalDocument} onClose={closeLegal} />
    </>
  )
}
