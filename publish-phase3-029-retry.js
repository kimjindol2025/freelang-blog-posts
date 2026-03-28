const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');

const credPath = '/data/data/com.termux/files/home/.claude/.credentials.json';
const tokenPath = '/data/data/com.termux/files/home/.claude/.token.json';

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const {client_id, client_secret, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    try {
        let token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        oauth2Client.setCredentials(token);
        
        // 토큰 갱신 (24시간 전)
        if (token.expiry_date && new Date() > new Date(token.expiry_date)) {
            console.log('🔄 토큰 갱신 중...');
            const {credentials: newCreds} = await oauth2Client.refreshAccessToken();
            token = newCreds;
            fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
            console.log('✅ 토큰 갱신 완료');
        }
        return oauth2Client;
    } catch (err) {
        console.error('❌ 인증 실패:', err);
        process.exit(1);
    }
}

function markdownToHtml(md) {
    return md
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.+<\/li>)/s, '<ul>$1</ul>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\n\n+/g, '</p><p>')
        .replace(/^(?!<[^>]+>)/gm, '<p>')
        .replace(/(?<![>d])$/gm, '</p>')
        .replace(/<p><\/p>/g, '');
}

async function publishPost(blogger, postPath, title, labels) {
    const content = fs.readFileSync(postPath, 'utf8');
    const htmlContent = markdownToHtml(content);
    
    const resource = {
        title: title,
        content: htmlContent,
        labels: labels,
        status: 'LIVE'
    };

    try {
        const res = await blogger.posts.insert({
            blogId: '8388173922989320815',
            resource: resource,
            isDraft: false
        });
        return res.data;
    } catch (err) {
        throw err;
    }
}

async function main() {
    const auth = await authorize();
    const blogger = google.blogger({version: 'v3', auth});

    console.log('🚀 Phase 3-029 재시도 (B-Tree vs LSM)');
    
    const postPath = '/data/data/com.termux/files/home/dev/blogger-automation/Phase3-029-B-Tree-vs-LSM.md';
    const title = '데이터 구조: B-Tree vs LSM 트레이드오프';
    const labels = ['데이터베이스', '성능', '자료구조'];

    try {
        console.log('📤 발행 중: ' + title);
        const result = await publishPost(blogger, postPath, title, labels);
        console.log('✅ 발행 완료');
        console.log('🔗 URL: https://bigwash2026.blogspot.com/' + result.url.split('/').pop());
        console.log('\n✨ Phase 3 완성! (20/20)');
    } catch (err) {
        console.error('❌ 실패:', err.message);
        if (err.message.includes('quotaExceeded')) {
            console.log('\n⏳ API 할당량 초과. 내일 00:00 UTC 후 재시도하세요.');
        }
        process.exit(1);
    }
}

main();
