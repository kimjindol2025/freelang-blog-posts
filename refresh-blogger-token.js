#!/usr/bin/env node

/**
 * Blogger API 토큰 자동 갱신
 * refresh_token을 사용하여 새로운 access_token 발급
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');

function refreshToken() {
  return new Promise((resolve, reject) => {
    try {
      // 현재 토큰과 크레덴셜 읽기
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

      const { client_id, client_secret } = credentials.web;
      const refresh_token = token.refresh_token;

      // Google OAuth2 토큰 갱신 요청
      const postData = new URLSearchParams({
        client_id: client_id,
        client_secret: client_secret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      });

      const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData.toString())
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const newToken = JSON.parse(data);
              const updatedToken = {
                ...token,
                access_token: newToken.access_token,
                expiry_date: Date.now() + newToken.expires_in * 1000
              };

              // 새 토큰 저장
              fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedToken, null, 2));

              console.log('✅ 토큰 갱신 성공');
              console.log(`   새 만료시간: ${new Date(updatedToken.expiry_date).toISOString()}`);
              resolve(true);
            } catch (err) {
              reject(`JSON 파싱 오류: ${err.message}`);
            }
          } else {
            reject(`갱신 실패 (${res.statusCode}): ${data}`);
          }
        });
      });

      req.on('error', (err) => {
        reject(`요청 오류: ${err.message}`);
      });

      req.write(postData.toString());
      req.end();
    } catch (err) {
      reject(`파일 읽기 오류: ${err.message}`);
    }
  });
}

async function main() {
  console.log('🔄 Blogger API 토큰 갱신 시작...\n');

  try {
    await refreshToken();
    console.log('\n✨ 토큰 갱신 완료! 이제 포스트를 게시할 수 있습니다.');
    process.exit(0);
  } catch (err) {
    console.error(`❌ 오류: ${err}`);
    process.exit(1);
  }
}

main();
