# 🚀 Blogger 자동화 - FreeLang v6 시리즈

Google Blogger API v3를 이용한 자동 포스팅 시스템

## 프로젝트 개요

FreeLang v6 블로그 시리즈를 Google Blogger에 자동으로 게시하는 Node.js 기반 자동화 스크립트입니다.

- **블로그**: https://bigwash2026.blogspot.com
- **시리즈**: FreeLang v6 (10개 포스트)
- **기술**: Node.js + Google Blogger API v3 + OAuth 2.0

## 포스트 목록 (완료됨)

| # | 제목 | 상태 |
|---|------|------|
| 1 | We Built Our Own Programming Language - Here's Why | ✅ |
| 2 | The Bugs That Forced Us to Build Our Own Language | ✅ |
| 3 | Type Safety Prevents 80% of Our Bugs | ✅ |
| 4 | How We Designed FreeLang: The Architecture | ✅ |
| 5 | Error Handling System: Making Bugs Traceable | ✅ |
| 6 | P0 Improvements: Making Our APIs Consistent | ✅ |
| 7 | Real Code Examples: FreeLang in Production | ✅ |
| 8 | Performance Benchmarks: Where FreeLang Gets 3x-6x Faster | ✅ |
| 9 | These Patterns Work for Your Project Too | ✅ |
| 10 | What's Next: FreeLang Roadmap and Our Vision | ✅ |

## 파일 구조

```
blogger-automation/
├── README.md                           # 이 파일
├── blogger-post-freelang-1-intro.js    # Post 1: 소개
├── blogger-post-freelang-2-bugs.js     # Post 2: 버그 사례
├── blogger-post-freelang-3-typesafety.js
├── blogger-post-freelang-4-architecture.js
├── blogger-post-freelang-5-errors.js
├── blogger-post-freelang-6-p0improvements.js
├── blogger-post-freelang-7-codeexamples.js
├── blogger-post-freelang-8-performance.js
├── blogger-post-freelang-9-applythis.js
└── blogger-post-freelang-10-roadmap.js # Post 10: 로드맵
```

## 기술 스택

- **Node.js**: 자동화 엔진
- **googleapis**: Google Blogger API 클라이언트
- **OAuth 2.0**: 인증

## 사용 방법

### 필수 설정

1. **Google Cloud 프로젝트 설정**
   - Google Cloud Console에서 Blogger API 활성화
   - OAuth 2.0 사용자 인증 정보 생성
   - credentials.json 다운로드

2. **토큰 생성**
   ```bash
   node oauth-setup.js
   # 생성된 token.json 저장
   ```

3. **환경 설정**
   ```bash
   mkdir -p ~/.config/blogger/
   cp credentials.json ~/.config/blogger/credentials-web.json
   cp token.json ~/.config/blogger/token.json
   ```

### 포스트 게시

개별 포스트:
```bash
node blogger-post-freelang-1-intro.js
node blogger-post-freelang-2-bugs.js
# ... etc
```

전체 자동화 (배치):
```bash
bash publish-all.sh
```

## 콘텐츠 전략

### 4가지 비율 균형

- **포트폴리오 (30%)**: 우리가 만든 것
  - 아키텍처 설명
  - 기능 목록
  - 성과 지표

- **기술 (30%)**: 문제 해결 방법
  - 설계 결정
  - 아키텍처 패턴
  - 성능 최적화

- **코드 리뷰 (30%)**: 실제 구현
  - 실제 코드 예시
  - 에러 처리 패턴
  - 베스트 프랙티스

- **홍보 (10%)**: 행동 유도
  - 패턴 적용 가이드
  - 다음 포스트 예고
  - 저장소 링크

## 각 포스트 특징

### Post 1-2: 문제 정의
- 왜 FreeLang을 만들었나
- 구체적 버그 사례 (3개, 실제 비용)

### Post 3-4: 솔루션 설명
- 타입 안전성 측정 (80% 버그 방지)
- 5가지 설계 결정

### Post 5-6: 구현 세부사항
- 에러 처리 계층구조 (15개 클래스)
- API 일관성 개선 (P0-2)

### Post 7-8: 실제 코드 + 성능
- 트랜잭션 검증 코드
- 데이터베이스 쿼리 최적화
- 3x-6x 성능 개선 사례

### Post 9-10: 일반화 + 미래
- TypeScript/Python 적용 패턴
- 2026-2028 로드맵

## 블로그 메타데이터

- **언어**: 영어 (글로벌 대상)
- **마크**: Made in Korea 🇰🇷 (모든 포스트 하단)
- **범주**:
  - FreeLang
  - Programming Language
  - Type Safety
  - Error Handling
  - Performance
  - Engineering

## 게시 완료 시간

모든 10개 포스트 게시 완료: 2026-03-27

## 다음 시리즈

- Meeting Server v2: AI 협업 시스템
- File Upload: 파일 업로드 서버 아키텍처
- Server Control Center: 멀티 서버 관제

## 참고자료

- **Gogs 저장소**: https://gogs.dclub.kr/kim/freelang-v6
- **로컬 개발**: ~/freelang-v6-source/
- **블로그**: https://bigwash2026.blogspot.com

## 라이선스

Made in Korea 🇰🇷
