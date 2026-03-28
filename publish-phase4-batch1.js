#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';
const POSTS_DIR = '/data/data/com.termux/files/home/dev/blogger-automation';

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
  const posts = [
    {
      file: 'Phase4-031-Raft-Consensus.md',
      title: 'Raft 합의 알고리즘: 분산 시스템의 심장',
      labels: ['분산시스템', '합의알고리즘', 'Raft']
    },
    {
      file: 'Phase4-032-Vector-Clock.md',
      title: 'Vector Clock: 분산 시스템의 인과관계 추적',
      labels: ['분산시스템', '동시성', 'Vector-Clock']
    },
    {
      file: 'Phase4-033-Quorum-Locking.md',
      title: 'Quorum 기반 분산 잠금: 안전하고 빠른 합의',
      labels: ['분산시스템', '잠금', 'Quorum']
    },
    {
      file: 'Phase4-034-SIMD-Vectorization.md',
      title: 'SIMD와 벡터화: AVX-512로 10배 가속화',
      labels: ['성능최적화', 'SIMD', 'AVX-512']
    },
    {
      file: 'Phase4-035-Cache-Line-Optimization.md',
      title: 'CPU 캐시 라인 최적화: L1에서 메모리까지 1000배 차이',
      labels: ['성능최적화', '캐시', 'CPU']
    }
  ];

  try {
    const blogger = await getAuthenticatedBlogger();

    console.log('🚀 Phase 4 첫 번째 배치 (5개 포스트) 게시 시작\n');
    console.log('📊 총 5개 포스트 게시\n');

    const results = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`[${i+1}/5] 📖 ${post.file}`);
      console.log(`  📤 발행 중: ${post.title}`);

      try {
        const result = await publishPost(
          blogger,
          path.join(POSTS_DIR, post.file),
          post.title,
          post.labels
        );

        console.log('  ✅ 발행 완료');
        console.log(`  🔗 URL: ${result.data.url}`);
        console.log('  ⏳ 10초 대기...\n');

        results.push({
          file: post.file,
          title: post.title,
          url: result.data.url,
          status: 'success'
        });

        // 10초 대기 (API rate limit)
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`  ❌ 실패: ${error.message}`);
        results.push({
          file: post.file,
          title: post.title,
          status: 'failed',
          error: error.message
        });
        console.log('  ⏳ 10초 대기...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // 결과 요약
    console.log('═══════════════════════════════════════════════════');
    console.log('✨ 발행 완료');
    console.log('═══════════════════════════════════════════════════');

    const successes = results.filter(r => r.status === 'success').length;
    const failures = results.filter(r => r.status === 'failed').length;

    console.log(`✅ 성공: ${successes}/5`);
    console.log(`❌ 실패: ${failures}/5\n`);

    console.log('📚 발행된 포스트:\n');
    let counter = 1;
    for (const result of results) {
      if (result.status === 'success') {
        console.log(`${counter}. ${result.title}`);
        console.log(`   ${result.url}\n`);
        counter++;
      }
    }

    if (failures > 0) {
      console.log('\n⚠️ 실패한 포스트:');
      for (const result of results) {
        if (result.status === 'failed') {
          console.log(`${result.file}: ${result.error}`);
        }
      }
    }

    console.log('\n🎉 Phase 4 배치 1 완성!');

  } catch (error) {
    console.error('❌ 인증 실패:', error.message);
    process.exit(1);
  }
}

main();
