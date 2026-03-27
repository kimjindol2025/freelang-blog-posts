#!/usr/bin/env node

/**
 * Blogger 포스트 프리뷰 스크립트
 *
 * 기능:
 *   - 각 포스트의 제목과 첫 200자 미리보기
 *   - 메타데이터 확인 (라벨, 카테고리 등)
 */

const fs = require('fs');
const path = require('path');

// 포스트 파일 목록
const postFiles = [
  'blogger-post-freelang-1-intro.js',
  'blogger-post-freelang-2-bugs.js',
  'blogger-post-freelang-3-typesafety.js',
  'blogger-post-freelang-4-architecture.js',
  'blogger-post-freelang-5-errors.js',
  'blogger-post-freelang-6-p0improvements.js',
  'blogger-post-freelang-7-codeexamples.js',
  'blogger-post-freelang-8-performance.js',
  'blogger-post-freelang-9-applythis.js',
  'blogger-post-freelang-10-roadmap.js',
  'blogger-post-server-1-bankingsystem.js',
  'blogger-post-server-2-backendproduction.js',
  'blogger-post-server-3-restapi.js',
];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         📝 Blogger 포스트 프리뷰                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

postFiles.forEach((file, index) => {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // title 추출
    const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    const title = titleMatch ? titleMatch[1] : '제목 없음';

    // content 추출 (HTML 제거)
    const contentMatch = content.match(/content:\s*`([\s\S]*?)`\s*,/);
    let postContent = contentMatch ? contentMatch[1] : '';

    // HTML 태그 제거
    postContent = postContent.replace(/<[^>]+>/g, '').trim();

    // 첫 200자 추출
    const preview = postContent.substring(0, 200).replace(/\n/g, ' ');

    // labels 추출
    const labelsMatch = content.match(/labels:\s*\[(.*?)\]/s);
    const labels = labelsMatch ? labelsMatch[1].split(',').map(l => l.trim().replace(/['"]/g, '')) : [];

    console.log(`${'─'.repeat(66)}`);
    console.log(`📌 Post ${index + 1}: ${title}`);
    console.log(`${'─'.repeat(66)}`);
    console.log(`📝 미리보기: ${preview}...`);
    if (labels.length > 0) {
      console.log(`🏷️  라벨: ${labels.join(' • ')}`);
    }
    console.log('');
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('✨ 포스트 프리뷰 완료!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n다음 단계:');
console.log('1. Google Cloud 설정 및 토큰 생성');
console.log('2. node blogger-post-freelang-1-intro.js (첫 포스트 게시)');
console.log('3. bash publish-all.sh (전체 게시)');
