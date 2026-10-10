import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import Checkbox from '../components/Checkbox.tsx'
import TermsSheet from '../components/TermsSheet.tsx'
import LegalDocumentDialog from '../components/LegalDocumentDialog.tsx'
import FunnelHeader from '../components/FunnelHeader.tsx'
import { useAnimatedDialog } from '../hooks/useAnimatedDialog.ts'
import { useLegalDocument } from '../hooks/useLegalDocument.ts'
import { CONSENTS, type Consent, type PreorderDraft } from '../data/preorder.ts'
import type { Room } from '../data/rooms.ts'
import arrow from '../assets/story/cta-arrow.svg'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailError(value: string) {
  if (!value.trim()) return '출시 알림을 받을 이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(value.trim())) return '이메일을 you@example.com 형식으로 입력해주세요.'
  return ''
}

type Props = {
  votedRoom: Room | null
  draft: PreorderDraft
  onDraftChange: Dispatch<SetStateAction<PreorderDraft>>
  onSubmitDraft: (draft: PreorderDraft) => Promise<void>
  onChangeRoom: () => void
  onBack: () => void
}

export default function PreorderPage({ votedRoom, draft, onDraftChange, onSubmitDraft, onChangeRoom, onBack }: Props) {
  const { ref: legalRef, document: legalDocument, showDocument, close: closeLegal } = useLegalDocument()
  const [emailTouched, setEmailTouched] = useState(false)
  const [showPrivacyError, setShowPrivacyError] = useState(false)
  const [showRoomError, setShowRoomError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const privacyRef = useRef<HTMLInputElement>(null)
  const changeRoomRef = useRef<HTMLButtonElement>(null)
  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  const { email, consents } = draft

  // Last consent opened from "보기"; kept while the sheet animates out.
  const [termsId, setTermsId] = useState<Consent['id'] | null>(null)
  // Snapshot at open so the button label doesn't flip while closing.
  const [termsAgreed, setTermsAgreed] = useState(false)
  const { ref: termsRef, open: showTerms, close: closeTerms } = useAnimatedDialog()
  const termsConsent = CONSENTS.find((consent) => consent.id === termsId) ?? null

  const emailMessage = emailTouched ? emailError(email) : ''
  const privacyMessage = showPrivacyError && !consents.privacy ? '사전예약하려면 개인정보 수집·이용에 동의해주세요.' : ''
  const roomMessage = showRoomError && !votedRoom ? '함께 공부할 룸을 먼저 선택해주세요.' : ''

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = '사전예약 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const setConsent = (id: Consent['id'], checked: boolean) => {
    onDraftChange((current) => ({ ...current, consents: { ...current.consents, [id]: checked } }))
  }

  const openTerms = (id: Consent['id']) => {
    flushSync(() => {
      setTermsId(id)
      setTermsAgreed(consents[id])
    })
    showTerms()
  }

  const agreeToTerms = () => {
    if (termsId) setConsent(termsId, true)
    closeTerms()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return
    flushSync(() => {
      setEmailTouched(true)
      setShowPrivacyError(true)
      setShowRoomError(true)
      setSubmitError('')
    })

    if (!votedRoom) { changeRoomRef.current?.focus(); return }
    if (emailError(email)) { emailRef.current?.focus(); return }
    if (!consents.privacy) { privacyRef.current?.focus(); return }

    submittingRef.current = true
    setSubmitting(true)
    try {
      await onSubmitDraft({ ...draft, email: email.trim() })
    } catch {
      if (mountedRef.current) setSubmitError('사전예약을 접수하지 못했어요. 입력 내용은 유지되니 다시 시도해주세요.')
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setSubmitting(false)
    }
  }

  return (
    <main className="preorder">
      {/* 6. Pre-registration (Figma 161:514) */}
      <FunnelHeader current={3} onBack={onBack} disabled={submitting} />

      <header className="preorder__header">
        <div className="preorder__intro">
          <h1 className="preorder__title">
            <span>사전예약하고</span>
            <span className="accent">출시 알림 받기</span>
          </h1>
          <p className="preorder__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
        </div>

        <div className="preorder__room-card" data-empty={!votedRoom || undefined}>
          <div className="preorder__room-head">
            <p className="preorder__room-label">선택한 룸</p>
            <button type="button" className="text-action preorder__room-change" id="preorder-change-room" ref={changeRoomRef} disabled={submitting} aria-describedby={roomMessage ? 'room-error' : undefined} onClick={onChangeRoom}>
              {votedRoom ? '룸 변경' : '룸 선택'}
            </button>
          </div>
          <div className="preorder__room-body">
            {votedRoom && <img className="preorder__room-thumb" src={votedRoom.image} alt="" width={200} height={275} />}
            <div className="preorder__room-info">
              <p className="perk__room">{votedRoom?.name ?? '먼저 룸을 선택해주세요'}</p>
            </div>
          </div>
          <p className="perk__note">사전예약 후, 해당 룸 출시 시 무료 해금</p>
        </div>
        <p className="field__error" id="room-error">{roomMessage}</p>
      </header>

      <form className="preorder__form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <fieldset className="preorder__fields" disabled={submitting}>
          <label className="field">
            <span className="field__label">이메일 <span className="field__requirement">필수</span></span>
            <input
              className="field__control"
              id="preorder-email"
              name="email"
              ref={emailRef}
              required
              maxLength={254}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
              aria-invalid={!!emailMessage || undefined}
              aria-describedby={emailMessage ? 'email-error' : undefined}
            />
            <span className="field__error" id="email-error">{emailMessage}</span>
          </label>

          <div className="preorder__divider" aria-hidden="true" />

          <div className="consents">
            {CONSENTS.map((consent) => (
              <div className="consents__row" key={consent.id}>
                <Checkbox ref={consent.id === 'privacy' ? privacyRef : undefined} id={`consent-${consent.id}`} name={`${consent.id}Consent`} required={consent.required} invalid={consent.id === 'privacy' && !!privacyMessage} describedBy={consent.id === 'privacy' && privacyMessage ? 'privacy-error' : undefined} checked={consents[consent.id]} onChange={(checked) => setConsent(consent.id, checked)}>
                  {consent.label}
                </Checkbox>
                <button
                  type="button"
                  className="consents__view"
                  aria-label={`${consent.label} 보기`}
                  aria-haspopup="dialog"
                  onClick={() => openTerms(consent.id)}
                >
                  보기
                </button>
              </div>
            ))}
          </div>
          <p className="field__error consents__error" id="privacy-error">{privacyMessage}</p>

          <p className="preorder__fine">
            이메일은 출시 알림과 사전예약 혜택 지급에 사용해요.
            이벤트·혜택 정보는 선택 동의한 경우에만 보내요.
            혜택 지급 후 6개월이 지나면 파기해요. 자세한 내용은{' '}
            <button type="button" className="preorder__policy" aria-haspopup="dialog" onClick={(event) => showDocument('privacy', event.currentTarget)}>개인정보처리방침</button>을 확인해 주세요.
          </p>

          <button type="submit" className="cta form-submit" id="preorder-submit" disabled={submitting}>
            <span>{submitting ? '사전예약 접수 중…' : submitError ? '다시 시도하기' : '사전예약하기'}</span>
            <img className="cta__arrow form-submit__arrow" src={arrow} alt="" width={24} height={24} />
          </button>
        </fieldset>
        <p className="form-feedback" role="status">{submitError}</p>
      </form>

      <TermsSheet
        ref={termsRef}
        consent={termsConsent}
        agreed={termsAgreed}
        onAgree={agreeToTerms}
        onClose={closeTerms}
      />
      <LegalDocumentDialog ref={legalRef} document={legalDocument} onClose={closeLegal} />
    </main>
  )
}
