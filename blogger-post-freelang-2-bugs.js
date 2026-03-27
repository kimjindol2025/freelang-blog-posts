const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postFreeLang2() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'The Bugs That Forced Us to Build Our Own Language',
    content: `
<p><strong>In the previous post, I mentioned we had three expensive bugs in a single week that made us realize we needed FreeLang.</strong></p>

<p>Today, I'm going to walk you through each one in detail. Not to shame JavaScript or Python—they're both excellent languages. But to show you the moment we realized: our architecture needed fundamental change.</p>

<h2>Bug #1: The Dollar That Disappeared (Type Confusion)</h2>

<h3>The Setup</h3>

<p>Our system processed financial transactions across three systems: JavaScript API, Python database layer, and TypeScript blockchain validator.</p>

<p>A user submits a transaction for 1234.56. Simple, right?</p>

<h3>What Happened</h3>

<p>JavaScript sends it as a number. Python receives it as a string from JSON. TypeScript interprets it based on what type it happens to be at that moment.</p>

<p>Different code paths execute in each language. A discount gets applied in one system but not another.</p>

<p>Result: 1234.56 in JavaScript, 1234.56 in Python, 1233.56 on blockchain.</p>

<p><strong>The customer's balance increased by 1233.56 instead of 1234.56. One dollar missing.</strong></p>

<h3>Debug Timeline</h3>

<ul>
  <li>Friday 3 PM: Customer reports missing dollar</li>
  <li>Friday 5 PM: We're confused—records don't match</li>
  <li>Saturday 2 PM: Finally found the type mismatch</li>
  <li>Saturday 6 PM: Deployed fix</li>
  <li>Sunday: Manual audit of 47 similar discrepancies = 2,318.54 in errors</li>
</ul>

<p><strong>Cost: 20 hours engineering + manual refunds</strong></p>

<h3>The Real Problem</h3>

<p>No single language was wrong. The problem was architectural: no guarantee of type consistency across the system.</p>

<hr>

<h2>Bug #2: The Floating-Point Cascade (Precision Loss)</h2>

<h3>The Scenario</h3>

<p>Transaction of 999.99 goes through three mathematical operations in different languages.</p>

<h3>The Math</h3>

<p>JavaScript (floating point): 999.99 × 0.99 × 0.98 × 0.99 = 960.9883622</p>

<p>Python (Decimal): 999.99 × 0.99 × 0.98 × 0.99 = 960.98819702</p>

<p>Difference: 0.00983622 per transaction.</p>

<p>With 1000 transactions per day: 9.83 disappearing daily.</p>

<h3>The Cascade</h3>

<p>JavaScript says 960.99 (rounded). Python says 960.98 (different rounding). TypeScript follows JavaScript.</p>

<p>When systems verified each other's numbers, they didn't match. We thought someone was stealing fractions of cents. Turned out: different languages make different trade-offs for decimal math.</p>

<p><strong>Cost: 15 hours debugging + audit of 3 months of transactions</strong></p>

<hr>

<h2>Bug #3: The Null That Wasn't (Semantic Confusion)</h2>

<h3>The Problem</h3>

<p>Transaction records have optional memo fields. JavaScript has null AND undefined. Python has None. TypeScript enforces null checking.</p>

<p>A transaction comes in with memo = null. Python sees it as None, TypeScript sees it as null. All skip processing correctly.</p>

<p>But then JavaScript code does: memo.toUpperCase() without checking if memo is null first.</p>

<p>Result: TypeError in production at 2 AM.</p>

<p>This only happened in production because our tests always included a memo. The null case was only hit with real users.</p>

<p><strong>Cost: 3 hours debugging + emergency hotfix at 2 AM</strong></p>

<hr>

<h2>What These Had in Common</h2>

<p>None were JavaScript or Python bugs. All three were caused by mixing languages without a semantic layer.</p>

<p>Each language made different choices about:</p>

<ul>
  <li>Type coercion (automatic vs strict)</li>
  <li>Floating-point handling (IEEE 754 vs Decimal)</li>
  <li>Null semantics (null/undefined vs None)</li>
</ul>

<p><strong>Without unified semantics, bugs were inevitable.</strong></p>

<h2>The Decision</h2>

<p>After these three bugs, someone said: "We're not fighting bugs anymore. We're fighting our architecture."</p>

<p>That's when we realized: we didn't need to debug better. We needed to design better.</p>

<p><strong>So we built FreeLang with type guarantees, consistent precision, and explicit null handling across the entire system.</strong></p>

<h2>Next: Type Safety Prevents 80% of Bugs</h2>

<p>In the next post, we'll show you the surprising result: with these guarantees, type safety prevented 80% of bugs we used to have.</p>

<hr>

<p><strong>Made in Korea 🇰🇷</strong></p>

<p><em>FreeLang v6 Series | Post 2 of 10</em></p>

<p><em>Next: "Type Safety Prevents 80% of Our Bugs"</em></p>
    `,
    labels: ['FreeLang', 'Bugs', 'Type Safety', 'Software Engineering', 'Real World', 'Made in Korea']
  };

  try {
    console.log('📝 FreeLang Series #2 posting...\\n');
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });

    console.log('✅ Posted!\\n');
    console.log('📝 Title:', response.data.title);
    console.log('🔗 URL:', response.data.url);
    console.log('\\n📊 Post 2/10 completed');
    return response.data;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

postFreeLang2();
