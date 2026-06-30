# GitHub Pages 배포 가이드

배포 URL: `https://hyukjuns.github.io/todo-app/`

---

## 1. GitHub에서 todo-app 저장소 생성

1. [https://github.com/new](https://github.com/new) 접속
2. 아래와 같이 입력:
   - **Repository name**: `todo-app`
   - **Visibility**: Public
   - **Initialize this repository with**: 아무것도 체크하지 않음 (README, .gitignore 등 추가 X)
3. **Create repository** 클릭

---

## 2. 현재 서브디렉토리를 새 저장소로 Push

현재 프로젝트는 `etevers-vibecoding-2026-1st` 저장소 안에 있으므로,  
`git subtree push`로 `day02/todo` 폴더만 새 저장소에 push한다.

```bash
# 프로젝트 루트에서 실행 (etevers-vibecoding-2026-1st/)
git subtree push --prefix=src/exercise/hyukjuns/day02/todo https://github.com/hyukjuns/todo-app.git main
```

> push 완료 후 `https://github.com/hyukjuns/todo-app` 에서 파일이 올라갔는지 확인한다.

---

## 3. GitHub Pages 활성화

1. `https://github.com/hyukjuns/todo-app` → **Settings** 탭 클릭
2. 왼쪽 사이드바 **Pages** 클릭
3. **Source** 섹션:
   - Branch: **main** 선택
   - 폴더: **/ (root)** 선택
4. **Save** 클릭

---

## 4. 배포 확인

- 저장 후 1~2분 대기
- `https://hyukjuns.github.io/todo-app/` 접속해서 앱이 정상 동작하는지 확인

---

## 5. 이후 코드 업데이트 시 재배포

코드를 수정하고 `etevers-vibecoding-2026-1st` 저장소에 커밋한 뒤 아래 명령어를 실행한다.

```bash
# 프로젝트 루트에서 실행
git subtree push --prefix=src/exercise/hyukjuns/day02/todo https://github.com/hyukjuns/todo-app.git main
```

> push하면 GitHub Pages가 자동으로 재빌드된다.
