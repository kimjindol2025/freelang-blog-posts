#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function getAuthenticatedBlogger() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    credentials.web.redirect_uris[0]
  );
  oauth2Client.setCredentials(token);
  return google.blogger({ version: 'v3', auth: oauth2Client });
}

function mdToHtml(mdContent) {
  let html = mdContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/```([^`]*)```/gs, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  return html;
}

async function publishPost(blogger, filePath, title, labels) {
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const htmlContent = mdToHtml(mdContent);

  const resource = {
    title: title,
    content: htmlContent,
    labels: labels,
  };

  return await blogger.posts.insert({
    blogId: BLOG_ID,
    resource: resource,
  });
}

async function main() {
  try {
    const blogger = await getAuthenticatedBlogger();

    console.log('[1/1] Phase3-029-B-Tree-vs-LSM.md');
    console.log('  📤 발행 중: 데이터 구조: B-Tree vs LSM 트레이드오프');
    
    const result = await publishPost(
      blogger,
      '/data/data/com.termux/files/home/dev/blogger-automation/Phase3-029-B-Tree-vs-LSM.md',
      '데이터 구조: B-Tree vs LSM 트레이드오프',
      ['데이터베이스', '성능', '자료구조']
    );

    console.log('  ✅ 발행 완료');
    console.log('  🔗 URL: ' + result.data.url);
    console.log('\n🎉 Phase 3 완성! (20/20 모두 게시됨)');
    
  } catch (error) {
    console.error('❌ 실패:', error.message);
    if (error.message.includes('quotaExceeded')) {
      console.log('\n⏳ API 할당량 초과. 내일 00:00 UTC 후 재시도하세요.');
    }
    process.exit(1);
  }
}

main();
