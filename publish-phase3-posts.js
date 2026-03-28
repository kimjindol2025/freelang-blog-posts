#!/usr/bin/env node

/**
 * Phase 3 포스트 20개 게시 (011-030)
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
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
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

async function publishAllPhase3Posts() {
  console.log('🚀 Phase 3 포스트 20개 발행 시작\n');

  const blogger = await getAuthenticatedBlogger();

  const phase3Posts = [
    { file: 'Phase3-011-Memory-Safety-Rust-vs-Go.md', title: '메모리 안전성: Rust vs Go 완벽 비교', labels: ['Performance', 'Rust', 'Go', 'Memory'] },
    { file: 'Phase3-012-Kubernetes-Orchestration.md', title: 'Kubernetes 오케스트레이션: 컨테이너 관리 완벽 가이드', labels: ['Kubernetes', 'DevOps', 'Containers'] },
    { file: 'Phase3-013-Microservices-Circuit-Breaker.md', title: '마이크로서비스: Circuit Breaker 패턴으로 장애 격리', labels: ['Microservices', 'Resilience', 'Patterns'] },
    { file: 'Phase3-014-Database-NoSQL-vs-SQL.md', title: '데이터베이스: NoSQL vs SQL 언제 뭘 쓸까?', labels: ['Database', 'SQL', 'NoSQL'] },
    { file: 'Phase3-015-Caching-Strategy-Redis-Memcached.md', title: '캐싱 전략: Redis vs Memcached 실전 비교', labels: ['Caching', 'Redis', 'Performance'] },
    { file: 'Phase3-016-API-Design-REST-vs-GraphQL.md', title: 'API 설계: REST vs GraphQL 완벽 비교', labels: ['API', 'REST', 'GraphQL'] },
    { file: 'Phase3-017-Logging-ELK-Stack.md', title: '로깅 시스템: ELK Stack으로 100GB 로그 처리하기', labels: ['Logging', 'ELK', 'Monitoring'] },
    { file: 'Phase3-018-Monitoring-Prometheus-Grafana.md', title: '모니터링: Prometheus/Grafana로 99.9% SLA 달성', labels: ['Monitoring', 'Prometheus', 'DevOps'] },
    { file: 'Phase3-019-CI-CD-GitHub-Actions.md', title: 'CI/CD: GitHub Actions로 10초 배포 파이프라인', labels: ['CI/CD', 'GitHub', 'Automation'] },
    { file: 'Phase3-020-Docker-Optimization.md', title: 'Docker 최적화: 1GB → 50MB (20배 축소)', labels: ['Docker', 'Optimization', 'DevOps'] },
    { file: 'Phase3-021-Networking-TCP-IP.md', title: 'TCP/IP 네트워킹: 패킷 구조부터 성능 튜닝까지', labels: ['Networking', 'TCP/IP', 'Performance'] },
    { file: 'Phase3-022-OAuth2-JWT-Security.md', title: '보안: OAuth2/JWT로 100만 사용자 인증하기', labels: ['Security', 'Auth', 'OAuth2'] },
    { file: 'Phase3-023-Jaeger-Tracing.md', title: 'Jaeger: 분산 시스템 병목 분석 완벽 가이드', labels: ['Tracing', 'Distributed', 'Monitoring'] },
    { file: 'Phase3-024-Kafka-vs-RabbitMQ.md', title: '메시징: Kafka vs RabbitMQ 완전 비교', labels: ['Messaging', 'Kafka', 'Queue'] },
    { file: 'Phase3-025-AWS-EC2-Tuning.md', title: 'AWS EC2: 성능 튜닝과 비용 최적화', labels: ['AWS', 'Cloud', 'Cost'] },
    { file: 'Phase3-026-Goroutine-vs-Thread.md', title: 'Goroutine vs Thread: 100만 동시 연결 비교', labels: ['Concurrency', 'Go', 'Performance'] },
    { file: 'Phase3-027-Regex-Performance.md', title: '정규표현식: 성능 최적화로 10배 가속화', labels: ['Regex', 'Performance', 'Optimization'] },
    { file: 'Phase3-028-Nginx-Configuration.md', title: 'Nginx: 설정 완벽 가이드 (50K req/sec)', labels: ['Nginx', 'WebServer', 'Performance'] },
    { file: 'Phase3-029-B-Tree-vs-LSM.md', title: '데이터 구조: B-Tree vs LSM 트레이드오프', labels: ['DataStructures', 'Database', 'Performance'] },
    { file: 'Phase3-030-Strace-Performance.md', title: '성능 분석: strace로 응답시간 1/10 단축하기', labels: ['Performance', 'Profiling', 'Linux'] }
  ];

  console.log(`📊 총 ${phase3Posts.length}개 포스트 발행\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < phase3Posts.length; i++) {
    const postMeta = phase3Posts[i];
    const filePath = path.join(POSTS_DIR, postMeta.file);

    console.log(`\n[${i + 1}/${phase3Posts.length}] 📖 ${postMeta.file}`);

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

    if (i < phase3Posts.length - 1) {
      console.log('  ⏳ 10초 대기...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  const outputDir = path.join(process.env.HOME, '.blogger-posts-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logPath = path.join(outputDir, 'publishing-phase3-complete.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✨ 발행 완료');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ 성공: ${successCount}/${phase3Posts.length}`);
  console.log(`❌ 실패: ${errorCount}/${phase3Posts.length}`);
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

  return { successCount, errorCount, total: phase3Posts.length };
}

publishAllPhase3Posts()
  .then(result => {
    process.exit(result.errorCount === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ 발행 실패:', err);
    process.exit(1);
  });
