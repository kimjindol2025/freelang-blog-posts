#!/usr/bin/env node
// convert-to-jekyll.js
// Phase*.md → Jekyll _posts/ 변환 스크립트
// 사용법: node convert-to-jekyll.js

const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// 설정
// ──────────────────────────────────────────────
const SOURCE_DIR = '/data/data/com.termux/files/home/dev/blogger-automation';
const OUTPUT_DIR = path.join(SOURCE_DIR, '_posts');

// Phase 번호 → 카테고리 매핑
const PHASE_CATEGORIES = {
  '1': 'Phase1-Database',
  '2': 'Phase2-Performance',
  '3': 'Phase3-Systems',
  '4': 'Phase4-Advanced',
};

// 파일명 슬러그 변환: CamelCase/하이픈 → 소문자-하이픈
function toSlug(str) {
  return str
    .replace(/([A-Z])/g, (m) => '-' + m.toLowerCase())
    .replace(/^-/, '')
    .replace(/--+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+$/, '');
}

// Phase1-001-ZeroCopy-Database.md → { phase, num, slug }
function parseFilename(filename) {
  const base = path.basename(filename, '.md');
  const match = base.match(/^Phase(\d+)-(\d+)-(.+)$/);
  if (!match) return null;

  const [, phaseNum, seqNum, rest] = match;
  const slug = toSlug(rest);

  return {
    phase: phaseNum,
    seq: parseInt(seqNum, 10),
    slug,
  };
}

// 마크다운에서 첫 번째 H1 제목 추출
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

// **작성**: 2026-03-27 → "2026-03-27"
function extractDate(content) {
  const match = content.match(/\*\*작성\*\*\s*:\s*(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return '2026-03-27';
}

// **카테고리**: Database Optimization, Performance Architecture
function extractCategories(content) {
  const match = content.match(/\*\*카테고리\*\*\s*:\s*(.+)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// **읽는 시간**: 약 15분
function extractReadingTime(content) {
  const match = content.match(/\*\*읽는\s*시간\*\*\s*:\s*(.+)/);
  return match ? match[1].trim() : '';
}

// **난이도**: 초급 개념, 중급 코드
function extractDifficulty(content) {
  const match = content.match(/\*\*난이도\*\*\s*:\s*(.+)/);
  return match ? match[1].trim() : '';
}

// Phase 번호로 태그 배열 생성
function buildTags(categories, phase) {
  const phaseTags = {
    '1': ['database', 'distributed-systems'],
    '2': ['performance', 'concurrency'],
    '3': ['systems', 'devops', 'cloud'],
    '4': ['advanced', 'low-level', 'blockchain'],
  };
  const tags = [...(phaseTags[phase] || [])];

  categories.forEach((cat) => {
    const tag = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag)) tags.push(tag);
  });

  return tags;
}

// 콘텐츠에서 메타데이터 블록 제거
function stripMetaBlock(content) {
  const lines = content.split('\n');
  const result = [];
  let state = 'title';
  let titleFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!titleFound && line.startsWith('# ')) {
      titleFound = true;
      state = 'meta';
      result.push(line);
      continue;
    }

    if (state === 'meta') {
      if (line.match(/^\*\*(작성|카테고리|읽는\s*시간|난이도|코드)\*\*/)) {
        continue;
      }
      if (line.trim() === '') {
        continue;
      }
      if (line.trim() === '---') {
        state = 'content';
        result.push('');
        continue;
      }
      state = 'content';
      result.push(line);
      continue;
    }

    result.push(line);
  }

  return result.join('\n').replace(/^\n+/, '');
}

// Jekyll frontmatter 생성
function buildFrontmatter(fields) {
  const lines = ['---'];

  const titleNeedsQuote = fields.title.includes(':') || fields.title.includes('"');
  if (titleNeedsQuote) {
    const escapedTitle = fields.title.replace(/"/g, '\\"');
    lines.push(`title: "${escapedTitle}"`);
  } else {
    lines.push(`title: "${fields.title}"`);
  }

  lines.push(`date: ${fields.date} 09:00:00 +0900`);
  lines.push(`author: freelang`);

  if (fields.categories && fields.categories.length > 0) {
    const mainCat = PHASE_CATEGORIES[fields.phase] || 'General';
    lines.push(`categories: [${mainCat}]`);
  }

  if (fields.tags && fields.tags.length > 0) {
    const tagStr = fields.tags.map((t) => `"${t}"`).join(', ');
    lines.push(`tags: [${tagStr}]`);
  }

  if (fields.readingTime) {
    lines.push(`reading_time: "${fields.readingTime}"`);
  }

  if (fields.difficulty) {
    lines.push(`difficulty: "${fields.difficulty}"`);
  }

  lines.push(`toc: true`);
  lines.push(`comments: true`);
  lines.push('---');

  return lines.join('\n');
}

// ──────────────────────────────────────────────
// 메인 변환 로직
// ──────────────────────────────────────────────
function convertFile(srcPath) {
  const filename = path.basename(srcPath);
  const parsed = parseFilename(filename);
  if (!parsed) {
    console.warn(`  SKIP: ${filename} (파일명 패턴 불일치)`);
    return false;
  }

  const rawContent = fs.readFileSync(srcPath, 'utf8');

  const title = extractTitle(rawContent);
  const date = extractDate(rawContent);
  const categories = extractCategories(rawContent);
  const readingTime = extractReadingTime(rawContent);
  const difficulty = extractDifficulty(rawContent);
  const tags = buildTags(categories, parsed.phase);

  const outputFilename = `${date}-${parsed.slug}.md`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  const frontmatter = buildFrontmatter({
    title,
    date,
    phase: parsed.phase,
    categories,
    tags,
    readingTime,
    difficulty,
  });

  const cleanContent = stripMetaBlock(rawContent);
  const output = frontmatter + '\n\n' + cleanContent;

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`  OK: ${filename} → _posts/${outputFilename}`);
  return true;
}

// ──────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────
function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`생성: ${OUTPUT_DIR}`);
  }

  const files = fs.readdirSync(SOURCE_DIR)
    .filter((f) => f.match(/^Phase\d+-\d+-.*\.md$/))
    .sort();

  console.log(`\n변환 시작: ${files.length}개 파일\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const ok = convertFile(srcPath);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n✅ 완료: 성공 ${success}개, 실패 ${failed}개`);
  console.log(`📂 출력 디렉토리: ${OUTPUT_DIR}\n`);
}

main();
