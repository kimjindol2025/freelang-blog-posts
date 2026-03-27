#!/usr/bin/env node

/**
 * Google Blogger API OAuth 2.0 토큰 생성 스크립트
 *
 * 사용법:
 *   node oauth-setup.js
 *
 * 필수 조건:
 *   ~/.config/blogger/credentials-web.json 파일 존재
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');

// 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function authorize() {
  // Credentials 파일 확인
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ 오류: ${CREDENTIALS_PATH} 파일이 없습니다.`);
    console.error('');
    console.error('설정 방법:');
    console.error('1. https://console.cloud.google.com 접속');
    console.error('2. Blogger API 활성화');
    console.error('3. OAuth 클라이언트 ID 생성 (데스크톱 앱)');
    console.error('4. JSON 파일 다운로드');
    console.error(`5. 다음 경로에 저장: ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // 인증 코드 받기
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/blogger']
  });

  console.log('');
  console.log('🔐 Google 계정 인증이 필요합니다.');
  console.log('');
  console.log('다음 링크를 브라우저에서 열고 Google 계정으로 로그인하세요:');
  console.log('');
  console.log(`🔗 ${authUrl}`);
  console.log('');

  return new Promise((resolve, reject) => {
    rl.question('인증 후 받은 코드를 입력하세요: ', async (code) => {
      try {
        const { tokens } = await oauth2Client.getToken(code);

        // 토큰 저장
        fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        console.log('');
        console.log('✅ 인증 성공!');
        console.log(`📝 토큰이 저장되었습니다: ${TOKEN_PATH}`);
        console.log('');
        console.log('📋 토큰 정보:');
        console.log(`   - Access Token: ${tokens.access_token.substring(0, 20)}...`);
        console.log(`   - Token Type: ${tokens.token_type}`);
        if (tokens.expiry_date) {
          const expiryDate = new Date(tokens.expiry_date);
          console.log(`   - 만료 예정: ${expiryDate.toLocaleString('ko-KR')}`);
        }
        console.log('');
        console.log('✅ 이제 다음 명령어로 포스트를 게시할 수 있습니다:');
        console.log('   node blogger-post-freelang-1-intro.js');
        console.log('');

        resolve();
      } catch (error) {
        console.error('');
        console.error('❌ 인증 실패:', error.message);
        reject(error);
      } finally {
        rl.close();
      }
    });
  });
}

// 실행
authorize().catch(error => {
  console.error('오류:', error);
  process.exit(1);
});
