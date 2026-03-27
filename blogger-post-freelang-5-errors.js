const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postFreeLang5() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Error Handling System: Making Bugs Traceable',
    content: `
<p><strong>The biggest waste in debugging isn't fixing the bug. It's finding the bug.</strong></p>

<p>We built FreeLang's error system to make bugs findable in seconds, not hours.</p>

<h2>The Problem With Generic Errors</h2>

<p>In JavaScript, this happens constantly:</p>

<pre>
try {
  processTransaction(tx);
} catch (error) {
  console.log('Error: ' + error.message);
  // Now what? Was it a network issue? Invalid input? Corrupt data?
}
</pre>

<p>The error tells you <em>something</em> went wrong. Not <em>what</em> or <em>why</em>.</p>

<p>Result: 3 hours of debugging to find out it was a validation error that should have been caught in 30 seconds.</p>

<h2>FreeLang's Hierarchical Error System</h2>

<p>We organized errors into five categories:</p>

<pre>
FreeLangError (base class)
├─ ValidationError       (input is invalid)
│  ├─ InvalidAddressError
│  ├─ InvalidAmountError
│  └─ InvalidKeyError
├─ StateError           (system state is inconsistent)
│  ├─ InsufficientBalanceError
│  ├─ DoubleSpendError
│  └─ OrphanBlockError
├─ CryptoError          (cryptographic operation failed)
│  ├─ InvalidSignatureError
│  └─ HashMismatchError
└─ NetworkError         (network communication failed)
   ├─ PeerConnectionError
   └─ SyncError
</pre>

<p>Each error has:</p>

<ul>
  <li><strong>Code:</strong> Programmatic identifier (INVALID_ADDRESS, INSUFFICIENT_BALANCE)</li>
  <li><strong>Message:</strong> Human-readable description</li>
  <li><strong>Context:</strong> Additional data (amounts, addresses, timestamps)</li>
  <li><strong>Timestamp:</strong> When the error occurred (ISO 8601)</li>
</ul>

<h2>Real Example: Debugging a Transaction</h2>

<p><strong>Scenario:</strong> User reports: "My transaction disappeared!"</p>

<p><strong>Without structured errors:</strong></p>

<pre>
Error: failed to process
  at processTransaction (ledger.js:120)
  at executeAPI (api.js:45)
</pre>

<p>You have: a line number. You need: WHY it failed.</p>

<p><strong>With FreeLang:</strong></p>

<pre>
{
  "type": "InsufficientBalanceError",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Account balance 500 < required 1000",
  "timestamp": "2026-03-27T14:32:45.123Z",
  "context": {
    "accountId": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0",
    "balance": 500,
    "required": 1000,
    "operation": "transfer"
  }
}
</pre>

<p><strong>Instant diagnosis:</strong> Account doesn't have enough funds. The transaction is <em>waiting</em> for deposit, not missing.</p>

<h2>Error Handling Code</h2>

<p>In FreeLang, you handle different error types differently:</p>

<pre>
try {
  await transaction.execute();
} catch (error) {
  if (error instanceof InvalidAddressError) {
    // User input validation failed - ask for correction
    return userError('Please use valid address format');
  }
  else if (error instanceof InsufficientBalanceError) {
    // Business logic - check balance first
    return userError('Not enough funds. Current: ' +
      error.context.balance);
  }
  else if (error instanceof NetworkError) {
    // Retry after delay
    return retry(transaction, 5000);
  }
  else if (error instanceof FreeLangError) {
    // Log for investigation
    logger.error(error.toJSON());
    return serverError('Internal error, our team is investigating');
  }
}
</pre>

<p>Each error type has a specific recovery strategy. You're not guessing. You're responding appropriately.</p>

<h2>The Debugging Timeline</h2>

<p><strong>Old approach (generic errors):</strong></p>

<ul>
  <li>1 hour: Reproduce the error</li>
  <li>1.5 hours: Add logging, rerun</li>
  <li>1 hour: Trace through code</li>
  <li>30 minutes: Find root cause</li>
  <li><strong>Total: 4 hours</strong></li>
</ul>

<p><strong>FreeLang approach (structured errors):</strong></p>

<ul>
  <li>5 minutes: Read error JSON from logs</li>
  <li>1 minute: Understand the category and context</li>
  <li>4 minutes: Find the 3 lines of code that match</li>
  <li><strong>Total: 10 minutes</strong></li>
</ul>

<p><strong>Debugging is 24x faster.</strong></p>

<h2>Automatic Context Tracking</h2>

<p>Here's the powerful part: developers don't need to remember to add context. The error class does it automatically:</p>

<pre>
throw new InvalidAddressError(
  'User provided invalid address',
  {
    userInput: addr,
    operation: 'transfer',
    timestamp: Date.now()
  }
);
// Message, code, timestamp all added automatically
</pre>

<p>The error system captures what mattered, in the format that helps debugging.</p>

<h2>Error Monitoring at Scale</h2>

<p>Structured errors make monitoring trivial:</p>

<pre>
// Count errors by type
SELECT type, COUNT(*) FROM error_log GROUP BY type;

// Find all InsufficientBalanceErrors in last hour
SELECT * FROM error_log
WHERE type = 'InsufficientBalanceError'
AND timestamp > now() - interval '1 hour'
ORDER BY timestamp DESC;

// Identify patterns
SELECT context.operation, COUNT(*)
FROM error_log
WHERE type = 'NetworkError'
GROUP BY context.operation
ORDER BY count DESC;
</pre>

<p>You can ask sophisticated questions about failure patterns instantly.</p>

<h2>Next: The P0 Improvement Strategy</h2>

<p>We've completed error handling. Now we're making our APIs consistent and predictable. In the next post, we'll show you Phase 2 of our improvements and why it matters for scaling.</p>

<hr>

<p><strong>Made in Korea 🇰🇷</strong></p>

<p><em>FreeLang v6 Series | Post 5 of 10</em></p>

<p><em>Next: \"P0 Improvements: Making Our APIs Consistent\"</em></p>
    `,
    labels: ['FreeLang', 'Error Handling', 'Debugging', 'Engineering', 'Code Review', 'Made in Korea']
  };

  try {
    console.log('📝 FreeLang Series #5 posting...\n');
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });

    console.log('✅ Posted!\n');
    console.log('📝 Title:', response.data.title);
    console.log('🔗 URL:', response.data.url);
    console.log('\n📊 Post 5/10 completed');
    return response.data;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

postFreeLang5();
