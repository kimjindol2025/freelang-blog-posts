#!/usr/bin/env node

/**
 * 자동 생성된 프로젝트 포스트를 모두 Blogger에 게시
 * ~/.blogger-posts-output 내 모든 metadata.json 파일 처리
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';
const OUTPUT_DIR = path.join(process.env.HOME, '.blogger-posts-output');
const PUBLISH_LOG = path.join(OUTPUT_DIR, 'publishing-log.json');

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

async function findAllMetadataFiles() {
  const metadataFiles = [];

  const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'metadata.json') {
        metadataFiles.push(filePath);
      }
    }
  };

  walkDir(OUTPUT_DIR);
  return metadataFiles;
}

async function publishPost(blogger, postData) {
  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });
    return { success: true, url: res.data.url, id: res.data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function publishAllPosts() {
  console.log('🚀 자동 생성 포스트 일괄 게시 시작\n');

  const blogger = await getAuthenticatedBlogger();
  const metadataFiles = await findAllMetadataFiles();

  console.log(`📊 발견된 metadata 파일: ${metadataFiles.length}개\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < metadataFiles.length; i++) {
    const metadataPath = metadataFiles[i];

    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath));
      const projectName = path.basename(path.dirname(metadataPath));

      console.log(`[${i+1}/${metadataFiles.length}] 📝 게시 중: ${projectName}`);

      // metadata의 posts 배열에서 각 포스트 게시
      if (metadata.posts && Array.isArray(metadata.posts)) {
        for (const post of metadata.posts) {
          if (!post.title || !post.content) {
            console.log(`  ⚠️  스킵 (불완전): ${post.title || '제목 없음'}`);
            continue;
          }

          const postData = {
            title: post.title,
            content: post.content,
            labels: post.labels || [projectName],
          };

          const result = await publishPost(blogger, postData);

          if (result.success) {
            console.log(`  ✅ ${post.title}`);
            successCount++;
            results.push({
              project: projectName,
              post: post.title,
              status: 'success',
              url: result.url,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.log(`  ❌ ${post.title}: ${result.error}`);
            errorCount++;
            results.push({
              project: projectName,
              post: post.title,
              status: 'error',
              error: result.error,
              timestamp: new Date().toISOString(),
            });
          }

          // API 레이트 제한 방지 (5초 대기)
          if (i < metadataFiles.length - 1 || metadata.posts.indexOf(post) < metadata.posts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

    } catch (err) {
      console.error(`  ❌ 처리 실패: ${err.message}`);
      errorCount++;
      results.push({
        file: metadataPath,
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 결과 저장
  fs.writeFileSync(PUBLISH_LOG, JSON.stringify(results, null, 2));

  // 최종 보고
  console.log('\n═══════════════════════════════════════');
  console.log('📈 게시 완료');
  console.log('═══════════════════════════════════════');
  console.log(`✅ 성공: ${successCount}`);
  console.log(`❌ 실패: ${errorCount}`);
  console.log(`📋 로그: ${PUBLISH_LOG}`);
}

publishAllPosts().catch(err => {
  console.error('❌ 게시 실패:', err);
  process.exit(1);
});
