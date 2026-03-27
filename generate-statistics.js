#!/usr/bin/env node

/**
 * 자동 생성된 포스트 통계 분석
 * 생성된 포스트 수, 단어 수, 카테고리별 분포 등 계산
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(process.env.HOME, '.blogger-posts-output');
const STATS_FILE = path.join(OUTPUT_DIR, 'statistics.json');

function generateStatistics() {
  console.log('📊 통계 생성 중...\n');

  const stats = {
    timestamp: new Date().toISOString(),
    total: {
      projects: 0,
      posts: 0,
      words: 0,
      metadata_files: 0,
    },
    by_category: {},
    by_project: [],
    top_projects: [],
  };

  // 모든 메타데이터 파일 수집
  const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return [];
    const metadataFiles = [];

    const walk = (currentDir) => {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walk(filePath);
        } else if (file === 'metadata.json') {
          metadataFiles.push(filePath);
        }
      }
    };

    walk(dir);
    return metadataFiles;
  };

  const metadataFiles = walkDir(OUTPUT_DIR);
  stats.total.metadata_files = metadataFiles.length;

  console.log(`📝 발견된 metadata 파일: ${metadataFiles.length}개\n`);

  for (const metadataPath of metadataFiles) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath));
      const relativePath = path.relative(OUTPUT_DIR, metadataPath);
      const category = path.dirname(relativePath).split('/')[0] || 'root';
      const projectName = metadata.project || path.basename(path.dirname(metadataPath));

      // 카테고리별 통계
      if (!stats.by_category[category]) {
        stats.by_category[category] = {
          projects: 0,
          posts: 0,
          words: 0,
        };
      }

      // 포스트 수와 단어 수 계산
      const postCount = metadata.posts ? metadata.posts.length : 0;
      let wordCount = 0;

      if (metadata.posts) {
        metadata.posts.forEach(post => {
          // 간단한 단어 수 추정 (공백 기준)
          const content = post.content || '';
          const title = post.title || '';
          wordCount += (content.split(/\s+/).length + title.split(/\s+/).length);
        });
      }

      // 통계 누적
      stats.total.projects++;
      stats.total.posts += postCount;
      stats.total.words += wordCount;

      stats.by_category[category].projects++;
      stats.by_category[category].posts += postCount;
      stats.by_category[category].words += wordCount;

      // 프로젝트별 상세 정보
      stats.by_project.push({
        name: projectName,
        category: category,
        posts: postCount,
        words: wordCount,
        path: relativePath,
      });

    } catch (err) {
      console.warn(`⚠️  ${metadataPath} 파싱 실패: ${err.message}`);
    }
  }

  // 상위 프로젝트 계산
  stats.top_projects = stats.by_project
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 10);

  // 결과 저장
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

  // 결과 출력
  console.log('═══════════════════════════════════════');
  console.log('📈 생성 통계 (수집 완료)');
  console.log('═══════════════════════════════════════\n');

  console.log(`📊 총계:`);
  console.log(`  • 프로젝트: ${stats.total.projects}개`);
  console.log(`  • 포스트: ${stats.total.posts}개`);
  console.log(`  • 총 단어: ${stats.total.words.toLocaleString()}개\n`);

  console.log(`📁 카테고리별 분포:`);
  Object.entries(stats.by_category).forEach(([category, data]) => {
    console.log(`  • ${category}: ${data.projects}프로젝트, ${data.posts}포스트, ${data.words.toLocaleString()}단어`);
  });

  console.log(`\n🏆 상위 10 프로젝트:`);
  stats.top_projects.forEach((proj, i) => {
    console.log(`  ${i+1}. ${proj.name} (${proj.category}): ${proj.posts}포스트, ${proj.words}단어`);
  });

  console.log(`\n📋 상세 통계: ${STATS_FILE}`);
  console.log(`⏱️  생성 시간: ${stats.timestamp}`);
}

generateStatistics();
