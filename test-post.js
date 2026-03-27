#!/usr/bin/env node

/**
 * Blogger 포스트 테스트 스크립트
 *
 * 기능:
 *   - 포스트 파일 구조 검증
 *   - 콘텐츠 분석 (길이, HTML 태그 등)
 *   - 게시 시뮬레이션
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
];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         📝 Blogger 포스트 검증 및 테스트                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalWords = 0;
let totalChars = 0;
let validPosts = 0;
let issues = [];

postFiles.forEach((file, index) => {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 파일 크기
    const stats = fs.statSync(filePath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);

    // 콘텐츠 추출 (postData 객체 찾기)
    const postDataMatch = content.match(/const postData = \{[\s\S]*?\n  \};/);

    if (postDataMatch) {
      validPosts++;

      // title 추출
      const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
      const title = titleMatch ? titleMatch[1] : '제목 없음';

      // content 추출
      const contentMatch = content.match(/content:\s*`([\s\S]*?)`\s*,/);
      const postContent = contentMatch ? contentMatch[1] : '';

      // 통계
      const words = postContent.split(/\s+/).length;
      const chars = postContent.length;
      const htmlTags = (postContent.match(/<[^>]+>/g) || []).length;

      totalWords += words;
      totalChars += chars;

      console.log(`✅ Post ${index + 1}: ${file}`);
      console.log(`   제목: "${title}"`);
      console.log(`   크기: ${fileSizeKB}KB | 단어: ${words} | HTML 태그: ${htmlTags}`);
      console.log('');
    } else {
      issues.push(`❌ ${file}: postData 객체를 찾을 수 없음`);
    }
  } catch (err) {
    issues.push(`❌ ${file}: 읽기 실패 - ${err.message}`);
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 검증 결과');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ 유효한 포스트: ${validPosts}/${postFiles.length}`);
console.log(`📝 총 단어 수: ${totalWords.toLocaleString()}`);
console.log(`📄 총 문자 수: ${totalChars.toLocaleString()}`);
console.log(`📏 평균 포스트 길이: ${(totalWords / validPosts).toFixed(0)} 단어\n`);

if (issues.length > 0) {
  console.log('⚠️  주의사항:');
  issues.forEach(issue => console.log(`  ${issue}`));
} else {
  console.log('🎉 모든 포스트 구조가 정상입니다!');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📋 게시 전 필수 설정');
console.log('═══════════════════════════════════════════════════════════════');
console.log('1. ~/.config/blogger/credentials-web.json (Google OAuth 인증 정보)');
console.log('2. ~/.config/blogger/token.json (액세스 토큰)');
console.log('3. 포스트 파일의 BLOG_ID 확인');
console.log('\n명령어: node oauth-setup.js');
