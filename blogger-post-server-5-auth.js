const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(process.env.HOME, '.config/blogger/token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.config/blogger/credentials-web.json');
const BLOG_ID = '3920168030427774639';

async function postAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const { client_id, client_secret } = credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, credentials.web.redirect_uris[0]);
  oauth2Client.setCredentials(token);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  const postData = {
    title: 'Securing Your API: JWT, OAuth2, and Role-Based Access Control',
    content: `
<p><strong>Fast databases don't matter if anyone can read all the data. This post covers securing your API: authentication (who are you?), authorization (what can you do?), and best practices for tokens, passwords, and OAuth2.</strong></p>

<p>Security breaches are expensive. Let's build it right from the start.</p>

<h2>The Security Problem</h2>

<p>Common vulnerabilities we see:</p>

<ul>
  <li><strong>No authentication</strong>: Anyone can read/write data</li>
  <li><strong>Weak passwords</strong>: "password123" accepted</li>
  <li><strong>Exposed tokens</strong>: JWT stored in localStorage (XSS vulnerability)</li>
  <li><strong>No expiration</strong>: Stolen token works forever</li>
  <li><strong>Missing authorization</strong>: Admin access on user endpoints</li>
  <li><strong>SQL injection</strong>: Unvalidated inputs in queries</li>
</ul>

<h2>Three Layers of Security</h2>

<h3>Layer 1: Authentication (Who are you?)</h3>

<p><strong>Method 1: Basic username/password</strong></p>

<pre><code>POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
</code></pre>

<p><strong>Implementation</strong>:</p>

<pre><code>fn authenticate_user(email: &str, password: &str) -> Result<(AccessToken, RefreshToken), AuthError> {
  // 1. Find user by email
  let user = db.query_user_by_email(email)?;

  // 2. Verify password (constant-time comparison)
  if !bcrypt::verify(password, &user.password_hash)? {
    return Err(AuthError::InvalidPassword);
  }

  // 3. Check if 2FA is enabled
  if user.two_factor_enabled {
    return Err(AuthError::TwoFactorRequired);
  }

  // 4. Generate JWT tokens
  let access_token = jwt::sign(
    JwtPayload {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      exp: now() + 3600,  // 1 hour
      iat: now(),
    },
    JWT_SECRET
  );

  let refresh_token = jwt::sign(
    JwtPayload {
      sub: user.id,
      type: "refresh",
      exp: now() + 604800,  // 7 days
    },
    JWT_REFRESH_SECRET
  );

  Ok((access_token, refresh_token))
}
</code></pre>

<p><strong>Critical: Password Hashing</strong></p>

<pre><code>❌ WRONG: Store plaintext passwords
  password = "myPassword123"

❌ WRONG: Use weak hash (MD5, SHA-1)
  hash = md5("myPassword123")
  // Easy to crack with rainbow tables

✅ RIGHT: Use bcrypt with salt
  hash = bcrypt::hash("myPassword123", cost=12)
  // Each hash takes 100ms to compute (prevents brute force)
  // Each password has unique salt (prevents rainbow tables)
</code></pre>

<h3>Method 2: OAuth2 (Delegated Authentication)</h3>

<p><strong>Problem</strong>: Users don't want to trust us with their passwords. OAuth2 lets Google/GitHub handle authentication.</p>

<p><strong>OAuth2 Flow</strong>:</p>

<pre><code>User wants to login
  ↓
1. App redirects to Google:
   GET https://accounts.google.com/o/oauth2/v2/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_DOMAIN/auth/callback&
     scope=email%20profile&
     response_type=code

2. User sees Google login screen
   User logs in with their Google account

3. Google redirects back to your app:
   GET YOUR_DOMAIN/auth/callback?code=AUTH_CODE

4. Your server trades code for token:
   POST https://oauth2.googleapis.com/token
   {
     "code": "AUTH_CODE",
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_SECRET",
     "grant_type": "authorization_code"
   }

5. Google returns access token:
   {
     "access_token": "ya29.a0AfH6SMBx...",
     "expires_in": 3599,
     "scope": "email profile",
     "token_type": "Bearer"
   }

6. Use token to get user info:
   GET https://www.googleapis.com/oauth2/v1/userinfo
   Authorization: Bearer ya29.a0AfH6SMBx...

   Response: { "email": "user@gmail.com", "name": "User Name" }

7. Create local user account (if first time):
   INSERT users (email, name, oauth_provider, oauth_id)
   VALUES (user@gmail.com, User Name, google, ...)

Result: User is logged in WITHOUT us ever handling password!
</code></pre>

<h3>Layer 2: JWT Token Validation</h3>

<p><strong>JWT Structure</strong>:</p>

<pre><code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOjEyMywiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzExNTIwNjQ0fQ.
TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ

Part 1: Header (base64)
{
  "alg": "HS256",
  "typ": "JWT"
}

Part 2: Payload (base64)
{
  "sub": 123,
  "email": "user@example.com",
  "exp": 1711520644
}

Part 3: Signature (HMAC-SHA256)
HMAC-SHA256(header.payload, JWT_SECRET)
</code></pre>

<p><strong>Validation on each request</strong>:</p>

<pre><code>fn validate_jwt(token: &str) -> Result<JwtPayload, JwtError> {
  // 1. Split token into 3 parts
  let parts: Vec<&str> = token.split('.').collect();
  if parts.len() != 3 {
    return Err(JwtError::InvalidFormat);
  }

  // 2. Decode header & payload
  let header = base64_decode(parts[0])?;
  let payload = base64_decode(parts[1])?;
  let signature = base64_decode(parts[2])?;

  // 3. Verify signature using secret
  let expected_signature = hmac_sha256(&format!("{}.{}", parts[0], parts[1]), JWT_SECRET);
  if signature != expected_signature {
    return Err(JwtError::InvalidSignature);  // Token tampered!
  }

  // 4. Check expiration
  let jwt_payload: JwtPayload = json_parse(&payload)?;
  if jwt_payload.exp < now() {
    return Err(JwtError::TokenExpired);
  }

  // 5. Check blacklist (revoked tokens)
  if is_token_blacklisted(&token) {
    return Err(JwtError::TokenRevoked);
  }

  Ok(jwt_payload)
}
</code></pre>

<h3>Layer 3: Authorization (What can you do?)</h3>

<p><strong>Role-Based Access Control (RBAC)</strong></p>

<pre><code>Three roles in our system:
- user: Read own data, create/update own transactions
- admin: Read/write all data, manage users
- support: Read all data, respond to user tickets

Each endpoint requires minimum role:

GET /api/users/{id}
  ├─ user role: Can only access own profile (id == current_user_id)
  ├─ admin role: Can access any user
  └─ support role: Can access any user (read-only)

POST /api/users/{id}/password
  ├─ user role: Can only change own password
  └─ admin role: Can change any user's password

DELETE /api/users/{id}
  ├─ user role: ❌ Denied
  └─ admin role: ✓ Allowed
</code></pre>

<p><strong>Implementation</strong>:</p>

<pre><code>#[derive(Debug, PartialEq, Clone)]
enum Role {
  User,
  Support,
  Admin,
}

impl Role {
  fn has_permission(&self, permission: Permission) -> bool {
    match self {
      Role::Admin => true,  // Admins can do anything
      Role::Support => matches!(permission, Permission::ReadAll | Permission::RespondTickets),
      Role::User => matches!(permission, Permission::ReadOwn | Permission::WriteOwn),
    }
  }
}

// Middleware that checks authorization
#[middleware]
fn require_role(required_role: Role) {
  |request, next| {
    let token = extract_token(&request)?;
    let payload = validate_jwt(&token)?;
    let user_role = payload.roles.first().unwrap_or(&Role::User);

    // Check if user has required role
    if role_hierarchy(user_role) < role_hierarchy(required_role) {
      return Err(AuthError::InsufficientPermissions);
    }

    next(request)
  }
}

fn role_hierarchy(role: &Role) -> usize {
  match role {
    Role::User => 1,
    Role::Support => 2,
    Role::Admin => 3,
  }
}

// Usage:
#[post("/api/users/{id}")]
#[require_role(Role::Admin)]  // Only admins can call this
fn delete_user(id: u64) -> Result<(), Error> {
  db.delete_user(id)?;
  Ok(())
}
</code></pre>

<h2>Token Refresh Strategy</h2>

<p><strong>Problem</strong>: Access tokens expire in 1 hour. Do users have to login again?</p>

<p><strong>Solution</strong>: Refresh tokens!</p>

<pre><code>Access Token (short-lived, 1 hour)
  ├─ Used for: API requests
  ├─ Stored in: Memory or session storage (not localStorage)
  └─ Stolen?: 1-hour window of exposure

Refresh Token (long-lived, 7 days)
  ├─ Used for: Getting new access tokens
  ├─ Stored in: HttpOnly cookie (not accessible to JavaScript)
  └─ Stolen?: 7-day window, but server can revoke instantly

Flow:
1. User logs in
   → Get access_token (1 hour) + refresh_token (7 days)
   → Store access_token in memory
   → Store refresh_token in HttpOnly cookie

2. Access token expires
   → Call POST /api/auth/refresh
   → Send refresh_token
   → Server validates & returns new access_token
   → User continues without re-login

3. Suspicious activity detected
   → Server immediately blacklists all tokens for that user
   → User must login again
</code></pre>

<h2>Security Best Practices</h2>

<h3>1. HTTPS Only (TLS 1.3)</h3>

<pre><code>❌ WRONG: Send tokens over HTTP
  GET http://api.example.com/users  → Token visible to MitM

✅ RIGHT: HTTPS with TLS 1.3
  GET https://api.example.com/users  → Token encrypted end-to-end
</code></pre>

<h3>2. HttpOnly Cookies for Refresh Tokens</h3>

<pre><code>❌ WRONG: Store refresh_token in localStorage
  localStorage.setItem('refresh_token', token)
  // XSS vulnerability: malicious script can steal it

✅ RIGHT: HttpOnly cookie
  Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
  // JavaScript cannot access it, only HTTP requests can send it
</code></pre>

<h3>3. CORS Configuration</h3>

<pre><code>❌ WRONG: Allow all origins
  Access-Control-Allow-Origin: *
  // Any website can make requests on behalf of users

✅ RIGHT: Allow specific origins
  Access-Control-Allow-Origin: https://app.example.com
  Access-Control-Allow-Credentials: true
</code></pre>

<h3>4. Rate Limiting on Auth Endpoints</h3>

<pre><code>❌ WRONG: No rate limiting
  Attacker: 1000 login attempts/sec
  → Can try all 10,000 common passwords quickly

✅ RIGHT: Aggressive rate limiting
  Max 5 login attempts per email per hour
  Max 20 requests per IP per minute
  Temporary lockout after 3 failures
</code></pre>

<h3>5. Audit Logging</h3>

<pre><code>Log every authentication event:
2026-03-27 10:15:22 | LOGIN_SUCCESS | user_id=123 | email=user@example.com | ip=192.168.1.1
2026-03-27 10:15:45 | LOGIN_FAILURE | email=attacker@example.com | reason=invalid_password | ip=203.0.113.5
2026-03-27 10:16:00 | TOKEN_REFRESH | user_id=123 | old_token_issued=2h_ago
2026-03-27 10:16:15 | PERMISSION_DENIED | user_id=456 | action=delete_user | required_role=admin
</code></pre>

<h2>Testing: 35+ Test Cases</h2>

<pre><code>✓ Test: Password hashing is consistent
✓ Test: Valid password is verified
✓ Test: Invalid password is rejected
✓ Test: Password reset token works once
✓ Test: Expired reset token is rejected
✓ Test: JWT with valid signature is accepted
✓ Test: JWT with tampered payload is rejected
✓ Test: Expired JWT is rejected
✓ Test: Refresh token generates new access token
✓ Test: Blacklisted token is rejected
✓ Test: User can only access own profile
✓ Test: Admin can access any profile
✓ Test: User cannot delete other users
✓ Test: Admin can delete any user
✓ Test: Support role has read-only access
✓ Test: OAuth2 login creates new user
✓ Test: OAuth2 login recognizes existing user
✓ Test: Rate limiting blocks excessive attempts
✓ Test: 2FA is required when enabled
</code></pre>

<h2>Real-World Example: Banking API</h2>

<pre><code>User login:
1. POST /api/auth/login
   → authenticate_user() validates password
   → Generates access_token (1 hour) + refresh_token (7 days)
   → Returns tokens

2. POST /api/accounts/transfer
   Authorization: Bearer access_token
   → Middleware: validate_jwt(token)
   → Middleware: require_role(Role::User)
   → Check: transfer.from_account_id == current_user_id (ownership)
   → Execute transfer
   → Log: "User 123 transferred $100 to account 456"

3. GET /api/users/123/transactions
   Authorization: Bearer access_token
   → Middleware: validate_jwt(token)
   → Check: current_user_id == 123 OR is_admin()
   → Return transactions

4. After 1 hour, access_token expires:
   POST /api/auth/refresh
   Cookie: refresh_token=...
   → validate_jwt(refresh_token)
   → Issue new access_token
   → User can continue without re-login
</code></pre>

<h2>Lessons Learned</h2>

<h3>1. Never store plaintext passwords</h3>

<p>Always use bcrypt or Argon2. Cost = 100ms per hash (acceptable for security).</p>

<h3>2. OAuth2 is the standard for third-party logins</h3>

<p>Implement it correctly: redirect → exchange code → get token → validate signature.</p>

<h3>3. Tokens must expire</h3>

<p>No infinite tokens. Access tokens: 1 hour. Refresh tokens: 7 days. Audit tokens: 24 hours.</p>

<h3>4. Refresh tokens belong in HttpOnly cookies</h3>

<p>Not localStorage (XSS vulnerability). Not headers (CSRF vulnerability). Cookies with HttpOnly+Secure flags.</p>

<h3>5. Authorization != Authentication</h3>

<p>Authentication answers "who are you?" Authorization answers "what can you do?"</p>

<h2>Next: Caching Strategy</h2>

<p>Now that data is secure, let's make it blazingly fast:</p>

<ul>
  <li>Redis in-memory caching</li>
  <li>Cache invalidation strategies (TTL, event-driven)</li>
  <li>Cache-aside vs write-through patterns</li>
  <li>Cache hit rate optimization (>95%)</li>
</ul>

<p><strong>Made in Korea 🇰🇷</strong></p>
`,
    labels: ['Authentication', 'Authorization', 'JWT', 'OAuth2', 'Security', 'RBAC', 'Backend', 'Production']
  };

  try {
    const res = await blogger.posts.insert({
      blogId: BLOG_ID,
      resource: postData,
    });

    console.log('✅ Post 5 게시 완료!');
    console.log('URL:', res.data.url);
  } catch (err) {
    console.error('❌ 게시 실패:', err.message);
    process.exit(1);
  }
}

postAuth();
