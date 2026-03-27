# 📚 완전 사용 설명서 - 게시부터 배포까지

## 🎯 5분 안에 시작하기

### Step 1: 셋업 (처음 한 번만)
```bash
# 1. 저장소 클론
git clone https://gogs.dclub.kr/kim/blogger-automation.git
cd blogger-automation

# 2. 의존성 설치
npm install googleapis fs path

# 3. 구글 인증 설정 (SETUP.md 참고)
node oauth-setup.js
# → 브라우저에서 Google 계정 로그인
# → 토큰 자동 생성

# 4. 블로그 ID 확인
node check-blog-id.js
# → 보유한 블로그 목록 표시
```

### Step 2: 포스팅 (30초)
```bash
# 전체 자동 게시
bash publish-all.sh

# 또는 개별 게시
node blogger-post-freelang-1-intro.js
```

---

## 📖 상세 가이드별로 따라가기

### 경로 1️⃣: 완전 초보자
1. **SETUP.md** 읽기 (Google OAuth 설정)
2. `node oauth-setup.js` 실행
3. `node check-blog-id.js` 실행
4. `bash publish-all.sh` 실행
5. ✅ 블로그에서 포스트 확인

### 경로 2️⃣: 이미 Google 계정 있음
1. `node check-blog-id.js` 실행 (토큰 확인)
2. `bash publish-all.sh` 실행
3. ✅ 완료

### 경로 3️⃣: 커스텀 포스트 작성
1. `blogger-post-freelang-1-intro.js` 를 템플릿으로 복사
2. `title`, `content`, `labels` 수정
3. `node my-custom-post.js` 실행

---

## 🚀 포스팅 방법 3가지

### 방법 1: 전체 자동화 (추천)
```bash
bash publish-all.sh
```

**장점**:
- ✅ 10개 포스트 자동 게시
- ✅ 포스트 간 2초 지연 (안정성)
- ✅ 진행 상황 실시간 표시
- ✅ 완료 보고서 자동 생성

**소요시간**: ~2분

**예상 출력**:
```
📝 FreeLang v6 블로그 시리즈 자동 게시 시작...

[1/10] blogger-post-freelang-1-intro.js 게시 중...
✅ 완료

[2/10] blogger-post-freelang-2-bugs.js 게시 중...
✅ 완료

... (8개 계속)

✅ 모든 10개 포스트 게시 완료!

📊 게시된 포스트:
   1. We Built Our Own Programming Language - Here's Why
   2. The Bugs That Forced Us to Build Our Own Language
   ... (10개 목록)

🔗 블로그: https://bigwash2026.blogspot.com
```

### 방법 2: 개별 선택 게시

#### 2-1. 특정 포스트만 게시
```bash
node blogger-post-freelang-3-typesafety.js
```

**언제 사용**:
- 특정 포스트만 업데이트할 때
- 게시 시간을 분산시킬 때
- 테스트/검증할 때

#### 2-2. 범위 게시
```bash
# Post 1-5만 게시
for i in {1..5}; do
  node blogger-post-freelang-$i-*.js
  sleep 2
done
```

#### 2-3. 정렬 변경 게시
```bash
# 역순 게시
node blogger-post-freelang-10-roadmap.js
node blogger-post-freelang-9-applythis.js
# ... 계속

# 또는 특정 순서
node blogger-post-freelang-8-performance.js
node blogger-post-freelang-3-typesafety.js
```

### 방법 3: 크론 자동화

#### 3-1. 일일 자동 게시
```bash
# crontab 편집
crontab -e

# 다음 줄 추가 (매일 09:00)
0 9 * * * cd /home/kim/blogger-automation && bash publish-all.sh >> cron.log 2>&1
```

#### 3-2. 주 1회 게시 (분산)
```bash
# 매주 월요일~금요일 각 1개씩
0 9 * * 1 node /home/kim/blogger-automation/blogger-post-freelang-1-intro.js
0 9 * * 2 node /home/kim/blogger-automation/blogger-post-freelang-2-bugs.js
0 9 * * 3 node /home/kim/blogger-automation/blogger-post-freelang-3-typesafety.js
0 9 * * 4 node /home/kim/blogger-automation/blogger-post-freelang-4-architecture.js
0 9 * * 5 node /home/kim/blogger-automation/blogger-post-freelang-5-errors.js
```

#### 3-3. 월 1회 게시
```bash
# 매달 1일 09:00
0 9 1 * * cd /home/kim/blogger-automation && bash publish-all.sh
```

---

## 🎓 포스팅 워크플로우

### 완전한 게시 과정

```
1️⃣ 준비
   ├─ Node.js 17+ 설치 확인: node --version
   ├─ googleapis 설치: npm install googleapis
   └─ 구글 인증: node oauth-setup.js

2️⃣ 검증
   ├─ 토큰 유효성: node check-blog-id.js
   ├─ 블로그 ID 확인: echo $BLOG_ID
   └─ 파일 존재: ls blogger-post-*.js

3️⃣ 게시
   ├─ 전체: bash publish-all.sh
   ├─ 개별: node blogger-post-freelang-N.js
   └─ 모니터링: tail -f cron.log

4️⃣ 확인
   ├─ 블로그 방문: https://bigwash2026.blogspot.com
   ├─ 포스트 확인: 최신 포스트 보이는지 확인
   └─ Analytics: 트래픽 추적 (선택)

5️⃣ 홍보
   ├─ Twitter: 포스트 링크 공유
   ├─ LinkedIn: 요약 포스트 작성
   ├─ Dev.to: 재발행
   └─ HackerNews: 제출
```

---

## 📋 파일 이해하기

### `blogger-post-freelang-N-*.js` 구조

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 1. 설정
const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';  // ← 블로그 ID 변경 필요할 수 있음

// 2. 메인 함수
async function postFreeLangN() {
  // 토큰 로드
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  // OAuth 인증
  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);

  // Blogger 클라이언트
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  // 포스트 데이터
  const postData = {
    title: '포스트 제목',
    content: `<p>HTML 콘텐츠</p>`,
    labels: ['태그1', '태그2']
  };

  // 3. 게시
  try {
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });
    console.log('✅ 완료: ' + response.data.url);
  } catch (error) {
    console.error('❌ 실패: ' + error.message);
    process.exit(1);
  }
}

// 4. 실행
postFreeLangN();
```

### 커스텀 포스트 작성

```bash
# 1. 템플릿 복사
cp blogger-post-freelang-1-intro.js my-custom-post.js

# 2. 파일 수정
nano my-custom-post.js
# 다음 부분 수정:
# - 함수명: postFreeLangN → postMyCustom
# - 제목: 'We Built...' → '나의 제목'
# - 내용: <p>HTML 콘텐츠</p> → 포스트 내용
# - 마지막 줄: postFreeLangN() → postMyCustom()

# 3. 게시
node my-custom-post.js
```

---

## ⚠️ 문제 해결

### 문제 1: "Authentication failed"
```
❌ Error: Authentication failed
```

**원인**: 토큰 만료 또는 credentials 파일 없음

**해결**:
```bash
rm ~/.config/blogger/token.json
node oauth-setup.js
```

### 문제 2: "Invalid blog ID"
```
❌ Error: Invalid blog ID
```

**원인**: BLOG_ID가 잘못됨

**해결**:
```bash
node check-blog-id.js
# 출력된 ID로 모든 파일 업데이트
sed -i "s/const BLOG_ID = '[^']*'/const BLOG_ID = '올바른_ID'/g" blogger-post-*.js
```

### 문제 3: "googleapis is not installed"
```
❌ Error: Cannot find module 'googleapis'
```

**원인**: 의존성 미설치

**해결**:
```bash
npm install googleapis
```

### 문제 4: "토큰 파일 없음"
```
❌ 오류: ~/.config/blogger/token.json 파일이 없습니다
```

**원인**: 한 번도 인증하지 않음

**해결**:
```bash
node oauth-setup.js
# 구글 계정으로 인증
```

### 문제 5: "credentials.json 없음"
```
❌ 오류: credentials-web.json 파일이 없습니다
```

**원인**: Google Cloud 설정 누락

**해결**:
1. https://console.cloud.google.com 접속
2. Blogger API 활성화
3. OAuth 클라이언트 ID 생성 (데스크톱 앱)
4. JSON 다운로드
5. 저장:
   ```bash
   mkdir -p ~/.config/blogger/
   cp ~/Downloads/client_secret_*.json ~/.config/blogger/credentials-web.json
   ```

---

## 📊 포스팅 결과 확인

### 1. 실시간 확인
```bash
# 로그 파일 모니터링
tail -f publish.log

# 또는 브라우저에서 직접
# https://bigwash2026.blogspot.com
```

### 2. API로 확인
```bash
node check-blog-id.js
# → 최신 포스트 목록 표시
```

### 3. 상세 조회
```bash
curl "https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}/posts" \
  -H "Authorization: Bearer {TOKEN}" | jq '.items[] | {title: .title, published: .published}'
```

---

## 🎯 체크리스트

### 게시 전
- [ ] Node.js 설치 확인 (`node --version`)
- [ ] googleapis 설치 (`npm list googleapis`)
- [ ] 토큰 파일 존재 (`ls ~/.config/blogger/token.json`)
- [ ] credentials 파일 존재 (`ls ~/.config/blogger/credentials-web.json`)
- [ ] BLOG_ID 올바른지 확인 (`node check-blog-id.js`)
- [ ] 포스트 파일 존재 (`ls blogger-post-freelang-*.js`)

### 게시 후
- [ ] 블로그에서 포스트 표시 확인
- [ ] 포스트 URL 정상 작동
- [ ] 이미지/테이블 올바르게 표시
- [ ] 링크 유효성 확인
- [ ] Made in Korea 마크 포함 확인

---

## 💡 팁

### 시간대별 게시
```bash
# 한국 기준 09:00 게시
# (다른 시간대 관객을 위해)
0 0 * * * cd /home/kim/blogger-automation && bash publish-all.sh  # UTC 00:00

# 미국 동부 기준 09:00
0 14 * * * bash publish-all.sh  # 한국 기준 22:00
```

### 배포 분산
```bash
# 주간: 월~금 각 1개
# 월: Post 1-2 (문제정의)
# 수: Post 3-4 (솔루션)
# 금: Post 5-6 (구현)

# 주간 2: Post 7-10 계속
```

### 성과 분석
```bash
# Google Analytics 링크:
# https://analytics.google.com

# 모니터링할 지표:
# - 페이지 조회수
# - 평균 세션 시간
# - 바운스율
# - 트래픽 소스
```

---

## 🔗 참고자료

- **SETUP.md**: 초기 설정 (Google OAuth)
- **POSTING_GUIDE.md**: 포스팅 전략 & 분석
- **README.md**: 프로젝트 개요
- **Google Blogger API**: https://developers.google.com/blogger
- **블로그**: https://bigwash2026.blogspot.com

---

## 🎓 다음 단계

1. **자동화 고도화**
   - 크론 설정으로 자동 게시
   - 실패 알림 설정
   - 성과 리포트 자동화

2. **멀티 채널**
   - Dev.to 연동
   - Medium 연동
   - LinkedIn 자동 공유

3. **분석 강화**
   - Google Analytics 통합
   - 포스트별 성과 분석
   - 독자 피드백 수집

---

**모든 준비가 되었습니다! 이제 게시하세요! 🚀**
