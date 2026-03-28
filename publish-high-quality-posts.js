#!/usr/bin/env node

/**
 * 고품질 블로그 포스트 게시: Phase 1-2 (10개)
 * - Phase 1 (4개): Zero-Copy DB, Raft, LSM, AI Agent
 * - Phase 2 (6개): Performance, Profiling, Lock-Free, Memory Model, Scheduling, Case Study
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
  // 마크다운을 HTML로 변환
  // marked 또는 간단한 변환
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

async function publishAllPosts() {
  console.log('🚀 고품질 블로그 포스트 발행 시작\n');

  // 인증
  const blogger = await getAuthenticatedBlogger();

  // Phase 1 포스트 4개
  const phase1Posts = [
    {
      file: 'Phase1-001-ZeroCopy-Database.md',
      title: 'Zero-Copy Database: SoA 메모리 레이아웃으로 3.6배 성능 향상',
      labels: ['Performance', 'Database', 'Memory', 'Optimization']
    },
    {
      file: 'Phase1-002-Raft-Consensus.md',
      title: 'Raft 분산 합의: 리더 선출부터 로그 복제까지 완벽 가이드',
      labels: ['Distributed Systems', 'Consensus', 'Raft', 'Backend']
    },
    {
      file: 'Phase1-003-LSM-Tree.md',
      title: 'LSM Tree: 1,670줄로 배우는 쓰기 성능 최적화',
      labels: ['Database', 'Data Structures', 'Performance', 'LSM']
    },
    {
      file: 'Phase1-004-AI-Agent-DevOps.md',
      title: '멀티에이전트 AI 시스템: 4가지 협업 패턴으로 2.5배 빠르게',
      labels: ['AI', 'Agents', 'DevOps', 'Automation']
    }
  ];

  // Phase 2 포스트 6개
  const phase2Posts = [
    {
      file: 'Phase2-005-Performance-Optimization.md',
      title: '성능 최적화: 10K에서 50K req/sec로 5배 향상시키기',
      labels: ['Performance', 'Optimization', 'Benchmarking', 'Go']
    },
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
    },
    {
      file: 'Phase2-009-Goroutine-Scheduling.md',
      title: 'Go 런타임 스케줄링: 100만 고루틴을 관리하는 방법',
      labels: ['Runtime', 'Scheduling', 'Goroutines', 'Go']
    },
    {
      file: 'Phase2-010-Real-World-Performance-Case-Study.md',
      title: '실전 성능 사례: 10배 느린 API를 1시간에 고치기',
      labels: ['Case Study', 'Performance', 'Debugging', 'Real-World']
    }
  ];

  const allPosts = [...phase1Posts, ...phase2Posts];
  console.log(`📊 총 ${allPosts.length}개 포스트 발행\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allPosts.length; i++) {
    const postMeta = allPosts[i];
    const filePath = path.join(POSTS_DIR, postMeta.file);

    console.log(`\n[${i + 1}/${allPosts.length}] 📖 ${postMeta.file}`);

    // 파일 읽기
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

    // API 레이트 제한 방지 (요청 사이 5초)
    if (i < allPosts.length - 1) {
      console.log('  ⏳ 5초 대기 (API 레이트 제한)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 결과 저장
  const outputDir = path.join(process.env.HOME, '.blogger-posts-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logPath = path.join(outputDir, 'publishing-high-quality-complete.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));

  // 최종 보고
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✨ 발행 완료');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ 성공: ${successCount}/${allPosts.length}`);
  console.log(`❌ 실패: ${errorCount}/${allPosts.length}`);
  console.log(`📋 로그: ${logPath}\n`);

  // 성공한 포스트 URL 출력
  if (successCount > 0) {
    console.log('📚 발행된 포스트:\n');
    results
      .filter(r => r.status === 'success')
      .forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.title}`);
        console.log(`   ${r.url}\n`);
      });
  }

  return { successCount, errorCount, total: allPosts.length };
}

publishAllPosts()
  .then(result => {
    process.exit(result.errorCount === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ 발행 실패:', err);
    process.exit(1);
  });
