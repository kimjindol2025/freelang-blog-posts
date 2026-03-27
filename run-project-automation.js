#!/usr/bin/env node

/**
 * 220 프로젝트 자동화 실행기
 *
 * 각 프로젝트에 대해:
 * 1. ProjectPostGenerator로 분석
 * 2. 10개 포스트 생성
 * 3. 메타데이터 저장
 */

const fs = require('fs');
const path = require('path');
const { ProjectPostGenerator } = require('./generate-project-posts.js');

const PROJECTS_BASE = path.join(process.env.HOME, '.projects');
const OUTPUT_DIR = path.join(process.env.HOME, '.blogger-posts-output');

// 생성 로그
const LOG_FILE = path.join(OUTPUT_DIR, 'generation-log.json');

async function getProjects() {
  const categories = ['core', 'modules', 'archived', 'tools', 'experiments'];
  const projects = [];

  for (const category of categories) {
    const categoryPath = path.join(PROJECTS_BASE, category);
    if (!fs.existsSync(categoryPath)) continue;

    const items = fs.readdirSync(categoryPath);
    for (const item of items) {
      const itemPath = path.join(categoryPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        projects.push({
          path: itemPath,
          name: item,
          category: category
        });
      }
    }
  }

  return projects;
}

async function runAutomation() {
  console.log('🚀 220프로젝트 자동화 시작\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const projects = await getProjects();
  console.log(`📊 발견된 프로젝트: ${projects.length}개\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 모든 프로젝트 처리
  const testProjects = projects;

  for (const project of testProjects) {
    console.log(`\n📝 처리 중: ${project.category}/${project.name}`);

    try {
      const generator = new ProjectPostGenerator(project.path);
      const result = await generator.generate();

      if (result.status === 'success') {
        console.log(`  ✅ ${project.name}: ${result.postCount} 포스트 생성`);
        successCount++;
      } else {
        console.log(`  ⚠️  ${project.name}: 오류 - ${result.error}`);
        errorCount++;
      }

      results.push({
        projectName: project.name,
        category: project.category,
        timestamp: new Date().toISOString(),
        status: result.status,
        postCount: result.postCount || 0,
        error: result.error || null
      });

    } catch (err) {
      console.error(`  ❌ ${project.name}: ${err.message}`);
      errorCount++;
      results.push({
        projectName: project.name,
        category: project.category,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: err.message
      });
    }

    // API 레이트 제한 방지
    if (testProjects.indexOf(project) < testProjects.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 결과 저장
  console.log('\n\n📊 결과 저장 중...');
  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));

  // 최종 보고
  console.log('\n═══════════════════════════════════════');
  console.log('📈 최종 결과');
  console.log('═══════════════════════════════════════');
  console.log(`✅ 성공: ${successCount}/${testProjects.length}`);
  console.log(`❌ 실패: ${errorCount}/${testProjects.length}`);
  console.log(`📂 출력 위치: ${OUTPUT_DIR}`);
  console.log(`📋 로그: ${LOG_FILE}`);
  console.log('\n다음 단계: 생성된 포스트를 Blogger에 발행');
}

runAutomation().catch(err => {
  console.error('❌ 자동화 실패:', err);
  process.exit(1);
});
