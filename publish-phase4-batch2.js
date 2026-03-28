const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

const POSTS = [
  {
    filename: 'Phase4-036-Memory-Model-JMM.md',
    title: 'Java Memory Model (JMM): Happens-Before와 Race Detection'
  },
  {
    filename: 'Phase4-037-Compiler-Optimization.md',
    title: '컴파일러 최적화: 인라인, 루프 언롤, 불변식 제거'
  },
  {
    filename: 'Phase4-038-Type-System.md',
    title: '타입 시스템: Hindley-Milner, Gradual Typing, Rust Ownership'
  },
  {
    filename: 'Phase4-039-GC-Algorithms.md',
    title: 'GC 알고리즘: Mark-Sweep, Generational, Concurrent G1GC'
  },
  {
    filename: 'Phase4-040-Polymorphism.md',
    title: '다형성(Polymorphism): 매개변수, 임시, 서브타입 비교'
  }
];

async function publishPost(blogger, content, title) {
  try {
    const result = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: {
        title: title,
        content: content,
        labels: ['Phase4', '고급기술', '성능']
      }
    });
    return { success: true, url: result.data.url, id: result.data.id };
  } catch (err) {
    return { success: false, error: err.message };
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
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  console.log('🚀 Phase 4 Batch 2 게시 시작 (5개 포스트)\n');
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

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
