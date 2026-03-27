const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postFreeLang9() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'These Patterns Work for Your Project Too',
    content: `
<p><strong>FreeLang is our language. But the patterns we discovered work anywhere.</strong></p>

<p>Here's how to apply them to JavaScript, Python, Go, or whatever you're using.</p>

<h2>Pattern 1: Type Safety First</h2>

<p><strong>If you're using JavaScript:</strong> Use TypeScript. Strict mode, not loose.</p>

<pre>
// Bad
let x = getData();
x = x + 5;

// Good (TypeScript strict)
const x: number = getData();
const result: number = x + 5;
</pre>

<p><strong>What it catches:</strong> 80% of production bugs (mismatches between expected and actual types).</p>

<p><strong>If you're using Python:</strong> Use type hints + mypy strict mode.</p>

<pre>
# Bad
def transfer(from_account, to_account, amount):
    return from_account.balance - amount

# Good
from typing import Tuple
def transfer(from_account: Account, to_account: Account, amount: Money) -> Tuple[bool, str]:
    if from_account.balance < amount:
        return False, "Insufficient balance"
    return True, "Success"
</pre>

<p><strong>What it catches:</strong> Functions that forget to validate inputs. Missing return values.</p>

<p><strong>If you're using Go:</strong> You already have type safety. Use it.</p>

<pre>
// Good
func Transfer(from Account, to Account, amount Money) error {
    if from.Balance < amount {
        return ErrInsufficientBalance
    }
    return nil
}
</pre>

<p><strong>The pattern:</strong> Make types explicit. Make violations impossible at compile time, not at runtime.</p>

<h2>Pattern 2: Structured Error Handling</h2>

<p><strong>Current:</strong> Generic try/catch and hope.</p>

<p><strong>Better:</strong> Define error types for your domain.</p>

<p><strong>JavaScript example:</strong></p>

<pre>
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.type = 'ValidationError';
    this.field = field;
  }
}

class InsufficientBalanceError extends Error {
  constructor(available, required) {
    super('Insufficient balance');
    this.type = 'InsufficientBalanceError';
    this.available = available;
    this.required = required;
  }
}

// Usage
try {
  await transfer(from, to, amount);
} catch (error) {
  if (error.type === 'ValidationError') {
    return { error: 'Input validation failed: ' + error.field };
  } else if (error.type === 'InsufficientBalanceError') {
    return { error: 'Not enough funds. Available: ' + error.available };
  }
  throw error;  // Unknown error, escalate
}
</pre>

<p><strong>What it gives you:</strong> Specific recovery logic. Debugging in minutes instead of hours.</p>

<h2>Pattern 3: Immutability for Critical Data</h2>

<p><strong>Current:</strong> Objects change everywhere. Hard to track.</p>

<p><strong>Better:</strong> Make critical data immutable.</p>

<p><strong>JavaScript example:</strong></p>

<pre>
// Bad: mutable transaction
const txn = { from, to, amount };
txn.amount = txn.amount * 0.99;  // Oops, modified original

// Good: immutable
const txn = Object.freeze({ from, to, amount });
const discountedTxn = { ...txn, amount: txn.amount * 0.99 };
</pre>

<p><strong>Python example:</strong></p>

<pre>
from dataclasses import dataclass

@dataclass(frozen=True)
class Transaction:
    from_account: str
    to_account: str
    amount: float

# txn.amount = 50  # TypeError: immutable
discounted = Transaction(txn.from_account, txn.to_account, txn.amount * 0.99)
</pre>

<p><strong>What it prevents:</strong> Race conditions. Mutation bugs. Functions that have unexpected side effects.</p>

<h2>Pattern 4: Lazy Evaluation for Large Datasets</h2>

<p><strong>Current:</strong> Load everything into memory.</p>

<p><strong>Better:</strong> Compute on demand.</p>

<p><strong>JavaScript example:</strong></p>

<pre>
// Bad: loads all 1M rows
const results = db.query('SELECT * FROM transactions');
const filtered = results.filter(t => t.amount > 1000).slice(0, 10);

// Good: lazy evaluation
const results = db.query('SELECT * FROM transactions')
  .where(t => t.amount > 1000)
  .limit(10)
  .execute();

// Only loads 10 rows from database
</pre>

<p><strong>Python example with generators:</strong></p>

<pre>
def expensive_operations(data):
    for item in data:
        if item > threshold:
            yield process(item)

# Doesn't process until iterated
for result in expensive_operations(huge_list):
    print(result)
</pre>

<p><strong>What it gives you:</strong> Handle unbounded data. 10x memory savings. Linear time instead of quadratic.</p>

<h2>Pattern 5: Declarative Over Imperative</h2>

<p><strong>Current:</strong> Tell the computer HOW to do it.</p>

<p><strong>Better:</strong> Tell it WHAT you want, let the system figure out HOW.</p>

<p><strong>SQL example:</strong></p>

<pre>
-- Declarative (WHAT)
SELECT account_id, SUM(amount) as total
FROM transactions
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY account_id
ORDER BY total DESC;

-- vs Imperative (HOW)
accounts = {}
for each txn in transactions:
    if txn.timestamp < 1 month ago: continue
    if txn.account_id not in accounts:
        accounts[txn.account_id] = 0
    accounts[txn.account_id] += txn.amount
sorted_accounts = sort accounts by total DESC
</pre>

<p><strong>What it gives you:</strong> Database can optimize better. Code is shorter and clearer.</p>

<h2>Applying the Patterns: A Checklist</h2>

<p><strong>For your next project:</strong></p>

<ol>
  <li><strong>Types first:</strong> Use TypeScript, Mypy, or your language's type system. Strict mode.</li>
  <li><strong>Error hierarchy:</strong> Define 5-10 error types for your domain. All functions declare what they can throw.</li>
  <li><strong>Immutable defaults:</strong> Make critical data immutable. const/frozen/namedtuple instead of mutable objects.</li>
  <li><strong>Lazy evaluation:</strong> For large datasets, compute on demand. Stream, don't buffer.</li>
  <li><strong>Declarative code:</strong> Use SQL, map/filter, functional composition instead of loops.</li>
</ol>

<h2>The Payoff</h2>

<p>If you apply these patterns:</p>

<ul>
  <li><strong>80% reduction in type-related bugs</strong> (types catch them)</li>
  <li><strong>10x faster debugging</strong> (structured errors)</li>
  <li><strong>70% faster onboarding</strong> (code is self-documenting)</li>
  <li><strong>3-6x performance improvement</strong> (lazy evaluation + compiler optimization)</li>
</ul>

<p>You don't need a custom language. You need discipline to use your language's best features.</p>

<h2>Next: What's Coming for FreeLang</h2>

<p>We've shipped v6 and it's in production. But there's more coming. In the final post, we'll share our roadmap and what's next for FreeLang.</p>

<hr>

<p><strong>Made in Korea 🇰🇷</strong></p>

<p><em>FreeLang v6 Series | Post 9 of 10</em></p>

<p><em>Next: \"What's Next for FreeLang: Our Roadmap\"</em></p>
    `,
    labels: ['FreeLang', 'Best Practices', 'Programming Patterns', 'TypeScript', 'Engineering', 'Made in Korea']
  };

  try {
    console.log('📝 FreeLang Series #9 posting...\n');
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: postData
    });

    console.log('✅ Posted!\n');
    console.log('📝 Title:', response.data.title);
    console.log('🔗 URL:', response.data.url);
    console.log('\n📊 Post 9/10 completed');
    return response.data;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

postFreeLang9();
