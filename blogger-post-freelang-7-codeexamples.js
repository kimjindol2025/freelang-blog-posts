const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postFreeLang7() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Real Code Examples: FreeLang in Production',
    content: `
<p><strong>Reading about type safety is one thing. Seeing it in production code is another.</strong></p>

<p>Here are real examples from our blockchain and database systems.</p>

<h2>Example 1: Transaction Validation</h2>

<p><strong>The Problem:</strong> Transactions must validate amounts, addresses, and signatures before processing.</p>

<p><strong>FreeLang code:</strong></p>

<pre>
type Transaction = {
  from: Address,
  to: Address,
  amount: Money,
  signature: Signature,
  timestamp: DateTime
}

function validateTransaction(tx: Transaction):
  Result[ValidatedTransaction, ValidationError | CryptoError] {

  // Type system ensures:
  // - tx.amount is Money type (never string or null)
  // - tx.signature is Signature type (not random bytes)
  // - ValidationError and CryptoError are the ONLY failures possible

  if not isValidAddress(tx.from) then
    return Error(InvalidAddressError('Invalid sender'))

  if not isValidAddress(tx.to) then
    return Error(InvalidAddressError('Invalid recipient'))

  if tx.amount <= 0 then
    return Error(InvalidAmountError('Amount must be positive'))

  if not verifySignature(tx.signature, tx) then
    return Error(InvalidSignatureError('Signature does not match'))

  return Ok(ValidatedTransaction(tx))
}
</pre>

<p><strong>What's Different Here?</strong></p>

<ul>
  <li><strong>Types are explicit:</strong> You know Address, Money, Signature are specific types, not strings</li>
  <li><strong>Errors are declared:</strong> The return type tells you EXACTLY what can go wrong</li>
  <li><strong>Result type:</strong> You must handle both success (ValidatedTransaction) and failure (the two error types)</li>
  <li><strong>No surprises:</strong> The function can't silently fail or throw unexpected errors</li>
</ul>

<h2>Example 2: Account Balance Check</h2>

<p><strong>The Problem:</strong> Check if an account has enough balance. Handle both valid and invalid accounts.</p>

<p><strong>JavaScript (without FreeLang):</strong></p>

<pre>
async function canTransfer(accountId, amount) {
  const account = await db.getAccount(accountId);
  if (account.balance > amount) return true;
  return false;
}

// Caller code:
if (canTransfer(userId, 100)) {
  // ... do transfer
}

// What can go wrong?
// - accountId doesn't exist → account is null → crash
// - balance is a string → comparison fails silently
// - amount is undefined → always true
// - No error handling possible
</pre>

<p><strong>FreeLang code:</strong></p>

<pre>
type AccountId = string  // Even primitives get semantic types
type Money = { amount: Int, currency: String }

function canTransfer(
  accountId: AccountId,
  amount: Money
): Result[Bool, AccountNotFoundError | InvalidAmountError] {

  // Get account (must handle not found)
  const account = getAccount(accountId)
    .orElse(err => Error(AccountNotFoundError('Account not found')))

  // Validate amount
  if amount.amount <= 0 then
    return Error(InvalidAmountError('Amount must be positive'))

  // Safe comparison (both are Money types)
  return Ok(account.balance.greaterThan(amount))
}

// Caller code:
match canTransfer(userId, transferAmount) {
  Ok(canProceed) => {
    if canProceed then executeTransfer()
    else return insufficientFunds()
  }
  Error(AccountNotFoundError(_)) => return userNotFound()
  Error(InvalidAmountError(msg)) => return invalidAmount(msg)
}
</pre>

<p><strong>What Changed?</strong></p>

<ul>
  <li><strong>Result type:</strong> Forces handling of both success and two specific failures</li>
  <li><strong>Money is a type:</strong> Can't pass an amount as plain int</li>
  <li><strong>Pattern matching:</strong> Handle each error case specifically</li>
  <li><strong>No null/undefined:</strong> account.balance is never null</li>
</ul>

<h2>Example 3: Database Query with Lazy Sequences</h2>

<p><strong>The Problem:</strong> Get all transactions over $1000 from the last month, sorted by amount.</p>

<p><strong>JavaScript (eager):</strong></p>

<pre>
const txns = await db.query(
  'SELECT * FROM transactions WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 MONTH)'
);
const filtered = txns.filter(t => t.amount > 1000);
const sorted = filtered.sort((a, b) => b.amount - a.amount);
return sorted;

// Problems:
// - Loads ALL transactions into memory
// - If table has 1M rows, loads 1M even if you only use first 10
// - Three separate passes through data
</pre>

<p><strong>FreeLang code:</strong></p>

<pre>
function getExpensiveTransactions():
  LazySequence[ValidatedTransaction] {

  return db.query(Transaction)
    .filterByDateRange(lastMonth())
    .filter(t => t.amount > Money(1000))
    .sortBy(t => t.amount, Descending)
}

// Consumer code:
const first10 = getExpensiveTransactions()
  .take(10)
  .toList()
</pre>

<p><strong>What's Different?</strong></p>

<ul>
  <li><strong>Lazy evaluation:</strong> Nothing is computed until .toList() is called</li>
  <li><strong>Chainable:</strong> Each operation builds on the previous</li>
  <li><strong>Type-safe:</strong> Result is LazySequence[ValidatedTransaction], not [any]</li>
  <li><strong>Efficient:</strong> Only the first 10 items are loaded from database</li>
</ul>

<h2>Example 4: Error Recovery</h2>

<p><strong>The Problem:</strong> Try to sync with peer. If network fails, retry. If peer is invalid, don't retry.</strong></p>

<p><strong>JavaScript (ambiguous):</strong></p>

<pre>
async function syncWithPeer(peerId) {
  try {
    await peer.connect();
    const blocks = await peer.getBlocks();
    return blocks;
  } catch (error) {
    // What kind of error? No way to know without inspecting message
    console.log('Sync failed: ' + error.message);
    throw error;
  }
}
</pre>

<p><strong>FreeLang code:</strong></p>

<pre>
function syncWithPeer(peerId: PeerId):
  Result[BlockList, PeerConnectionError | InvalidPeerError] {

  // Type system enforces peerId is valid type
  const peer = Peer.connect(peerId)
    .mapError(err => PeerConnectionError(err.message))

  return peer.flatMap(p =>
    p.getBlocks()
      .mapError(err => PeerConnectionError(err.message))
  )
}

// Caller code:
match syncWithPeer(peer) {
  Ok(blocks) => integrate(blocks)

  Error(PeerConnectionError(msg)) => {
    // Network issue - retry after delay
    setTimeout(() => retry(peer), 5000)
  }

  Error(InvalidPeerError(msg)) => {
    // Invalid peer - don't retry, remove from peer list
    removePeer(peer)
  }
}
</pre>

<p><strong>Why This Works:</strong></p>

<ul>
  <li><strong>Explicit errors:</strong> You KNOW what errors are possible</li>
  <li><strong>Different responses:</strong> Network errors get retry, peer errors get removal</li>
  <li><strong>Type-driven:</strong> Compiler forces you to handle all cases</li>
</ul>

<h2>The Pattern Across All Examples</h2>

<table border="1" cellpadding="10">
  <tr>
    <th>Aspect</th>
    <th>JavaScript</th>
    <th>FreeLang</th>
  </tr>
  <tr>
    <td>Type checking</td>
    <td>Runtime (if at all)</td>
    <td>Compile time (mandatory)</td>
  </tr>
  <tr>
    <td>Error handling</td>
    <td>Try/catch (might miss cases)</td>
    <td>Result type (all cases explicit)</td>
  </tr>
  <tr>
    <td>Null/undefined</td>
    <td>Can happen anywhere</td>
    <td>Explicit in type (Option[T])</td>
  </tr>
  <tr>
    <td>Performance</td>
    <td>Eager (loads everything)</td>
    <td>Lazy (loads on demand)</td>
  </tr>
</table>

<h2>Next: Performance Benchmarks</h2>

<p>Real code is nice. But does it actually perform better? In the next post, we'll show the benchmarks where FreeLang's type system and lazy evaluation lead to 3x-6x speedups.</p>

<hr>

<p><strong>Made in Korea 🇰🇷</strong></p>

<p><em>FreeLang v6 Series | Post 7 of 10</em></p>

<p><em>Next: \"Performance Benchmarks: 3x to 6x Faster\"</em></p>
    `,
    labels: ['FreeLang', 'Code Examples', 'TypeScript', 'Programming', 'Production Code', 'Made in Korea']
  };

  try {
    console.log('📝 FreeLang Series #7 posting...\n');
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });

    console.log('✅ Posted!\n');
    console.log('📝 Title:', response.data.title);
    console.log('🔗 URL:', response.data.url);
    console.log('\n📊 Post 7/10 completed');
    return response.data;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

postFreeLang7();
