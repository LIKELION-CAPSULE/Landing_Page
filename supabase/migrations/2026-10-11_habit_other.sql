-- landing_preorder.habit_other 추가 (2026-10-11)
--
-- 프론트가 공부 방식에 '기타' 를 고르면 자유 서술 칸(habitOther, 최대 100자)이 열리게 바뀌었다
-- (LIKELION-CAPSULE/Landing_Page #13). 그 값을 담을 컬럼. 2026-10-10 마이그레이션을 이미
-- 실행한 DB 에 이 파일만 추가로 실행하면 된다.

alter table landing_preorder
    add column if not exists habit_other text check (char_length(habit_other) <= 100);

comment on column landing_preorder.habit_other is
    '공부 방식 "기타" 자유 서술. 프론트 HABIT_OTHER_LIMIT(100) 와 같은 상한.';
