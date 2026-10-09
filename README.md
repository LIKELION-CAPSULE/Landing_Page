# Landing_Page
랜딩페이지 (React + TypeScript + Vite)

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입 체크 + 프로덕션 빌드 (dist/)
npm run lint     # oxlint
```

## 구조

- `src/components/` — 섹션별 컴포넌트 (Hero, Problem, Steps, Rooms, Notice, Footer)
- `src/hooks/` — 스크롤 리빌, 히어로 전환 폴백
- `src/assets/` — Figma에서 export한 이미지 (`scripts/download-figma-assets.sh`)
- `src/styles.css` — 전역 스타일 (402px 디자인 프레임 기준 `--u` 스케일)
