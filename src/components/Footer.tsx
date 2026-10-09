import dividerFooter from '../assets/story/divider-footer.svg'
import copyrightCircle from '../assets/story/copyright-circle.svg'
import footerSep from '../assets/story/footer-sep.svg'

export default function Footer() {
  return (
    <footer className="footer">
      <img className="footer__divider" src={dividerFooter} alt="" />
      <a className="footer__insta" href="https://www.instagram.com/capsule_studywithme">인스타그램 @capsule_studywithme</a>
      <p className="footer__mail">문의 <a href="mailto:capsulestudywithme@gmail.com">capsulestudywithme@gmail.com</a></p>
      <p className="footer__copy">
        <span className="footer__c" aria-hidden="true"><img src={copyrightCircle} alt="" /><span>c</span></span>
        <span className="sr-only">©</span> 2026 capsule
      </p>
      <nav className="footer__links" aria-label="약관">
        <a href="#">이용 약관</a>
        <img src={footerSep} alt="" />
        <a href="#">개인정보처리방침</a>
      </nav>
    </footer>
  )
}
