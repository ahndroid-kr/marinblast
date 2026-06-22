# 마린 블라스트 (Marine Blast)

섹시파리디우스 톤의 수중 횡스크롤 슈팅 게임. 1스테이지 프로토타입.

## 현재 구현된 것 (1스테이지 프로토타입)

- 320×240 픽셀 캔버스, 정수배 확대 렌더
- 고정 timestep(60Hz) 게임 루프
- 키보드(WASD/방향키 + Z/Space) + 터치 드래그 입력
- 플레이어 이동·발사·옵션 동반 발사
- 오브젝트 풀링 (탄/적/적탄/파티클/불가사리/옵션)
- 지형 충돌 (천장/바닥 키프레임 + 선형보간)
- 3레이어 패럴렉스 배경 (빛줄기 / 광점 / 실루엣 물고기)
- 잡몹 3종: 멸치(anchovy) / 새우(shrimp) / 고등어(mackerel)
  - 모두 임시 도형. 게임플레이 굳힌 뒤 스프라이트로 교체
- **파로디우스식 불가사리 파워업** — 색 사이클 + 5가지 효과
  - 분홍: 1000점
  - 빨강: 메인 샷 강화 (3방향)
  - 노랑: 옵션(미니 동료) +1, 최대 2개
  - 파랑: 5초 무적
  - 초록: 화면 폭격
- 80초간 스폰 타임라인 → 클리어 (보스 자리는 placeholder)
- Supabase 랭킹 (전역, 최종 점수) — 미연결 시 localStorage 폴백

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속.

## Supabase 설정

`.env.example` → `.env.local`로 복사 후 본인 프로젝트 값 입력:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Supabase 대시보드에서 다음 SQL 실행:

```sql
create table marine_blast_scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 12),
  score integer not null check (score >= 0),
  created_at timestamptz default now()
);

create index on marine_blast_scores (score desc);

-- RLS
alter table marine_blast_scores enable row level security;

-- 누구나 읽기
create policy "read scores" on marine_blast_scores
  for select using (true);

-- 누구나 쓰기 (anon key로 등록 가능)
create policy "insert scores" on marine_blast_scores
  for insert with check (
    char_length(name) between 1 and 12
    and score >= 0
    and score <= 9999999
  );
```

치팅 방어가 더 필요해지면 나중에 Edge Function으로 서명 검증을 붙일 수 있음.

## 빌드 & 배포

```bash
npm run build
# dist/ 디렉토리를 GitHub Pages / Netlify로 업로드
```

GitHub Pages 서브경로(`/repo-name/`)로 배포할 경우 `vite.config.js`의 `base` 값을 `'/repo-name/'`으로 변경.

## 폴더 구조

```
src/
├── main.js           # 진입점, 루프, 씬 전환, 리더보드 UI
├── config.js         # 모든 상수
├── input.js          # 키보드 + 터치
├── pool.js           # 오브젝트 풀
├── terrain.js        # 지형 (천장/바닥)
├── parallax.js       # 배경 3레이어
├── leaderboard.js    # Supabase + localStorage 폴백
├── entities/
│   ├── player.js     # 플레이어 + 발사 로직
│   ├── bullet.js     # 플레이어/적 공용 탄
│   ├── enemy.js      # 멸치/새우/고등어
│   ├── powerup.js    # 불가사리 (색 사이클)
│   ├── option.js     # 옵션 (과거 좌표 추적)
│   └── particle.js   # 폭발 파티클
├── stages/
│   └── stage1.js     # 지형 키프레임 + 스폰 타임라인
└── scenes/
    ├── title.js
    └── game.js       # 메인 게임 루프 (충돌·점수·효과)
```

## 다음 단계 (우선순위 순)

1. **보스 문어** — 부위파괴(다리 8개), 페이즈 2단계, 먹물탄
2. **스프라이트 교체** — itch.io/OpenGameArt의 16비트 수중 픽셀아트 또는 직접
3. **사운드** — Web Audio + AudioBuffer 풀, BGM + SFX
4. **2·3스테이지** — 같은 시스템에 데이터 추가
5. **밸런싱** — 난이도 곡선 튜닝
6. **모바일 최적화** — 화면 작을 때 HUD 가독성 점검

## 디자인 노트

- 플레이어 히트박스(3px)는 의도적으로 그려진 비행기보다 훨씬 작음. 슈팅 장르 관례.
- 적은 화면 오른쪽 밖(`x = W + 10`)에서 등장, 왼쪽으로 흘러감.
- 카메라 자동 스크롤은 `STAGE1.scrollSpeed`로 제어. 보스전 진입 시 0으로 설정 예정.
- 불가사리 색 사이클은 1초 주기. 너무 빠르면 운, 너무 느리면 답답. 플레이테스트 후 조정.
- 충돌 광역 단계(grid broad-phase)는 아직 미구현. 1스테이지 정도면 brute-force로 충분하지만, 보스전 탄막에서 병목이 보이면 추가.
