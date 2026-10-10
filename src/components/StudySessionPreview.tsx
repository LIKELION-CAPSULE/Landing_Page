import { STUDY_CAMERAS, sessionPose, heart, poster } from '../data/study-session.ts'
import type { SessionMode } from '../data/study-session.ts'

type Props = { mode: SessionMode; phase: number; loadedImages: ReadonlySet<string> }

// The source images supply the camera artwork. Controls, dialogue, time,
// affinity and episode states are live UI, rather than one flat screenshot.
export default function StudySessionPreview({ mode, phase, loadedImages }: Props) {
  const reacting = mode === 'reaction' && phase >= 2 && phase < 4
  const close = mode === 'affection' && phase >= 2
  const phone = mode === 'reaction' && phase >= 1 && phase < 4
  const time = mode === 'affection' ? ['00:25:00', '00:29:40', '00:30:00', '00:30:00', '00:30:00'][phase] : mode === 'study' ? '00:00:03' : '00:06:00'

  return (
    <div className="session-preview" aria-hidden="true" data-mode={mode} data-phase={phase}>
      <div className="session__topbar"><strong>CAPSULE</strong><span><i></i> 함께 공부하는 중</span><span>4 / 4</span></div>
      <div className="session__cameras">
        {STUDY_CAMERAS.map(camera => {
          const pose = sessionPose(mode, phase, camera.id)
          const changed = mode === 'affection' && 'affection' in camera ? camera.affection : mode === 'reaction' && 'reaction' in camera ? camera.reaction : undefined
          const affinity = 'affinity' in camera ? Math.min(100, camera.affinity + (close ? 10 : 0)) : undefined
          return (
            <div className={`session__camera session__camera--${camera.id}`} data-reacting={(camera.id === 'ryu' && reacting) || undefined} data-pose={pose} key={camera.id}>
              {loadedImages.has(camera.study) && <div className="session__photo-frame"><span className="session__portrait"><img className="session__photo" src={camera.study} alt="" /></span></div>}
              {changed && loadedImages.has(changed) && <div className="session__photo-frame session__photo-frame--changed" data-shown={pose !== 'study' || undefined}><span className="session__portrait"><img className="session__photo" src={changed} alt="" /></span></div>}
              <span className="session__name">{camera.name}</span>
              {affinity !== undefined && <span className="session__affinity-badge"><span><i>{loadedImages.has(heart) && <img src={heart} alt="" />}</i>호감도 {affinity}%</span><span className="session__affinity-track"><span style={{ transform: `scaleX(${affinity / 100})` }}></span></span></span>}
              {camera.id === 'kang' && mode === 'affection' && <span className="session__dialogue" data-shown={close || undefined}>너랑 같이 하니까<br />공부가 더 좋아졌어.</span>}
              {camera.id === 'self' && <span className="session__phone" data-shown={phone || undefined}><span></span><small>잠깐 폰 확인 중</small></span>}
            </div>
          )
        })}
      </div>
      {mode === 'reaction' && <span className="session__dialogue session__dialogue--reaction" data-shown={(reacting && phase >= 3) || undefined}>어디 갔어? 폰은 잠깐 내려놓고<br />나랑 조금만 더 같이 하자.</span>}
      <div className="session__toolbar">
        <div className="session__study-time"><span>함께 공부한 시간</span><strong>{time}</strong></div>
        <div className="session__tools"><span>캠 ON</span><span>마이크 OFF</span><span className="session__leave">나가기</span></div>
        <div className="session__affinity-mini"><span>함께한 마음</span><strong>{close ? '♥ 100' : '♥ 90'}</strong></div>
      </div>
      {mode === 'affection' && (
        <>
          <div className="session__reward" data-shown={phase >= 1 || undefined}>
            <span>같이 공부한 만큼 가까워져요</span>
            <p><strong>♥ {phase >= 2 ? '100' : '90'}</strong><span> / 100</span><em data-shown={phase >= 2 || undefined}>+10</em></p>
            <div className="session__meter"><span style={{ transform: `scaleX(${phase >= 2 ? 1 : 0.9})` }}></span></div>
          </div>
          <div className="session__episode" data-shown={phase >= 3 || undefined}><span className="session__episode-icon">♥</span><span><small>새 에피소드가 열렸어요</small><strong>우리만의 공부 약속</strong></span><span>›</span></div>
          <div className="session__story-shade" data-shown={phase === 4 || undefined}></div>
          <div className="session__story" data-shown={phase === 4 || undefined}>
            {loadedImages.has(poster) && <img src={poster} alt="" />}
            <div><small>EP. 01 · 우리만의 공부 약속</small><strong>“내일도 같은 자리에서 만날래?”</strong><p>함께 쌓은 시간이 새로운 이야기가 돼요.</p></div>
          </div>
        </>
      )}
    </div>
  )
}
