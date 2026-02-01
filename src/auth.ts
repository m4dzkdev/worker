import { Env } from './interfaces';
import { randomString } from './helpers';

export async function renderLogin(message?: string): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Worker Panel</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --dark-bg: #1a1d29;
            --card-bg: #242730;
        }

        body {
            background: var(--dark-bg);
            color: #e6e6e6;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-container {
            width: 100%;
            max-width: 420px;
            padding: 20px;
        }

        .login-card {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            padding: 3rem;
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-header h1 {
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .login-icon {
            width: 80px;
            height: 80px;
            background: var(--primary-gradient);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .form-control {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #e6e6e6;
            border-radius: 12px;
            padding: 0.875rem 1rem;
            font-size: 1rem;
        }

        .form-control:focus {
            background: rgba(0, 0, 0, 0.4);
            border-color: #667eea;
            color: #e6e6e6;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .btn-primary {
            background: var(--primary-gradient);
            border: none;
            padding: 0.875rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            width: 100%;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .alert {
            border-radius: 12px;
            border: none;
            margin-bottom: 1.5rem;
        }

        .input-group-text {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #a8b2d1;
            border-right: none;
            border-radius: 12px 0 0 12px;
        }

        .input-group .form-control {
            border-left: none;
            border-radius: 0 12px 12px 0;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h1>Worker Panel</h1>
                <p class="text-muted">Enter your password to continue</p>
            </div>

            ${message ? `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${message}</div>` : ''}

            <form method="POST" action="/login">
                <div class="mb-4">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-key"></i>
                        </span>
                        <input type="password" class="form-control" name="password"
                            placeholder="Enter password" required autofocus>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </form>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const password = formData.get('password') as string;

  if (!password) {
    return renderLogin('Password is required');
  }

  // Check if password matches
  const storedHash = await env.settings.get('passwordHash');
  const envPassword = env.PASSWORD;

  let isValid = false;

  if (storedHash) {
    // Use bcrypt to compare (simplified - in production use actual bcrypt)
    isValid = await simpleHashCompare(password, storedHash);
  } else if (envPassword) {
    // Compare with environment variable
    isValid = password === envPassword;
  } else {
    // No password set, allow any password
    isValid = true;
  }

  if (!isValid) {
    // Add delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 1000));
    return renderLogin('Invalid password');
  }

  // Generate session token
  const token = randomString(32);
  await env.settings.put('token', token, { expirationTtl: 86400 }); // 24 hours

  return new Response(null, {
    status: 302,
    headers: { 'Location': `/?token=${token}` }
  });
}

export async function validateToken(token: string | null, env: Env): Promise<boolean> {
  if (!token) return false;

  const storedToken = await env.settings.get('token');
  return token === storedToken;
}

export async function requireAuth(request: Request, env: Env): Promise<boolean> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  // Check if password is set
  const storedHash = await env.settings.get('passwordHash');
  const envPassword = env.PASSWORD;

  // If no password set, allow access
  if (!storedHash && !envPassword) {
    return true;
  }

  // Validate token
  return await validateToken(token, env);
}

// Simplified hash comparison (in production, use bcryptjs)
async function simpleHashCompare(password: string, hash: string): Promise<boolean> {
  // For now, use SHA-256 comparison
  // In production, you should use bcryptjs: await bcrypt.compare(password, hash)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return computedHash === hash;
}
