# CAPSULE 랜딩 페이지

노트북 앞의 시간을 AI 메이트와 영상통화하듯 함께 보내는 캡슐의 웹 베타 소개 페이지입니다.

## 섹션 구성

| 섹션 | 내용 |
| --- | --- |
| S1 · 히어로 | 채린과 연결된 통화 화면, 앱 시작·PC 링크 공유 |
| S2 · 대비 | 같은 대사를 글로 읽는 경험과 얼굴·표정으로 보는 경험 |
| S3 · 직접 말 걸기 | 빠른 답장 네 가지에 반응하는 영상 데모 |
| S4 · 반응하는 순간들 | 목소리 응답, 자리 비움 감지, 작업 옆 PIP 예시 |
| S5 · 이어지는 관계 | 함께한 시간에 따라 열리는 표정과 에피소드 |
| S6 · 메이트 소개 | 강채린 소개와 다음 메이트 예고 |
| S7 · 베타 안내 | 일정, 시작 방법, 안심 포인트와 앱 연결 |
| S8 · 푸터 | 문의, 이용 약관, 개인정보처리방침 |

페이지는 `/` 하나입니다. 이전 주소로 방문하면 방문 유입 쿼리를 유지하면서 `/`로 대체 이동합니다. 데모 대사는 미리 정해진 예시이며 실제 서비스에서는 AI가 대화를 이어갑니다. 랜딩 데모는 카메라·마이크를 사용하지 않습니다.

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
npm run build
npm run lint
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. 환경변수는 빌드 시 반영되므로 바꾸면 다시 빌드해야 합니다.

## 환경변수

| 변수 | 설명 |
| --- | --- |
| `VITE_APP_URL` | 앱 로그인 주소. 비어 있으면 `https://capsule-front-web.vercel.app/login` |
| `VITE_MIXPANEL_TOKEN` | 공개 프로젝트 토큰. 비어 있으면 분석 호출 없음 |
| `VITE_MIXPANEL_API_HOST` | 선택 설정. Mixpanel 프로젝트 지역에 맞는 API 주소. 비어 있으면 SDK 기본 주소 |

`VITE_` 값은 공개 번들에 포함되므로 비밀 키를 넣지 않습니다. 앱 링크에는 현재 URL의 `utm_*`와 `ref`가 전달됩니다.

2026년 12월 1일 00:00 KST 전에는 PC 시작 버튼이 오픈 일정을 표시합니다. 이후에는 앱으로 연결합니다. 휴대폰에서는 공유 또는 링크 복사를 제공합니다. 로컬 확인용 `?cta=before`와 `?cta=open`으로 상태를 전환할 수 있습니다.

Mixpanel은 페이지 방문, 지정한 버튼·데모 이벤트를 수집합니다. 세션 재현 비율은 100%이며 입력값 가림과 영상·오디오 차단을 설정합니다. 설정 코드는 `src/lib/analytics.ts`, 약관 원문은 `src/data/legal/`에 있습니다. 원문 상단의 법적 검토용 주석은 화면에 표시하지 않습니다. 법적 검토 및 미정 항목 확정은 공개 운영 전에 필요합니다.

## 에셋과 글꼴 출처

- 채린: Aliving2D로 만든 영상·이미지 렌더만 `src/assets/mates/chaerin/`에 포함합니다. 원본 캐릭터 모델·파츠·렌더 엔진은 포함하지 않습니다.
- 통화 배경·바탕화면·로고: CAPSULE 앱의 배경과 브랜드 로고 v2 에셋을 사용합니다. 각 에셋의 권리는 해당 권리자에게 있습니다.
- Pretendard 기반 Capsule UI: 자체 호스팅 서브셋. 라이선스는 `public/fonts/LICENSE.txt`.
- Hahmlet 기반 Capsule Story: 포인트 문구용 WOFF2 서브셋으로 별도 이름을 사용합니다. SIL OFL 1.1은 `public/fonts/Hahmlet-OFL.txt`. 원본 TTF는 배포하지 않습니다.
- OG 이미지: 히어로 가로 포스터·화이트 로고 v2·페이지 제목을 HTML로 합성한 `public/images/capsule-og.jpg`(1200×630).

글꼴 관련 스크립트는 `scripts/subset-font.py`, `scripts/subset-story-font.py`입니다. 포인트 문구 목록은 `scripts/story-font-text.txt`에서 관리합니다.

## 배포

1. `npm ci` 후 `npm run build`를 실행하고 `dist/`를 정적 호스팅합니다.
2. 기존 주소에서도 앱이 실행되도록 알 수 없는 경로를 `/index.html`로 보내는 SPA fallback을 설정합니다. 예: Vercel의 rewrite 규칙. JS·CSS·이미지·영상 파일 요청은 실제 파일로 제공해야 합니다.
3. `VITE_APP_URL`과 분석 프로젝트 지역을 배포 환경에 맞춥니다. 현재 canonical·`og:url`의 도메인은 도메인 확정 전 값을 유지하고 있습니다.
4. 도메인을 확정하면 `index.html`의 canonical·`og:url`·OG/Twitter 이미지 절대 주소를 함께 확인합니다.
5. OG 이미지를 교체한 뒤에는 공유 서비스의 미리보기 디버거에서 재수집을 요청하고, 호스팅/CDN의 이미지 캐시도 갱신합니다. 플랫폼별 캐시가 남으면 새 이미지 경로를 사용하고 메타 주소도 함께 변경합니다.
6. 모바일·키보드·모션 줄이기, 링크 유입 값 전달, 영상의 화면 밖·탭 숨김 정지를 확인합니다.

이 저장소는 데이터베이스 연결 없이 동작합니다. 과거 데이터베이스 마이그레이션은 이력 보존용이며 랜딩 빌드나 배포에서 실행하지 않습니다.
