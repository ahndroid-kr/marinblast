# GitHub Pages 배포 가이드

## 자동 배포 (권장)

`.github/workflows/deploy.yml`이 이미 들어 있어서 푸시하면 자동으로 빌드·배포됩니다.

### 1단계 — 저장소 만들고 푸시

```bash
cd marine-blast
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 2단계 — vite.config.js의 base 경로 수정

저장소 이름이 `marine-blast`라면:

```js
// vite.config.js
export default defineConfig({
  base: '/marine-blast/',   // 여기를 저장소 이름으로
  ...
});
```

수정 후 커밋·푸시.

> **사용자 사이트(`USERNAME.github.io` 저장소)로 배포하는 경우**는 `base: '/'` 그대로.

### 3단계 — GitHub Pages 활성화

저장소 페이지에서:
1. **Settings → Pages** 이동
2. **Source: GitHub Actions** 선택 (Deploy from branch 아님)

### 4단계 — Supabase 시크릿 등록 (랭킹 쓸 경우만)

저장소에서:
1. **Settings → Secrets and variables → Actions**
2. **New repository secret**로 두 개 등록:
   - `VITE_SUPABASE_URL` = `https://xxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJ...`

> 시크릿을 안 넣어도 빌드는 됩니다. 다만 랭킹이 localStorage 폴백으로 동작 (디바이스 한정).

### 5단계 — 확인

푸시 후 **Actions** 탭에서 빌드 진행상황 확인. 2~3분 후 `https://USERNAME.github.io/REPO_NAME/`에서 접속.

---

## 수동 배포 (간단하지만 매번 빌드 필요)

GitHub Actions 안 쓰고 빌드 결과물만 올리는 방식.

```bash
# 로컬에서 빌드
npm install
npm run build
# dist/ 폴더 생성됨

# dist 내용을 gh-pages 브랜치로 푸시
cd dist
git init
git add .
git commit -m "deploy"
git branch -M gh-pages
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -f origin gh-pages
```

저장소 **Settings → Pages**에서 **Source: Deploy from branch → gh-pages / root** 선택.

이 방식은 매번 빌드하고 푸시해야 해서 불편합니다. 한두 번 테스트 용도면 OK.

---

## 흔한 문제

**404 또는 흰 화면**: `vite.config.js`의 `base` 경로가 저장소 이름과 안 맞음. `/REPO_NAME/`로 정확히.

**랭킹이 로컬 폴백으로만 동작**: 시크릿 미등록. Actions 탭에서 빌드 로그 확인.

**Actions 실패 - "pages site not enabled"**: Settings → Pages에서 Source를 "GitHub Actions"로 먼저 바꿔야 함.

**빌드는 됐는데 게임이 안 뜸**: 브라우저 콘솔(F12) 확인. asset 경로 404면 base 경로 문제.
