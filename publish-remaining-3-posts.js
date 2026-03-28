#!/usr/bin/env node

/**
 * 나머지 3개 포스트만 게시
 * - Phase2-006-Profiling-Debugging.md
 * - Phase2-007-Lock-Free-Programming.md
 * - Phase2-008-Memory-Model-HappensBefore.md
 */

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
  return mdContent
    .replace(/^# (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
    .replace(/^\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^`(.+?)`/g, '<code>$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).trim();
      return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<') || match.startsWith('```')) return match;
      return `<p>${match}</p>`;
    });
}

async function publishPost(blogger, post) {
  try {
    console.log(`  📤 발행 중: ${post.title}`);

    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: {
        title: post.title,
        content: post.content,
        labels: post.labels,
        published: new Date().toISOString()
      },
    });

    return {
      success: true,
      url: res.data.url,
      id: res.data.id,
      title: post.title
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      title: post.title
    };
  }
}

async function publishRemainingPosts() {
  console.log('🚀 나머지 3개 포스트 발행\n');

  const blogger = await getAuthenticatedBlogger();

  const remainingPosts = [
    {
      file: 'Phase2-006-Profiling-Debugging.md',
      title: 'pprof 완벽 가이드: CPU/메모리 병목을 찾는 모든 방법',
      labels: ['Profiling', 'Debugging', 'Performance', 'Go']
    },
    {
      file: 'Phase2-007-Lock-Free-Programming.md',
      title: 'Lock-Free 프로그래밍: 50배 빠른 동시성',
      labels: ['Concurrency', 'Atomic', 'Lock-Free', 'Go']
    },
    {
      file: 'Phase2-008-Memory-Model-HappensBefore.md',
      title: 'Go 메모리 모델: Happens-Before 관계로 배우는 동시성 안전성',
      labels: ['Memory', 'Concurrency', 'Synchronization', 'Go']
    }
  ];

  console.log(`📊 총 ${remainingPosts.length}개 포스트 발행\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < remainingPosts.length; i++) {
    const postMeta = remainingPosts[i];
    const filePath = path.join(POSTS_DIR, postMeta.file);

    console.log(`\n[${i + 1}/${remainingPosts.length}] 📖 ${postMeta.file}`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ 파일 없음: ${filePath}`);
      errorCount++;
      results.push({
        file: postMeta.file,
        title: postMeta.title,
        status: 'error',
        error: 'File not found',
        timestamp: new Date().toISOString()
      });
      continue;
    }

    const mdContent = fs.readFileSync(filePath, 'utf-8');
    const htmlContent = mdToHtml(mdContent);

    const postData = {
      title: postMeta.title,
      content: htmlContent,
      labels: postMeta.labels
    };

    const result = await publishPost(blogger, postData);

    if (result.success) {
      console.log(`  ✅ 발행 완료`);
      console.log(`  🔗 URL: ${result.url}`);
      successCount++;
      results.push({
        file: postMeta.file,
        title: result.title,
        status: 'success',
        url: result.url,
        id: result.id,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`  ❌ 실패: ${result.error}`);
      errorCount++;
      results.push({
        file: postMeta.file,
        title: result.title,
        status: 'error',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    if (i < remainingPosts.length - 1) {
      console.log('  ⏳ 10초 대기...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  const outputDir = path.join(process.env.HOME, '.blogger-posts-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logPath = path.join(outputDir, 'publishing-remaining-3.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✨ 발행 완료');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ 성공: ${successCount}/${remainingPosts.length}`);
  console.log(`❌ 실패: ${errorCount}/${remainingPosts.length}`);
  console.log(`📋 로그: ${logPath}\n`);

  if (successCount > 0) {
    console.log('📚 발행된 포스트:\n');
    results
      .filter(r => r.status === 'success')
      .forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.title}`);
        console.log(`   ${r.url}\n`);
      });
  }

  return { successCount, errorCount, total: remainingPosts.length };
}

publishRemainingPosts()
  .then(result => {
    process.exit(result.errorCount === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ 발행 실패:', err);
    process.exit(1);
  });
