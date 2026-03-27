# 📝 포스팅 가이드 - 단계별 설명

## 🚀 빠른 시작 (5분)

### 1. 단일 포스트 게시
```bash
node blogger-post-freelang-1-intro.js
```

**출력 예**:
```
📝 FreeLang Series #1 posting...

✅ Posted!

📝 Title: We Built Our Own Programming Language - Here's Why
🔗 URL: https://bigwash2026.blogspot.com/2026/03/we-built-our-own-programming-language.html

📊 Post 1/10 - Introduction
```

### 2. 전체 시리즈 자동 게시
```bash
bash publish-all.sh
```

**소요시간**: ~2분 (10개 포스트)

---

## 📋 상세 가이드

## 방법 1: 개별 포스트 게시

### 명령어
```bash
node blogger-post-freelang-{1..10}.js
```

### 포스트별 실행
```bash
# Post 1: 소개
node blogger-post-freelang-1-intro.js

# Post 2: 버그 사례
node blogger-post-freelang-2-bugs.js

# Post 3: 타입 안전성
node blogger-post-freelang-3-typesafety.js

# ... 계속
```

### 장점
- 📍 개별 포스트 게시 시간 제어
- 📊 각 포스트별 성공/실패 확인
- 🔄 특정 포스트만 다시 게시 가능

---

## 방법 2: 배치 자동 게시

### 명령어
```bash
bash publish-all.sh
```

### 동작
1. ✅ 모든 파일 존재 확인
2. 📝 Post 1-10 순차 게시
3. ⏱️ 각 포스트 간 2초 지연 (API 제한 회피)
4. 📊 최종 완료 보고

### 예상 시간
```
Post 1: 10초
Post 2: 10초
...
Post 10: 10초
━━━━━━━━━━━━
총: ~2분
```

---

## 🔐 인증 & 권한

### 필수 파일
```
~/.config/blogger/
├── credentials-web.json  # Google OAuth 설정
└── token.json            # 인증 토큰 (자동 생성)
```

### 토큰 갱신 (6개월마다)
```bash
rm ~/.config/blogger/token.json
node oauth-setup.js
```

---

## 📖 각 포스트 이해하기

### Post 1: 소개 (PORTFOLIO 30%)
- **목적**: 왜 FreeLang을 만들었나
- **청중**: C-Level, 의사결정자
- **분량**: ~1800 단어
- **특징**: ROI 계산, 문제 정의

**포스팅 팁**:
- 충분한 트래픽을 위해 주 3회 이상 공유
- LinkedIn에 요약 포스트

### Post 2: 버그 사례 (PORTFOLIO 30%)
- **목적**: 구체적인 문제 예시
- **청중**: 엔지니어, 기술 리더
- **분량**: ~2000 단어
- **특징**: 3개 실제 버그, 비용 분석

**포스팅 팁**:
- 기술 커뮤니티 공유 (Dev.to, HackerNews)
- 버그 분석 부분만 발췌해서 SNS 공유

### Post 3-4: 기술 솔루션 (TECHNICAL 30%)
- **목적**: 설계 결정 설명
- **청중**: 아키텍트, 시니어 엔지니어
- **분량**: ~2000 단어
- **특징**: 아키텍처 다이어그램, 패턴

**포스팅 팁**:
- Architecture Digest에 투고
- GitHub 트렌딩 프로젝트로 언급

### Post 5-8: 구현 & 성능 (CODE REVIEW 30%)
- **목적**: 실제 코드, 벤치마크
- **청중**: 개발자, 아키텍트
- **분량**: ~2500 단어
- **특징**: 코드 예시, 성능 테이블

**포스팅 팁**:
- Gists로 코드 발췌
- 성능 차트를 이미지로 추출해서 Twitter 공유

### Post 9-10: 일반화 & 미래 (PROMOTION 10%)
- **목적**: 패턴 재사용, 다음 시리즈 예고
- **청중**: 모든 엔지니어
- **분량**: ~1800 단어
- **특징**: 적용 가이드, 로드맵

**포스팅 팁**:
- "How to Apply" 체크리스트 만들기
- 다음 시리즈 티저 (Meeting Server v2)

---

## 🎯 포스팅 전략

### 주간 일정
```
월: Post 1-2 (문제 정의)
수: Post 3-4 (솔루션)
금: Post 5-6 (구현)
월(주2): Post 7-8 (성능)
수(주2): Post 9-10 (일반화)
```

### 홍보 채널별 전략

#### 1. 블로그 홈페이지
- 최신 포스트 featured
- 카테고리별 필터 (FreeLang, Performance, etc)

#### 2. 소셜 미디어
**Twitter/X**:
```
Post 1: "우리가 프로그래밍 언어를 만든 이유 👇 [3개 버그, 468시간 낭비] #engineering"
Post 2: "블록체인에서 $1이 사라진 방법 [타입 안전성이 구했다]"
Post 3: "타입 안전성이 80%의 버그를 방지한다는 증거 📊"
```

**LinkedIn**:
```
Article 형식으로 포스트의 주요 내용을 요약
#softwareengineering #typescript #programming
```

#### 3. 커뮤니티
- **HackerNews**: Post 1-2 (실제 사례)
- **Dev.to**: 전체 재포스팅
- **Reddit** (/r/programming): Post 3-4, 8
- **Medium**: 전체 시리즈 재발행

---

## 🔍 포스팅 검증 체크리스트

### 게시 전 확인
- [ ] 인증 토큰 유효 (`ls ~/.config/blogger/token.json`)
- [ ] 블로그 ID 정확 (BLOG_ID 변수 확인)
- [ ] HTML 문법 검증 (< > 닫힘 확인)
- [ ] 링크 유효성 (특히 내부 링크)

### 게시 후 확인
- [ ] 포스트가 블로그에 나타남
- [ ] URL이 정상 작동
- [ ] 이미지/테이블이 제대로 표시
- [ ] "Made in Korea" 마크가 포함됨

### 검증 명령어
```bash
# 게시 후 블로그 ID 확인
node check-blog-id.js

# 최신 포스트 조회
curl "https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}/posts?key={API_KEY}" | jq '.items[0]'
```

---

## 📊 성과 측정

### Google Analytics 추적
1. Blogger 설정 > 통계
2. Google Analytics 연결
3. 포스트별 트래픽 모니터링

### 주요 지표
```
메트릭                    목표
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
페이지 조회수           3K/month
평균 세션 시간          2분 이상
바운스율               30% 이하
방문 국가               10개 이상
```

### 포스트별 성과 예측
```
Post 1-2: 낮음 (기초)
Post 3-4: 중간 (기술)
Post 5-6: 중간 (구현)
Post 7-8: 높음 (성능 + 코드)
Post 9-10: 높음 (실용성 + 예고)
```

---

## ⚠️ 일반적인 실수

### ❌ 실수 1: 너무 빨리 게시
**문제**: API 한도 도달
**해결**: `publish-all.sh`에서 `sleep 5`로 변경

### ❌ 실수 2: 토큰 만료
**문제**: 중간에 게시 실패
**해결**: 크론 잡으로 주기적 갱신
```bash
# crontab -e
0 0 1 * * node /home/kim/blogger-automation/oauth-setup.js
```

### ❌ 실수 3: 중복 게시
**문제**: 같은 포스트를 두 번 게시
**해결**: 먼저 블로그 확인 후 게시

---

## 🚀 다음 단계

### 자동화 고도화
```bash
# 크론으로 자동 게시 (매주 월요일 09:00)
0 9 * * 1 cd /home/kim/blogger-automation && bash publish-one.sh
```

### 멀티 채널 배포
```bash
# 블로그 → Dev.to → Medium 자동화
node sync-to-devto.js
node sync-to-medium.js
```

### 분석 대시보드
```bash
# 포스트별 성과 리포트
node analytics-report.js
```

---

## 💡 팁 & 트릭

### 포스팅 최적화
1. **제목**: 40자 이내, 숫자 포함 (3x, 80%)
2. **첫 문단**: 호기심 유발 (한 문장)
3. **표**: 복잡한 정보 시각화
4. **코드 블록**: 주석 포함
5. **마무리**: 다음 포스트 예고

### SEO 최적화
```
메타 설명: ~155자
태그: 3-5개 (FreeLang, Type Safety, etc)
내부 링크: 이전/다음 포스트
```

### 독자 유지
```
Post 마다:
- 이전 포스트 링크
- 다음 포스트 예고
- 피드백 요청
```

---

## 📞 지원

문제 발생 시:
1. **SETUP.md** 의 트러블슈팅 확인
2. **Google Blogger 도움말**: https://support.google.com/blogger
3. **API 문서**: https://developers.google.com/blogger
