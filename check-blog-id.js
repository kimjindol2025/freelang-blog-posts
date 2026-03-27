#!/usr/bin/env node

/**
 * Blogger 블로그 ID 확인 스크립트
 *
 * 사용법:
 *   node check-blog-id.js
 *
 * 기능:
 *   - 보유한 모든 블로그 나열
 *   - 각 블로그의 ID, URL, 포스트 수 표시
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');

async function checkBlogId() {
  // 토큰 파일 확인
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ 오류: 토큰 파일이 없습니다.');
    console.error(`   경로: ${TOKEN_PATH}`);
    console.error('');
    console.error('해결 방법:');
    console.error('  1. node oauth-setup.js 실행');
    console.error('  2. Google 계정으로 인증');
    process.exit(1);
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ 오류: credentials 파일이 없습니다.');
    console.error(`   경로: ${CREDENTIALS_PATH}`);
    console.error('');
    console.error('해결 방법:');
    console.error('  1. https://console.cloud.google.com 접속');
    console.error('  2. OAuth 클라이언트 ID 다운로드');
    console.error(`  3. 파일을 ${CREDENTIALS_PATH}에 저장`);
    process.exit(1);
  }

  try {
    // 인증 정보 로드
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

    const { client_id, client_secret } = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.installed.redirect_uris[0]);
    oauth2Client.setCredentials(token);

    // Blogger API 클라이언트 생성
    const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

    console.log('');
    console.log('📚 Blogger 블로그 목록 조회 중...');
    console.log('');

    // 블로그 목록 조회
    const response = await blogger.blogs.listByUser({
      userId: 'self'
    });

    const blogs = response.data.items || [];

    if (blogs.length === 0) {
      console.log('⚠️  블로그가 없습니다.');
      console.log('');
      console.log('새 블로그 만드는 방법:');
      console.log('  1. https://www.blogger.com 접속');
      console.log('  2. "블로그 만들기" 클릭');
      console.log('  3. 제목, 주소, 템플릿 선택');
      process.exit(0);
    }

    console.log(`✅ ${blogs.length}개의 블로그를 찾았습니다:\n`);

    // 각 블로그 정보 표시
    for (let i = 0; i < blogs.length; i++) {
      const blog = blogs[i];
      console.log(`${i + 1}. ${blog.name}`);
      console.log(`   📝 ID: ${blog.id}`);
      console.log(`   🔗 URL: ${blog.url}`);
      console.log(`   📊 포스트 수: ${blog.posts.totalItems}`);
      console.log('');
    }

    // 첫 번째 블로그 추천
    if (blogs.length > 0) {
      const firstBlog = blogs[0];
      console.log('💡 추천: 첫 번째 블로그를 사용합니다.');
      console.log('');
      console.log('blogger-post-*.js 파일의 BLOG_ID를 다음과 같이 설정하세요:');
      console.log('');
      console.log(`const BLOG_ID = '${firstBlog.id}';`);
      console.log('');
    }

    // 복사 가능한 코드
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 전체 blogger-post-*.js 파일 업데이트:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`sed -i "s/const BLOG_ID = '[^']*'/const BLOG_ID = '${blogs[0].id}'/g" blogger-post-*.js`);
    console.log('');

  } catch (error) {
    if (error.message.includes('invalid_grant')) {
      console.error('❌ 토큰이 만료되었습니다.');
      console.error('');
      console.error('해결 방법:');
      console.error('  rm ~/.config/blogger/token.json');
      console.error('  node oauth-setup.js');
    } else {
      console.error('❌ 오류:', error.message);
    }
    process.exit(1);
  }
}

// 실행
checkBlogId();
