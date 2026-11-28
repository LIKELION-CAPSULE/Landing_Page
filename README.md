# CAPSULE 랜딩 페이지

노트북 앞의 시간을 AI 메이트와 영상통화하듯 함께 보내는 캡슐의 웹 베타 소개 페이지입니다.

## 섹션 구성

| 섹션 | 내용 |
| --- | --- |
| S1 · 히어로 | 메이트와 연결된 통화 화면(실제 Live2D, 채린·서도현 전환), 앱 시작·PC 링크 공유 |
| S2 · 대비 | 같은 대사를 글로 읽는 경험과 얼굴·표정으로 보는 경험 |
| S3 · 직접 말 걸기 | 빠른 답장 네 가지에 반응하는 영상 데모 |
| S4 · 반응하는 순간들 | 목소리 응답, 자리 비움 감지, 작업 옆 PIP 예시 |
| S5 · 이어지는 관계 | 친밀도 5단계마다 열리는 세계관(EP.01–05, 구조만), 연결 기록·캡슐·내 기록·출석·친구 초대 |
| S6 · 메이트 소개 | 강채린(`#chaerin`)·서도현(`#dohyun`) 카드 |
| S7 · 베타 안내 | 일정, 시작 방법, 안심 포인트와 앱 연결 |
| S8 · 푸터 | 문의, 이용 약관, 개인정보처리방침 |

페이지는 `/` 하나입니다. 이전 주소로 방문하면 방문 유입 쿼리를 유지하면서 `/`로 대체 이동합니다. 데모 대사는 미리 정해진 예시이며 실제 서비스에서는 AI가 대화를 이어갑니다. 랜딩 데모는 카메라·마이크를 사용하지 않습니다.

메이트 정보는 앱(Front_Web `src/features/mates/catalog.ts`)을 따릅니다(`src/data/mates.ts`). 세계관 이름·배경 그림은 앱 운영 화면에 아직 없어 넣지 않았습니다(2026-11-28 사용자 결정).

### 404 화면

없는 주소는 `dist/404.html`(빌드 때 프리렌더, `noindex`, 탭 제목 「캡슐 CAPSULE · 페이지를 찾을 수 없어요」)로 나가고, Vercel은 이 파일을 404 상태로 돌려줍니다. 옛 주소 rewrite와 `/api/login-mates`는 그대로입니다. 「404」의 0 자리는 로고 v2 캡슐이 금 가 조금씩 벌어진 모습이고, 보라빛 유리 조각이 떠다닙니다(SVG + CSS, 새 의존성 없음, 동작 줄이기·저사양에서는 멈춤). 시각 부분은 `src/components/not-found/`(React와 CSS만, 색은 앱 토큰을 기본값과 함께 사용) 한 폴더에 있어 앱으로 그대로 옮길 수 있습니다. 버튼은 「홈으로」와 대표 버튼(같은 날짜 규칙, 열린 뒤 「CAPSULE 시작하기」)입니다. `vite preview`도 없는 주소에 같은 파일을 404로 돌려주고, `vite` 개발 서버는 경로를 보고 이 화면을 그립니다.

### 첫 화면 Live2D

- HTML에는 메이트 정지 그림(`chaerin-v2-hero.webp`)이 같은 구도로 들어 있고, 이것이 첫 화면의 LCP입니다. 위치는 `src/lib/live2d/view.ts`의 같은 숫자로 CSS(컨테이너 단위)와 엔진 시점(`setView`)을 함께 정해 정지 그림과 실시간 모델이 겹칩니다.
- 페이지 로드가 끝나고 한가할 때 `GET /api/login-mates`(같은 출처, `vercel.json` rewrite → `https://api.capsule.ai.kr/api/login-mates`, 공개 API 48)를 한 번 부르고, 서버 이름을 앱 규칙대로 채린·서도현에 매칭(`src/lib/live2d/mate-names.ts`, 「서진」→서도현, 「말포이」 무시)한 뒤 Aliving2D v2 엔진·플레이어 스크립트를 자산 저장소(Supabase `live2d-model` 버킷만 허용)에서 받아 정지 그림 위에 덧입힙니다. 엔진은 번들에 넣지 않고, 렌더러 코드(`renderer.ts`, 약 3 kB)는 지연 로드합니다.
- 동작 줄이기, 데이터 절약, 3G 이하, CPU 4코어·메모리 4 GB 미만, WebGL2 없음, API·모델 실패 때는 정지 그림을 유지합니다. QA: `?live=0`(항상 정지 그림), `?live=1`(기기 조건 건너뜀).
- 로컬 `vite`·`vite preview`는 같은 경로를 `vite.config.ts` 프록시로 넘깁니다(GET·HEAD만).

## 기술 스택

- React 19, TypeScript 6, Vite 8
- CSS 디자인 토큰, Pretendard 기반 Capsule UI와 Hahmlet 기반 Capsule Story 자체 호스팅 서브셋
- WebM(VP9)·MP4(H.264) 영상, WebP 이미지, 브라우저 API 기반 재생·접근성 제어
- Mixpanel 방문·클릭 분석과 세션 재현, Oxlint

3D 및 캐릭터 런타임 엔진 없이 사전 렌더한 에셋을 사용합니다.

## 실행과 빌드

Node.js 24 LTS와 npm을 사용합니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

```sh
npm run build      # 타입 검사 → 클라이언트 빌드 → SSR 빌드 → / 프리렌더(scripts/prerender.mjs)
npm run typecheck
npm run lint
npm test           # 날짜·CTA, Live2D 매칭·구도, 프리렌더 결과(빌드 뒤)
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. `dist/index.html`에는 본문 글·제목 구조·JSON-LD(Organization, WebSite, WebApplication, FAQPage)가 들어 있어 JS 없이도 읽힙니다. 화면 크기·시간·저장소에 따라 달라지는 값은 첫 렌더(하이드레이션)에서 고정값을 쓰고 마운트 뒤에 바꿉니다. 환경변수는 빌드 시 반영되므로 바꾸면 다시 빌드해야 합니다. 픽셀 그림(`src/components/pixel/pixel-art.ts`)을 바꾸면 `node scripts/build-pixel-art.mjs`, 문구 글자가 바뀌면 `python3 scripts/subset-font.py`를 다시 실행합니다.

## 환경변수

| 변수 | 설명 |
| --- | --- |
| `VITE_APP_URL` | 앱 주소(`http`/`https` 절대 주소, 경로가 없으면 `/login`을 붙임). 비어 있거나 잘못된 값이면 12월 1일 이후에도 PC 버튼이 "오픈 준비 중"으로 잠긴 채 유지됩니다. 바꾼 뒤에는 다시 배포해야 반영됩니다 |
| `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_NAVER_SITE_VERIFICATION` | 선택. 값이 있을 때만 검색 등록 확인 `<meta>`를 넣습니다 |
| `VITE_MIXPANEL_TOKEN` | 공개 프로젝트 토큰. 비어 있으면 분석 호출 없음 |
| `VITE_MIXPANEL_API_HOST` | 선택 설정. Mixpanel 프로젝트 지역에 맞는 API 주소. 비어 있으면 SDK 기본 주소 |

`VITE_` 값은 공개 번들에 포함되므로 비밀 키를 넣지 않습니다. 앱 링크에는 현재 URL의 `utm_*`와 `ref`가 전달됩니다.

2026년 12월 1일 00:00 KST 전에는 PC와 휴대폰 버튼 모두 "12월 1일 오픈"으로 잠깁니다. 이후 PC는 `VITE_APP_URL`이 올바를 때 「지금 시작하기」로 앱에 연결하고, 아니면 "오픈 준비 중"을 표시합니다. 시각은 방문자 브라우저에서 판단합니다: `index.html`의 인라인 스크립트(빌드 때 `vite.config.ts`가 넣음)가 첫 화면을 그리기 전에 `<html data-cta-phase>`를 정하고, 버튼 글자는 모두 한 칸에 겹쳐 두고 하나만 보이게 해서 바뀌어도 크기가 변하지 않습니다. 휴대폰은 랜딩 주소를 공유하거나 링크를 복사합니다. QA용 `?cta=before|preparing|open` 파라미터는 로컬 개발과 Vercel preview 배포에서만 동작하고 프로덕션에서는 무시됩니다. preview에서 `VITE_APP_URL`이 없으면 `?cta=open`은 `https://capsule-front-web.vercel.app/login`으로 연결합니다.

Mixpanel은 페이지 방문, 지정한 버튼·데모 이벤트를 수집합니다. 세션 재현 비율은 100%이며 입력값 가림과 영상·오디오 차단을 설정합니다. 설정 코드는 `src/lib/analytics.ts`, 약관 원문은 `src/data/legal/`에 있습니다. 원문 상단의 법적 검토용 주석은 화면에 표시하지 않습니다. 법적 검토 및 미정 항목 확정은 공개 운영 전에 필요합니다.

## 에셋과 글꼴 출처

- 채린·서도현: Aliving2D로 만든 영상·이미지 렌더만 `src/assets/mates/`에 포함합니다(정지 그림은 Front_Web `src/assets/characters/`와 같은 파일). 원본 캐릭터 모델·파츠·렌더 엔진은 포함하지 않으며, 첫 화면의 실시간 모델은 앱과 같은 자산 저장소에서 받습니다.
- 로고·통화 배경·픽셀 그림: CAPSULE 앱의 로고 v2(컬러 가로형), 통화 배경, 픽셀 프레임 그림을 옮겨 씁니다.
- 통화 배경·바탕화면·로고: CAPSULE 앱의 배경과 브랜드 로고 v2 에셋을 사용합니다. 각 에셋의 권리는 해당 권리자에게 있습니다.
- Pretendard 기반 Capsule UI: 자체 호스팅 서브셋. 라이선스는 `public/fonts/LICENSE.txt`.
- Hahmlet 기반 Capsule Story: 포인트 문구용 WOFF2 서브셋으로 별도 이름을 사용합니다. SIL OFL 1.1은 `public/fonts/Hahmlet-OFL.txt`. 원본 TTF는 배포하지 않습니다.
- OG 이미지: 히어로 가로 포스터·화이트 로고 v2·페이지 제목을 HTML로 합성한 `public/images/capsule-og.jpg`(1200×630).

글꼴 관련 스크립트는 `scripts/subset-font.py`, `scripts/subset-story-font.py`입니다. 포인트 문구 목록은 `scripts/story-font-text.txt`에서 관리합니다.

## 배포

1. `npm ci` 후 `npm run build`를 실행하고 `dist/`를 정적 호스팅합니다.
2. 페이지는 `/` 하나입니다. `public/robots.txt`(AI 크롤러 포함 전체 허용, `/api/`·옛 주소 제외), `public/sitemap.xml`, `public/llms.txt`(서비스 요약)를 함께 배포합니다. `vercel.json`은 `/api/login-mates`를 API 서버로 넘기고(같은 출처라 CORS 없음), 옛 주소(`/rooms`, `/preorder`, `/done`, `/survey`, `/test`, 끝 슬래시 포함)를 주소 변경 없이 `index.html`로 rewrite하고, `src/main.tsx`가 분석 초기화 전에 주소를 `/`로 바꿉니다(쿼리·해시 유지). 그 밖의 없는 경로는 Vercel 기본 404를 돌려줍니다. 같은 파일에서 보안 헤더(`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`)와 해시 파일(`/assets/*`)의 1년 캐시를 설정합니다. 다른 호스팅으로 옮기면 같은 규칙을 옮겨 설정합니다.
3. `VITE_APP_URL`과 분석 프로젝트 지역을 배포 환경에 맞춥니다.
4. 운영 도메인은 `https://landing.capsule.ai.kr`입니다. 임시 주소 `landing-page-nine-psi-56.vercel.app`은 이 도메인으로 넘어갑니다. 도메인을 바꾸면 `index.html`의 canonical·`og:url`·OG/Twitter 이미지 절대 주소를 함께 바꿉니다.
5. OG 이미지를 교체한 뒤에는 공유 서비스의 미리보기 디버거에서 재수집을 요청하고, 호스팅/CDN의 이미지 캐시도 갱신합니다. 플랫폼별 캐시가 남으면 새 이미지 경로를 사용하고 메타 주소도 함께 변경합니다.
6. 모바일·키보드·모션 줄이기, 링크 유입 값 전달, 영상의 화면 밖·탭 숨김 정지를 확인합니다.

이 저장소는 데이터베이스 연결 없이 동작합니다. 과거 데이터베이스 마이그레이션은 이력 보존용이며 랜딩 빌드나 배포에서 실행하지 않습니다.
