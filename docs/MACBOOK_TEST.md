/test는 기존 랜딩페이지의 Hero에 MacBook 스크롤 인터랙션을 적용한 실험 페이지입니다. 기존 / 페이지와 그 아래 Problem → Steps → Rooms → Notice → Footer는 그대로 유지합니다.

실행:

~~~sh
cd Landing_Page
npm run dev
~~~

Vite의 주소에 /test를 붙입니다. 기본 주소는 http://localhost:5173/test입니다. 디버그 패널은 /test?debug=1에서만 나타납니다.

1. 현재 연출

기존 어두운 배경과 보라색 그라데이션, 실제 CAPSULE 로고 이미지, 원래 글꼴과 문구를 사용합니다. Canvas는 투명하므로 원래 배경이 그대로 보입니다.

- 로고가 먼저 나타나고, 완료 후 “오늘도 혼자 공부해?”가 한글 글자 단위로 타이핑됩니다. 이어 “나랑 같이 하자.”가 보라색으로 타이핑됩니다.
- 타이핑이 끝난 뒤 닫힌 MacBook의 상판·하판 사이 앞쪽 틈이 정면으로 나타납니다. 초기 시점에서는 맥북을 수평으로 놓고 틈의 높이에서 바라보며, 마우스에 의해 기울어지지 않습니다.
- 첫 문구와 모델은 원래 배치보다 48 디자인 px 아래에 있습니다. 높이 700px 이하에서는 24 디자인 px로 줄입니다.
- 스크롤 안내가 모델 다음에 나타납니다. “실제 스터디룸 화면…” 캡션과 “딴짓하면 고개를 드는 AI 캐릭터와…” 보조 문구는 이때 숨기고, 레이아웃 공간은 유지합니다.
- 스크롤 4–18%에서 왼쪽으로 살짝 이동하며 회전을 준비합니다.
- 18–54%에서 맥북이 Y축을 중심으로 좌우 한 바퀴 회전합니다. X·Z축은 작은 기울임만 사용합니다. 높이는 최대 95mm로 줄이고, 회전 중에는 95→55mm로 천천히 내려옵니다.
- 54–78%에서 남은 55mm를 부드럽게 내려놓고, 55–81%에서 상판이 110도로 열립니다.
- 73–89%에서 검은 화면에 서비스 프리뷰가 나타납니다.
- 78–90%에서 맥북의 기울기를 정리하고, 카메라가 디스플레이의 월드 위치와 앞쪽 방향을 따라 정면으로 가까이 이동합니다. 마지막에는 열린 MacBook을 정면에서 크게 보여 줍니다.
- 90–100%에서 캡션 → 보조 문구가 나타납니다. 별도 전체 화면 DOM 완료 장면은 현재 사용하지 않습니다.
- 다음 섹션의 위쪽이 맥북 장면의 아래에 닿으면 맥북 타임라인이 완료됩니다. 맥북의 정면 화면을 잠시 유지한 뒤, 맥북과 문구가 위로 올라가면서 “혹시 이런 순간, 익숙하신가요?” 제목이 이어집니다.
- 마우스를 움직이면 모델이 작은 각도로 반응합니다. 터치에서는 세로 스크롤을 유지합니다.
- 위로 스크롤하면 같은 연출이 역순으로 진행됩니다.

기존 보조 문구, 프리뷰 캡션과 스크롤 안내를 유지합니다. 캡션·보조 문구는 화면이 110도로 열린 뒤 마지막 정면 구도에서만 보이며, 위로 스크롤하면 다시 사라집니다. Hero 다음에는 원래 랜딩페이지 본문이 이어집니다. /test에서만 두 섹션 사이의 빈 공간을 줄이고, 보라색 배경이 다음 섹션의 배경으로 부드럽게 이어지도록 겹침 구간에 그라데이션을 적용했습니다.

2. 조정할 파일

| 파일 | 역할 |
| --- | --- |
| src/pages/MacbookTestPage.tsx | 기존 Hero 브랜딩, 3D 장면, 원본 랜딩페이지 본문 조합 |
| src/components/macbook/MacbookHeroTitle.tsx | 두 줄 타이핑과 초기화 |
| src/components/macbook/useMacbookIntro.ts | 로고·타이핑·모델 이후 안내 순차 등장 |
| src/components/macbook/MacbookAnimation.tsx | 스크롤 타임라인, 공중 이동·회전·착지·마우스 반응 |
| src/components/macbook/macbook-config.ts | 초기 높이·각도, 착지 각도, 열림 각도와 구간 |
| src/components/macbook/MacbookModel.tsx | GLB 인스턴스와 화면 Material·Texture |
| src/components/macbook/MacbookScene.tsx | 투명 Canvas, 조명, 로딩 오류 처리 |
| src/components/macbook/MacbookDebugPanel.tsx | 선택적 디버그 패널 |
| src/styles/macbook-test.css | 기존 Hero를 사용하는 실험용 스타일 |
| public/models/macbook_web_ready.glb | 원본과 바이트가 같은 모델 복사본 |
| public/images/website-preview.webp | 서비스 화면 프리뷰 |
| scripts/verify-macbook-test.mjs | 실제 브라우저 검증 |
| docs/macbook-test-browser-report.json | 개발 서버 검증 결과 |
| docs/macbook-test-production-report.json | 이전 프로덕션 프리뷰 검증 결과 |

MacbookCompletionScreen.tsx는 이전 DOM 전환 실험의 컴포넌트이며 현재 페이지에는 렌더링하지 않습니다.

MACBOOK_INITIAL_POSE의 height는 공중 높이(m), rotationX/Y/Z는 초기 라디안 각도입니다. MACBOOK_SPIN_POSE가 좌우 회전이 끝나는 자세이고, MACBOOK_LANDED_POSE가 최종 정면 자세입니다. Y축 각도의 2π가 좌우 한 바퀴 회전이며, X축은 한 바퀴 돌리지 않습니다. MACBOOK_TIMING의 시작점·길이는 0–1의 스크롤 진행률입니다. framingStart/Duration은 최종 정면 확대 구간, copyStart/Stagger/Duration은 마지막 문구의 등장 구간입니다. scrub은 0.45초입니다.

전체 길이는 CSS의 .macbook-test__scroll height: 360svh로 조정합니다. 타이핑 속도는 MacbookHeroTitle.tsx의 70ms, 줄 사이 대기는 320ms입니다. 로고 등장 완료 후 100ms를 기다려 타이핑을 시작합니다. useMacbookIntro.ts는 실제 화면 Y 위치로 초기 요소를 정렬합니다. 캡션·보조 문구는 data-landing-item으로 별도 제어합니다. MACBOOK_FINAL_FRAMING의 widthRatio=0.96이 마지막 모델의 폭이며, 모델용 레이아웃 폭을 기준으로 합니다. 카메라에 더 가까운 하판까지 고려하여 거리를 계산합니다. 최종 FOV=22로 원근감을 줄이고, 마지막 정면 구도에서는 마우스 기울임을 멈춥니다.

macbook-test.css의 --macbook-content-offset이 첫 문구·모델과 아래 문구의 위치를 조정합니다. --macbook-story-overlap은 160 디자인 px에서 이 이동량을 빼서 다음 제목과의 간격을 유지하며, 뷰포트가 원래 Hero보다 높은 경우 추가 빈 공간도 줄입니다. 다음 섹션의 제목·그림·컴포넌트는 수정하지 않습니다. ScrollTrigger는 다음 본문의 시작이 장면의 아래에 닿을 때 끝나며, CSS sticky가 해제될 때까지 마지막 자세를 유지합니다. 높이가 짧은 뷰포트에서는 장면의 실제 높이를 기준으로 하여, 고정이 풀리기 전에 맥북 연출을 완료합니다.

초기 모델 자세는 X=0, Y=0, Z=0으로 닫힌 맥북을 수평으로 놓습니다. 카메라는 +Z 방향에서 닫힌 화면의 높이를 수평으로 바라보므로 상판·하판 사이 앞쪽 틈이 정면으로 보입니다. 회전 구간의 카메라 타깃 높이도 낮춰 위아래 이동을 줄였습니다. 마지막에 모델이 바닥에 놓이도록 회전한 하판 경계상자의 최저 높이를 사용합니다. 물리 엔진을 이용한 충돌 시뮬레이션은 아닙니다.

3. 서비스 이미지 교체

public/images/website-preview.webp를 원하는 이미지로 바꿉니다. 현재 이미지는 기존 스터디룸 이미지에서 화면만 가져온 1360×880 프리뷰이며, 화면 비율은 약 1.545:1입니다.

Screen_Display에 전용 MeshBasicMaterial을 사용합니다. Texture는 flipY=false와 SRGBColorSpace, Material은 toneMapped=false입니다. 검정에서 흰색으로 Material 색상을 바꿔 서비스 화면이 켜지게 합니다. 실제 서비스 DOM이나 네트워크 화면을 모델에 직접 연결한 상태는 아닙니다.

4. 기존 프로젝트 보존

기존 Hero.tsx, LandingPage.tsx, 본문 컴포넌트, 전역 styles.css·font.css와 원본 GLB는 변경하지 않았습니다. /test만 별도 지연 로딩합니다. 기존 본문의 useReveal·useStepBackground와 스터디룸 버튼을 재사용합니다.

5. 성능과 접근성

- useGLTF/useTexture 캐시로 원본을 한 번 로드하고, 모델 인스턴스의 변환만 조작합니다.
- 화면용 Material·Texture는 unmount 시 dispose합니다.
- demand 렌더링과 GSAP invalidate를 사용합니다. 유휴 상태에서 WebGL draw call은 증가하지 않습니다.
- DPR 상한은 데스크톱 1.5, 모바일 1.25입니다. 모델 가장자리 품질을 위해 MSAA를 사용합니다.
- 모델 그림자는 사용하지 않습니다. Shadow Map, 그림자 수광용 바닥 Mesh와 castShadow를 제거했습니다. 모바일 Environment는 64이고 환경광은 한 번 생성합니다.
- 디버그 React 상태는 약 10Hz로 갱신합니다.
- ScrollTrigger, 타이핑 타이머, 등장 Tween과 포인터 이벤트를 정리합니다.
- prefers-reduced-motion에서는 타이핑과 회전·낙하를 생략하고, 열린 모델과 서비스 화면을 정적으로 표시합니다.
- 제목의 접근성 이름은 처음부터 전체 문구이며, 부분 타이핑을 반복해서 읽지 않습니다.

6. 검증

npm run build로 TypeScript와 프로덕션 빌드를 확인했습니다. 이번 변경은 개발 서버의 Chrome에서 기존 로고·제목 글꼴·문구·본문 레이아웃 일치, 타이핑 후 등장, 문구·모델의 낮아진 배치, 닫힘·좌우 한 바퀴 회전·부드러운 착지·110° 열림·서비스 프리뷰, 마지막 정면 확대와 문구 등장, 다음 제목으로 연결되는 간격과 마지막 자세 유지, 역방향 스크롤 시 문구 숨김, 디버그 일시정지·재개·초기화, 스터디룸 이동, unmount, 모바일 뷰포트와 모션 줄이기를 확인했습니다. 브라우저 오류와 콘솔 경고는 없었습니다.

~~~sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/verify-macbook-test.mjs
~~~

MACBOOK_TEST_URL, MACBOOK_QA_DIR, CHROME_EXECUTABLE로 주소·출력 폴더·Chrome 실행 파일을 바꿀 수 있습니다. 브라우저 검증에는 기존에 설치된 Playwright를 사용하고 프로젝트 의존성에는 추가하지 않았습니다.

3D 전용 청크는 minify 약 1.14MB, gzip 약 327KB로 Vite 크기 경고가 남습니다. 기존 /에서는 다운로드하지 않습니다. 실제 저사양 휴대폰의 성능과 Safari는 아직 검증하지 않았습니다.
