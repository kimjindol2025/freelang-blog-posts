const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

const POSTS = [
  {
    filename: 'Phase4-041-Smart-Contracts.md',
    title: '스마트 컨트랙트: 블록체인에서 코드가 법이 되다'
  },
  {
    filename: 'Phase4-042-ZK-Rollups.md',
    title: 'ZK-Rollup과 영지식 증명: 확장성과 보안의 완벽한 균형'
  },
  {
    filename: 'Phase4-043-DeFi-AMM.md',
    title: 'DeFi와 AMM: 스스로 가격을 정하는 프로토콜'
  },
  {
    filename: 'Phase4-044-Eventual-Consistency.md',
    title: '최종 일관성(Eventual Consistency): 분산 시스템의 현실적 타협'
  },
  {
    filename: 'Phase4-045-Stream-Processing.md',
    title: '스트림 처리(Stream Processing): 실시간 데이터 파이프라인의 핵심'
  }
];

async function publishPost(blogger, content, title) {
  try {
    const result = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: {
        title: title,
        content: content,
        labels: ['Phase4', '심화기술', '분산시스템']
      }
    });
    return { success: true, url: result.data.url, id: result.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    credentials.web.redirect_uris[0]
  );
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({
    version: 'v3',
    auth: oauth2Client
  });

  console.log('🚀 Phase 4 Batch 3 게시 시작 (마지막 5개 포스트)\n');
  let published = 0;
  let failed = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const { filename, title } = POSTS[i];
    const filePath = path.join(process.env.HOME, 'dev/blogger-automation', filename);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${filename} 없음`);
      failed++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`📝 게시 중: "${title}"...`);

    const result = await publishPost(blogger, content, title);

    if (result.success) {
      console.log(`✅ 게시 완료\n   URL: ${result.url}\n`);
      published++;
    } else {
      console.log(`❌ 게시 실패: ${result.error}\n`);
      failed++;
    }

    if (i < POSTS.length - 1) {
      console.log('⏳ 10초 대기 중...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n📊 최종 결과: ${published}/${POSTS.length} 성공, ${failed} 실패`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
