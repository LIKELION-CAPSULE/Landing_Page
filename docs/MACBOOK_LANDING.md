MacBook 스크롤 Hero는 메인 /에서 제공합니다. 적용을 완료한 뒤 /test 페이지와 테스트 전용 UI를 폐기했습니다. 기존 /test 주소로 접근하면 history.replaceState로 /에 연결하며, 별도의 실험 페이지를 로드하지 않습니다. Hero 아래의 Problem → Steps → Rooms → Notice → Footer와 스터디룸 이동은 기존 컴포넌트를 유지합니다.

실행:

~~~sh
cd Landing_Page
npm run dev
~~~

메인 주소 http://localhost:5173/에서 맥북 Hero를 볼 수 있습니다. 디버그 패널과 일시정지·초기화 제어는 제거했으며, debug 쿼리로 활성화할 수 없습니다. 메인의 페이지 제목과 스크롤 안내 CTA 이벤트를 유지합니다.

1. 현재 연출

기존 어두운 배경과 보라색 그라데이션, 실제 CAPSULE 로고 이미지, 원래 글꼴과 문구를 사용합니다. Canvas는 투명하므로 원래 배경이 그대로 보입니다.

- 로고가 먼저 나타나고, 완료 후 “오늘도 혼자 공부해?”가 한글 글자 단위로 타이핑됩니다. 이어 “나랑 같이 하자.”가 보라색으로 타이핑됩니다.
- 타이핑이 완료된 두 줄 문구는 맥북이 열리는 동안과 완전히 열린 뒤에도 같은 위치에서 계속 보입니다. 다음 섹션으로 넘어갈 때 Hero와 함께 자연스럽게 올라갑니다.
- 타이핑이 끝난 뒤 닫힌 MacBook이 정면으로 나타납니다. 하판 위치와 전체 모델의 자세, 카메라 구도는 처음부터 끝까지 고정됩니다.
- 첫 문구와 모델은 원래 배치보다 48 디자인 px 아래에 있습니다. 높이 700px 이하에서는 24 디자인 px로 줄입니다.
- 스크롤 안내가 모델 다음에 나타납니다. “실제 스터디룸 화면…” 캡션과 “딴짓하면 고개를 드는 AI 캐릭터와…” 보조 문구는 이때 숨기고, 레이아웃 공간은 유지합니다.
- 스크롤 6–78%에서 상판만 서서히 열려 최대 90도에 도달합니다. 본체 회전·낙하·좌우 이동은 사용하지 않습니다.
- 64–86%에서 검은 화면에 서비스 프리뷰가 나타납니다.
- 열린 화면과 하판까지 들어오는 정면 구도를 처음부터 사용하며, 별도의 카메라 확대나 시점 회전은 없습니다.
- 90–100%에서 캡션 → 보조 문구가 나타납니다. 별도 전체 화면 DOM 완료 장면은 현재 사용하지 않습니다.
- 다음 섹션이 들어오기 전에 맥북 타임라인이 완료됩니다. 맥북의 정면 화면을 잠시 유지한 뒤, 맥북과 문구가 위로 올라가면서 “혹시 이런 순간, 익숙하신가요?” 제목이 이어집니다.
- Hero 끝에는 추가 스크롤 구간을 넣어 완전히 열린 맥북과 문구에 한 박자 머무릅니다. 추가 길이는 데스크톱 320px, 모바일 240px, 높이 700px 이하 200px입니다. 이 구간을 지나면 기존 간격으로 다음 섹션에 이어집니다. 휠·터치 스크롤은 계속 작동하고, 위로 올릴 때도 같은 구간을 거칩니다.
- 마우스에 따른 모델 기울임은 제거했습니다. 터치에서는 세로 스크롤을 유지합니다.
- 위로 스크롤하면 같은 연출이 역순으로 진행됩니다.

기존 보조 문구, 프리뷰 캡션과 스크롤 안내를 유지합니다. 캡션·보조 문구는 화면이 90도로 열린 뒤 마지막 정면 구도에서만 보이며, 위로 스크롤하면 다시 사라집니다. Hero 다음에는 원래 랜딩페이지 본문이 이어집니다. 두 섹션 사이의 빈 공간을 줄이고, 보라색 배경이 다음 섹션의 배경으로 부드럽게 이어지도록 겹침 구간에 그라데이션을 적용했습니다.

2. 조정할 파일

| 파일 | 역할 |
| --- | --- |
| src/pages/LandingPage.tsx | 메인에서 맥북 랜딩페이지 지연 로딩 |
| src/pages/MacbookLandingPage.tsx | Hero 브랜딩, 3D 장면, 원본 랜딩페이지 본문 조합 |
| src/components/macbook/MacbookHeroTitle.tsx | 두 줄 타이핑 |
| src/components/macbook/useMacbookIntro.ts | 로고·타이핑·모델 이후 안내 순차 등장 |
| src/components/macbook/MacbookAnimation.tsx | 정면 고정 구도, 스크롤에 따른 상판 열림과 화면 켜짐 |
| src/components/macbook/macbook-config.ts | 정면 구도, 열림 각도와 스크롤 구간 |
| src/components/macbook/MacbookModel.tsx | GLB 인스턴스와 화면 Material·Texture |
| src/components/macbook/MacbookScene.tsx | 투명 Canvas, 조명, 로딩 오류 처리 |
| src/styles/macbook-landing.css | 맥북 Hero와 본문 연결에 한정된 스타일 |
| public/models/macbook_web_ready.glb | 원본과 바이트가 같은 모델 복사본 |
| public/images/website-preview.webp | 서비스 화면 프리뷰 |
| scripts/verify-macbook-landing.mjs | 실제 브라우저 검증 |
| docs/macbook-landing-browser-report.json | 개발 서버 동작 검증 결과 |
| docs/macbook-display-quality-report.json | 고밀도 화면의 DPR·텍스처 필터링·유휴 렌더링 검증 결과 (90도 제한 전) |
| docs/macbook-landing-production-report.json | 메인 적용 후 프로덕션 프리뷰 검증 결과 |

테스트 페이지·디버그 패널·이전 DOM 전환 실험 컴포넌트와 관련 스타일을 제거했습니다. 스타일과 브라우저 검증 스크립트·보고서도 랜딩페이지 이름으로 정리했습니다.

MACBOOK_TIMING의 시작점·길이는 0–1의 스크롤 진행률입니다. openStart/Duration은 상판 열림 구간, screenStart/Duration은 화면 켜짐 구간, copyStart/Stagger/Duration은 마지막 문구의 등장 구간입니다. scrub은 0.45초입니다. 상판은 Lid_Hinge.rotation.x 하나로 닫힘 0에서 최대 열림 -Math.PI / 2 (-1.570796327 라디안, 90도)까지 제어합니다. 카메라 구도와 모션 줄이기의 정적인 열림 상태도 같은 최대 각도를 사용합니다.

전체 길이는 CSS의 .macbook-landing__scroll height: calc(360svh + var(--macbook-exit-hold))로 조정합니다. 360svh는 기존 열림 구간이며, --macbook-exit-hold는 완성된 Hero를 더 유지하는 구간입니다. 이 변수는 px 단위로 설정합니다. 타이핑 속도는 MacbookHeroTitle.tsx의 70ms, 줄 사이 대기는 320ms입니다. 로고 등장 완료 후 100ms를 기다려 타이핑을 시작합니다. useMacbookIntro.ts는 실제 화면 Y 위치로 초기 요소를 정렬합니다. 캡션·보조 문구는 data-landing-item으로 별도 제어합니다. MACBOOK_FRONT_VIEW의 widthRatio=0.96이 모델의 폭이며, 모델용 레이아웃 폭을 기준으로 합니다. 완전히 열린 화면의 위치와 카메라에 더 가까운 하판까지 고려하여 구도를 한 번 계산합니다. FOV=22로 원근감을 줄이고, 스크롤 중 카메라 위치·방향·FOV는 유지합니다. 뷰포트 크기가 바뀌면 구도를 다시 계산합니다.

macbook-landing.css의 --macbook-content-offset이 첫 문구·모델과 아래 문구의 위치를 조정합니다. --macbook-story-overlap은 160 디자인 px에서 이 이동량을 빼서 다음 제목과의 간격을 유지하며, 뷰포트가 원래 Hero보다 높은 경우 추가 빈 공간도 줄입니다. 다음 섹션의 제목·그림·컴포넌트는 수정하지 않습니다. ScrollTrigger는 추가 유지 구간에 들어오기 전에 끝나므로 기존 열림 속도는 유지됩니다. CSS sticky가 해제될 때까지 마지막 자세와 문구를 유지합니다. 높이가 짧은 뷰포트에서는 장면의 실제 높이를 기준으로 하여, 고정이 풀리기 전에 맥북 연출을 완료합니다. 모션 줄이기 설정에서는 추가 유지 구간을 생략합니다.

모델 전체 회전은 X=0, Y=0, Z=0으로 고정합니다. 하판 경계상자의 최저 높이를 기준으로 수평 위치를 한 번 설정하고, 카메라는 +Z 방향에서 수평으로 바라봅니다. 하판과 모델 전체 Transform에는 스크롤 Tween을 적용하지 않습니다.

3. 서비스 이미지 교체

public/images/website-preview.webp를 원하는 이미지로 바꿉니다. 현재 이미지는 기존 스터디룸 이미지에서 화면만 가져온 1360×880 프리뷰이며, 화면 비율은 약 1.545:1입니다.

원본 src/assets/hero/study-room-preview.webp는 3880×2400이며 노트북 테두리를 포함합니다. 화면용 복사본은 처음에 용량을 줄이기 위해 축소했습니다. 현재 3D 화면의 표시 폭은 약 300–350 CSS px이므로 DPR 2에서도 1360px 텍스처를 추가 확대하지 않고 사용할 수 있습니다. 이번 선명도 개선은 이미지 재압축 없이 Canvas 해상도와 텍스처 샘플링 설정을 조정했습니다.

Screen_Display에 전용 MeshBasicMaterial을 사용합니다. Texture는 flipY=false와 SRGBColorSpace, Material은 toneMapped=false입니다. 검정에서 흰색으로 Material 색상을 바꿔 서비스 화면이 켜지게 합니다. 실제 서비스 DOM이나 네트워크 화면을 모델에 직접 연결한 상태는 아닙니다.

4. 기존 프로젝트 보존

LandingPage.tsx에서 MacbookLandingPage를 지연 로딩하여 메인 Hero를 적용합니다. App.tsx와 useRoute.ts에서는 /test 분기와 경로 상수만 제거하고, 폐기된 주소를 /로 정리합니다. 본문 컴포넌트, 전역 styles.css·font.css와 원본 GLB는 변경하지 않았습니다. 기존 본문의 useReveal·useStepBackground와 스터디룸 버튼을 재사용하며, 방 선택·투표·사전예약 흐름은 기존 App이 관리합니다. 기존 정적 Hero.tsx는 보존하지만 현재 메인에는 렌더링하지 않습니다. 3D 코드는 랜딩페이지를 방문할 때만 불러오며, /rooms를 직접 방문하면 불러오지 않습니다.

5. 성능과 접근성

- useGLTF/useTexture 캐시로 원본을 한 번 로드하고, 모델 인스턴스의 변환만 조작합니다.
- 화면용 Material·Texture는 unmount 시 dispose합니다.
- demand 렌더링과 GSAP invalidate를 사용합니다. 유휴 상태에서 WebGL draw call은 증가하지 않습니다.
- DPR 상한은 데스크톱·모바일 모두 2입니다. 기존 1.5·1.25 상한에서 높여 고밀도 화면의 글자와 이미지 선명도를 개선했습니다. 모델 가장자리 품질을 위해 MSAA를 사용합니다. 디스플레이 텍스처에는 기기 지원 범위 내 최대 8배 anisotropy를 적용하여 상판이 기울어진 상태에서도 샘플링 품질을 유지합니다.
- 모델 그림자는 사용하지 않습니다. Shadow Map, 그림자 수광용 바닥 Mesh와 castShadow를 제거했습니다. 모바일 Environment는 64이고 환경광은 한 번 생성합니다.
- 모델 상태는 약 10Hz로 갱신하며, 디버그 UI는 렌더링하지 않습니다.
- ScrollTrigger, 타이핑 타이머와 등장 Tween을 정리합니다.
- prefers-reduced-motion에서는 타이핑과 상판 열림 애니메이션을 생략하고, 열린 모델과 서비스 화면을 정적으로 표시합니다.
- 제목의 접근성 이름은 처음부터 전체 문구이며, 부분 타이핑을 반복해서 읽지 않습니다.

6. 검증

npm run build로 TypeScript와 프로덕션 빌드를 확인했습니다. 개발 서버의 Chrome에서 제목 글꼴·문구·본문 레이아웃, 타이핑 후 등장, 문구·모델의 낮아진 배치, 정면 고정 상태의 닫힘→90° 열림과 서비스 프리뷰, 마우스 이동 전후 화면 일치, 마지막 문구 등장, 다음 제목으로 연결되는 간격과 마지막 자세 유지, 역방향 스크롤 시 상판 닫힘과 문구 숨김, 스터디룸 이동, unmount, 모바일 뷰포트와 모션 줄이기를 확인했습니다. 브라우저 오류는 없었고, THREE.Clock 사용 중단 예정 및 글꼴 preload 경고는 남습니다. 결과는 docs/macbook-landing-browser-report.json에 기록했습니다.

메인 적용 시 /의 최신 logo-lockup.png와 로고 레이아웃을 유지했습니다. 브라우저 검증은 /의 실제 타이핑·열림·화면 표시·역스크롤·본문 연결과 /test?debug=1 접근 시 / 연결, /rooms 이동 시 Canvas 제거와 뒤로가기 복귀를 확인합니다.

Hero 끝의 유지 구간에서는 실제 휠 입력으로 스크롤 위치가 변해도 장면의 top=0, 힌지=90°, 제목 opacity=1이 유지되는지 확인했습니다. 데스크톱·모바일·짧은 모바일 뷰포트에서 모두 통과했고, 이후 다음 제목과의 간격과 역방향 스크롤, 모션 줄이기 설정도 확인했습니다.

선명도 조정 후에는 DPR 2 데스크톱과 DPR 3 모바일 뷰포트에서 Canvas의 실제 DPR=2, 디스플레이 텍스처의 anisotropy=8을 확인했습니다. 모바일 Canvas 가로 해상도는 487px에서 780px로 증가했습니다. 이전·이후 캡처에서 화면 내 글자와 이미지가 더 선명해졌고, 유휴 상태의 draw call 증가와 브라우저 오류는 없었습니다. 품질 검증 결과는 docs/macbook-display-quality-report.json에 기록했습니다.

테스트 페이지 제거 후 빌드 결과를 임시 로컬 프리뷰 서버에서도 확인했습니다. 데스크톱·모바일에서 JavaScript·CSS와 GLB가 정상 로드되고, 90도 정면 화면과 마지막 문구, DPR 2, 메인 페이지 제목이 유지됩니다. /?debug=1에도 디버그 패널이 없으며, /rooms를 직접 방문하면 3D 청크와 GLB를 불러오지 않습니다. /test?debug=1 접근 시 /로 연결되며 테스트 청크가 없는 것도 확인했습니다. 브라우저 오류는 없었습니다. 결과는 docs/macbook-landing-production-report.json에 기록했습니다.

~~~sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/verify-macbook-landing.mjs
~~~

MACBOOK_URL, MACBOOK_QA_DIR, CHROME_EXECUTABLE로 주소·출력 폴더·Chrome 실행 파일을 바꿀 수 있습니다. 브라우저 검증에는 기존에 설치된 Playwright를 사용하고 프로젝트 의존성에는 추가하지 않았습니다. 검증 브라우저에서만 Mixpanel 요청에 가짜 성공 응답을 반환하여 외부 통계 서비스 상태와 검증용 트래픽을 분리합니다. 실제 페이지의 통계 수집 코드는 변경하지 않습니다.

3D와 랜딩페이지의 청크는 minify 약 1.18MB, gzip 약 339KB로 Vite 크기 경고가 남습니다. 폐기된 테스트 페이지 청크는 생성하지 않습니다. 실제 저사양 휴대폰의 성능과 Safari는 아직 검증하지 않았습니다.
