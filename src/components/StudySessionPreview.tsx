import { STUDY_CAMERAS, sessionPose, sessionMetrics, formatStudyTime, heart, poster } from '../data/study-session.ts'
import type { SessionMode } from '../data/study-session.ts'
import wordmark from '../assets/optimized/hero/logo.webp'
import users from '../assets/story/study-session/users.svg'
import signal from '../assets/story/study-session/signal.svg'
import settings from '../assets/story/study-session/settings.svg'
import book from '../assets/story/study-session/book.svg'
import target from '../assets/story/study-session/target.svg'
import micOff from '../assets/story/study-session/mic-off.svg'
import screenShare from '../assets/story/study-session/screen-share.svg'
import end from '../assets/story/study-session/end.svg'

type Props = { mode: SessionMode; phase: number; progress: number; loadedImages: ReadonlySet<string> }

// Artwork stays separate from the live time, affinity, dialogue and episode UI.
export default function StudySessionPreview({ mode, phase, progress, loadedImages }: Props) {
  const reacting = mode === 'reaction' && phase >= 2 && phase < 4
  const metrics = sessionMetrics(mode, phase, progress)
  const unlocked = mode === 'affection' && phase >= 5
  const story = mode === 'affection' && phase >= 6
  const goalProgress = Math.min(1, metrics.seconds / 21600)

  return (
    <div className="session-preview" aria-hidden="true" data-mode={mode} data-phase={phase}>
      <div className="session__topbar">
        <img className="session__wordmark" src={wordmark} alt="" />
        <span className="session__room"><i></i> 스터디룸 : 쌀쌀맞은 갸루짝꿍이 나에게만 친절하다!</span>
        <span className="session__status"><span><img src={users} alt="" />4/4</span><img src={signal} alt="" /><img src={settings} alt="" /></span>
      </div>
      <div className="session__cameras">
        {STUDY_CAMERAS.map(camera => {
          const pose = sessionPose(mode, phase, camera.id)
          const changed = mode === 'affection' && 'affection' in camera ? camera.affection : mode === 'reaction' ? camera.reaction : undefined
          const affinity = 'affinity' in camera ? metrics.affinity(camera.affinity) : undefined
          return (
            <div className={`session__camera session__camera--${camera.id}`} data-reacting={(camera.id === 'ryu' && reacting) || undefined} data-pose={pose} key={camera.id}>
              {loadedImages.has(camera.study) && <div className="session__photo-frame"><span className="session__portrait"><img className="session__photo" src={camera.study} alt="" /></span></div>}
              {changed && loadedImages.has(changed) && <div className="session__photo-frame session__photo-frame--changed" data-shown={pose !== 'study' || undefined}><span className="session__portrait"><img className="session__photo" src={changed} alt="" /></span></div>}
              <span className="session__name">{camera.name}</span>
              {affinity !== undefined && <span className="session__affinity-badge"><span><i>{loadedImages.has(heart) && <img src={heart} alt="" />}</i>호감도 {affinity}%</span><span className="session__affinity-track"><span style={{ transform: `scaleX(${affinity / 100})` }}></span></span></span>}
              {mode === 'affection' && 'dialogue' in camera && <span className="session__dialogue" data-shown={!story && (phase > camera.dialoguePhase || phase === camera.dialoguePhase && progress >= 0.28) || undefined}>{camera.dialogue}</span>}
              {camera.id === 'ryu' && mode === 'reaction' && <span className="session__dialogue session__dialogue--reaction" data-shown={reacting && phase >= 3 || undefined}>“야!!!!! 너 지금 공부하다말고<br />다른 여자랑 핸드폰으로<br />연락하는거야??!”</span>}
            </div>
          )
        })}
      </div>
      {mode === 'study' ? (
        <div className="session__study-summary">
          <div className="session__study-clock"><span>함께 공부한 시간</span><strong>{formatStudyTime(metrics.seconds)}</strong></div>
          <div className="session__study-growth">
            {STUDY_CAMERAS.map(camera => 'affinity' in camera && <span key={camera.id}><small>{camera.name}<strong>{metrics.affinity(camera.affinity)}%</strong></small><span className="session__affinity-track"><span style={{ transform: `scaleX(${metrics.affinity(camera.affinity) / 100})` }}></span></span></span>)}
          </div>
        </div>
      ) : <div className="session__toolbar">
        <div className="session__goal">
          <img src={target} alt="" /><span>목표 공부 시간</span><strong>06:00:00</strong><small>{Math.floor(goalProgress * 100)}%</small>
          <span className="session__goal-track"><span style={{ transform: `scaleX(${goalProgress})` }}></span></span>
        </div>
        <div className="session__tools"><span><img src={micOff} alt="" /></span><span><img src={screenShare} alt="" /></span><span className="session__leave"><img src={end} alt="" /><small>공부 종료</small></span></div>
        <div className="session__study-time"><img src={book} alt="" /><span>누적 공부 시간</span><strong>{formatStudyTime(metrics.seconds)}</strong></div>
      </div>}
      {mode === 'affection' && (
        <>
          <div className="session__episode" data-shown={unlocked && !story || undefined}><span className="session__episode-icon">♥<small>100</small></span><span><small>호감도 100 달성!</small><strong>다음 에피소드가 열렸어요</strong></span><span>›</span></div>
          <div className="session__story-shade" data-shown={story || undefined}></div>
          <div className="session__story" data-shown={story || undefined}>
            {loadedImages.has(poster) && <img src={poster} alt="" />}
            <div><small>EP. 02 · 우리만의 공부 약속</small><strong>“내일도 같은 자리에서 만날래?”</strong><p>함께 쌓은 시간이 다음 이야기로 이어져요.</p></div>
          </div>
        </>
      )}
    </div>
  )
}
