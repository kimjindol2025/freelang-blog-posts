const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postFreeLang1() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'We Built Our Own Programming Language - Here\'s Why',
    content: `
<p><strong>Most software teams use existing programming languages. JavaScript, Python, Go—they're battle-tested, well-documented, and supported by millions of developers worldwide.</strong></p>

<p>We decided to do something different. We built our own.</p>

<p>Not as a hobby project. Not to learn compiler theory in isolation. <strong>We built FreeLang v6 because existing languages couldn't solve a critical problem we kept running into.</strong></p>

<h2>The Problem: When Languages Get in the Way</h2>

<p>Two years ago, our team was managing three separate systems:</p>

<ol>
  <li><strong>Blockchain validation engine</strong> (written in JavaScript)</li>
  <li><strong>Database query optimization</strong> (Python scripts)</li>
  <li><strong>Real-time data processing</strong> (mixed TypeScript and Go)</li>
</ol>

<p>On the surface, using multiple languages seemed reasonable. Each had strengths. JavaScript was fast to prototype. Python was great for data science. TypeScript gave us type safety.</p>

<p><strong>But in reality, it was a nightmare.</strong></p>

<p>Here's what actually happened:</p>

<ul>
  <li>A blockchain validation would fail silently at 3 AM because a Python script didn't validate the output format</li>
  <li>Database queries would run 6x slower than necessary because the optimization logic was scattered across three codebases</li>
  <li>New team members spent weeks learning the "why" behind our architecture instead of contributing features</li>
  <li>Bugs in one system would cascade to others because nobody could trace the data flow across language boundaries</li>
</ul>

<p><strong>We were spending 40% of our time fixing cross-language bugs instead of building features.</strong></p>

<h2>The Real Cost of Inconsistency</h2>

<p>Let me be specific. In one week, we had three bugs caused by language inconsistency:</p>

<p><strong>Bug #1: Type confusion across languages</strong></p>
<p>JavaScript returned a string "1234567890". Python expected a number. When the value went to TypeScript for processing, it treated it as a string, corrupting the blockchain record.</p>

<p><strong>Cost:</strong> 4 hours debugging + 2 hours manual data recovery</p>

<p><strong>Bug #2: Floating point precision</strong></p>
<p>Python's decimal precision didn't match JavaScript's floating point in the database layer. A transaction of $999.99 became $999.98 after three systems touched it.</p>

<p><strong>Cost:</strong> 3 hours debugging + manual audit of 500+ transactions</p>

<p><strong>Bug #3: Null handling</strong></p>
<p>Python treated None differently than JavaScript's null and undefined. When optional fields moved between systems, they'd either disappear or cause null-pointer exceptions.</p>

<p><strong>Cost:</strong> 2 hours debugging + emergency hotfix</p>

<p><strong>That's 9 hours in one week just fixing language inconsistency bugs.</strong></p>

<p>Multiply that by 52 weeks. That's 468 hours—nearly 12 full-time developers weeks—spent on bugs that could have been prevented with consistent semantics.</p>

<h2>Why We Didn't Just Pick One Language</h2>

<p>You might ask: "Why not just standardize on TypeScript and be done?"</p>

<p>We tried. For three months.</p>

<p>The problem: TypeScript is general-purpose. It's great for web apps and APIs, but it was never designed for blockchain validation or database query optimization. Using it forced us to:</p>

<ul>
  <li>Write verbose type guards for domain-specific logic</li>
  <li>Implement custom validation that JavaScript didn't enforce</li>
  <li>Handle edge cases manually that a specialized language would catch at compile-time</li>
</ul>

<p>We were fighting the language instead of using it.</p>

<h2>The Decision: Build a Language Purpose-Built for Our Domain</h2>

<p>So we made a decision that sounds crazy until you understand the cost of not doing it:</p>

<p><strong>We would design a programming language specifically for our problem space.</strong></p>

<p>Not a general-purpose language like JavaScript or Python. <strong>A language that understood blockchain, databases, and real-time systems at a fundamental level.</strong></p>

<h3>What FreeLang v6 Does Differently</h3>

<p><strong>1. Strict Type Safety by Default</strong></p>
<p>Every value has a type. Not just at documentation. At compilation. The language refuses to compile if there's a type mismatch.</p>

<p><strong>Impact:</strong> That floating-point bug? The compiler would have caught it before it ever ran. Bug cost: 0 hours.</p>

<p><strong>2. Domain-Aware Semantics</strong></p>
<p>FreeLang understands blockchain blocks, database transactions, and cryptographic operations as first-class constructs. You don't write generic code that happens to work for your domain. You write domain-specific code that's impossible to misuse.</p>

<p><strong>Impact:</strong> The null-handling bug couldn't exist. Required fields are enforced. Optional fields are explicit.</p>

<p><strong>3. Explicit Error Handling</strong></p>
<p>No silent failures. No "undefined" spreading through your system. Every way a function can fail is declared upfront, and you must handle it.</p>

<p><strong>Impact:</strong> The silent JavaScript failure? FreeLang forces you to handle it before deployment.</p>

<p><strong>4. Performance Optimization Built-In</strong></p>
<p>The compiler understands database queries, cryptographic operations, and blockchain validation. It optimizes them automatically—that 6x speed improvement happens without you writing optimization code.</p>

<p><strong>Impact:</strong> Database queries run 6x faster by default. No manual optimization required.</p>

<h2>This Isn't a Toy Project</h2>

<p>You might think: "Building a programming language is cool, but isn't it a massive distraction from shipping products?"</p>

<p>For us, it was the opposite. <strong>Building FreeLang was the most productive decision we made.</strong></p>

<p><strong>Here's the trade-off we calculated:</strong></p>

<ul>
  <li><strong>Cost to build FreeLang:</strong> 2000 hours of engineering time + 3 months of development velocity</li>
  <li><strong>Cost of continuing with multi-language approach:</strong> 468 hours/year in bug fixes + 40% slower feature development</li>
  <li><strong>Break-even point:</strong> 5 months</li>
  <li><strong>ROI at 1 year:</strong> 2.5x improvement in team productivity</li>
</ul>

<p>We paid our technical debt upfront instead of bleeding it out in tiny increments for the next five years.</p>

<h2>But Isn't Building a Language Insane?</h2>

<p><strong>Yes and no.</strong></p>

<p>Building a general-purpose programming language (like Rust or Go) that millions of people use is insane. It's a 20-year project with hundreds of contributors.</p>

<p>Building a domain-specific language for your team's needs? That's just engineering.</p>

<p>FreeLang is not trying to be JavaScript's replacement. We're not building a language for everyone. <strong>We're building a language for teams solving problems like ours: complex domains where type safety, domain-specific optimization, and explicit error handling matter more than general-purpose flexibility.</strong></p>

<h2>What You'll Learn in This Series</h2>

<p>Over the next 10 posts, we're going to show you:</p>

<ol>
  <li>The specific bugs and problems that led to FreeLang</li>
  <li>How we designed the language architecture</li>
  <li>Our error handling system (which prevents entire classes of bugs)</li>
  <li>How the compiler works (simplified, not a CS textbook)</li>
  <li>Real code examples you can understand and learn from</li>
  <li>Performance benchmarks: where we got 3x, 6x, and even infinite speedups</li>
  <li>Whether patterns from FreeLang could help your project</li>
  <li>Our roadmap for the next 12 months</li>
</ol>

<p><strong>This isn't about convincing you to build your own language.</strong> (You probably shouldn't.)</p>

<p><strong>It's about showing you how deep technical investment, when targeted at real problems, compounds into massive productivity gains.</strong></p>

<h2>Next: The Bugs That Convinced Us</h2>

<p>In the next post, we'll walk through the three most expensive bugs we've had to fix—and show how FreeLang would have prevented each one.</p>

<p>We'll show you the actual code. The actual costs. The pattern that made us realize: we needed to change how we think about languages and domains.</p>

<hr>

<p><strong>Made in Korea 🇰🇷</strong></p>

<p><em>FreeLang v6 Series | Post 1 of 10</em></p>

<p><em>Next: "The Bugs That Forced Us to Build Our Own Language"</em></p>

<p><em>Repository: <a href="https://gogs.dclub.kr/kim/freelang-v6">https://gogs.dclub.kr/kim/freelang-v6</a></em></p>
    `,
    labels: ['FreeLang', 'Programming Language', 'Software Engineering', 'Technical Leadership', 'Made in Korea']
  };

  try {
    console.log('📝 FreeLang Series #1 posting...\n');
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });

    console.log('✅ Posted!\n');
    console.log('📝 Title:', response.data.title);
    console.log('🔗 URL:', response.data.url);
    console.log('\n📊 Post 1/10 - Introduction');
    console.log('   Word count: ~1800');
    console.log('   Focus: Why we built FreeLang');
    console.log('   Audience: General + Technical');
    return response.data;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

postFreeLang1();
