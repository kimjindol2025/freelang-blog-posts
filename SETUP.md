# 🔧 Google Blogger API 셋업 가이드

## 1단계: Google Cloud 프로젝트 생성

### 1.1 Google Cloud Console 접속
- https://console.cloud.google.com 접속
- 새 프로젝트 생성: "FreeLang Blog" (또는 원하는 이름)

### 1.2 Blogger API 활성화
1. 좌측 메뉴 > "API 및 서비스"
2. "API 및 서비스 활성화"
3. "Blogger API v3" 검색
4. "활성화" 클릭

## 2단계: OAuth 2.0 인증 정보 생성

### 2.1 동의 화면 설정
1. 좌측 메뉴 > "OAuth 동의 화면"
2. 사용자 유형: "외부" 선택
3. 필수 정보 입력:
   - 앱 이름: "FreeLang Blog Automation"
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. "저장 후 계속"

### 2.2 인증 정보 생성
1. 좌측 메뉴 > "인증 정보"
2. "인증 정보 만들기" > "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "데스크톱 앱"
4. 이름: "FreeLang Blog CLI"
5. 생성 클릭
6. JSON 다운로드 (중요!)

## 3단계: 로컬 설정

### 3.1 디렉토리 생성 및 파일 저장
```bash
mkdir -p ~/.config/blogger/
# 다운로드한 JSON 파일 복사
cp ~/Downloads/client_secret_*.json ~/.config/blogger/credentials-web.json
```

### 3.2 credentials.json 형식 확인
```json
{
  "installed": {
    "client_id": "xxxx.apps.googleusercontent.com",
    "project_id": "freelang-blog",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "...",
    "client_secret": "xxxx",
    "redirect_uris": ["http://localhost:8080/"]
  }
}
```

## 4단계: 첫 실행 (토큰 생성)

### 4.1 oauth-setup.js 실행
```bash
node oauth-setup.js
```

### 4.2 브라우저 인증
1. 콘솔에 나타난 URL 클릭
2. Google 계정으로 로그인
3. "허용" 클릭
4. 권한 부여 코드 복사
5. 콘솔에 붙여넣기

### 4.3 토큰 저장
```
✅ 토큰이 ~/.config/blogger/token.json에 저장되었습니다
```

## 5단계: 블로그 ID 확인

### 5.1 CLI로 확인
```bash
node check-blog-id.js
```

### 5.2 또는 수동 확인
1. https://www.blogger.com 접속
2. 블로그 선택
3. 설정 > 기본 > 블로그 ID 복사
4. `blogger-post-*.js` 파일의 `BLOG_ID` 변수에 입력

## ❌ 트러블슈팅

### 문제: "Authentication failed"
**원인**: 토큰이 만료되었거나 credentials 파일이 없음

**해결**:
```bash
rm ~/.config/blogger/token.json
node oauth-setup.js  # 다시 인증
```

### 문제: "Invalid blog ID"
**원인**: BLOG_ID가 잘못됨

**해결**:
```bash
node check-blog-id.js  # 올바른 ID 확인
# blogger-post-*.js의 BLOG_ID 업데이트
```

### 문제: "API quota exceeded"
**원인**: 하루 API 호출 제한 초과

**해결**:
- 다음날 재시도
- Google Cloud Console > 할당량에서 제한 확인

### 문제: "EACCES: permission denied"
**원인**: 디렉토리 권한 문제

**해결**:
```bash
chmod 755 ~/.config/blogger/
chmod 644 ~/.config/blogger/credentials-web.json
chmod 644 ~/.config/blogger/token.json
```

## ✅ 검증

모든 설정이 완료되었는지 확인:

```bash
# 1. 파일 확인
ls -la ~/.config/blogger/

# 2. API 테스트
node check-blog-id.js

# 3. 포스트 게시 테스트 (선택)
node blogger-post-freelang-1-intro.js
```

모두 성공하면 셋업 완료!
