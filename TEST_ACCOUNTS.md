# Test Accounts for Authentication

## Database Integration Status

✅ **Real Database Storage Active** - All authentication now uses Convex database instead of mock data.

## Existing Database Account

### Users

- **Email**: `alice@example.com`  
  **Password**: alice123  
  **Role**: USER (Free plan)

- **Email**: `bob@example.com`  
  **Password**: bob123  
  **Role**: USER (Pro plan)

- **Email**: `charlie@example.com`  
  **Password**: charlie123  
  **Role**: USER (Enterprise plan) - **INACTIVE ACCOUNT**

### Admins

- **Email**: `diana@example.com`  
  **Password**: diana123  
  **Role**: ADMIN

- **Email**: `bruce@example.com`  
  **Password**: bruce123  
  **Role**: ADMIN

- **Email**: `likhithsaiparepalli@gmail.com`  
  **Password**: 9494532@Pl  
  **Role**: ADMIN

### Super Admin

- **Email**: `sailikhith816@gmail.com`  
  **Password**: 9494532@Pl  
  **Role**: SUPERADMIN

## Authentication Rules

### ✅ Valid Login Scenarios

1. **Email exists** + **Correct password** + **Account is ACTIVE** = ✅ Login Success
2. **Google OAuth** with new email = ✅ Creates new account and logs in
3. **Google OAuth** with existing Google account = ✅ Login Success

### ❌ Invalid Login Scenarios

1. **Email doesn't exist** = ❌ "User not found"
2. **Email exists** + **Wrong password** = ❌ "Invalid password"
3. **Email exists** + **No password provided** = ❌ "Email and password are required"
4. **Account is INACTIVE** = ❌ "Account deactivated"
5. **Google OAuth user trying password login** = ❌ "This account was created with Google"
6. **Password user trying Google OAuth** = ❌ Blocks the login (shows console error)

## Password Change Functionality

### ✅ Valid Password Change Scenarios

1. **Logged in user** + **Correct current password** + **Valid new password** = ✅ Password Updated
2. **New password is different from current** + **Meets requirements** = ✅ Password Updated

### ❌ Invalid Password Change Scenarios

1. **Not logged in** = ❌ "Must be logged in to change password"
2. **Wrong current password** = ❌ "Current password is incorrect"
3. **Google OAuth user** = ❌ "This account was created with Google. Password cannot be changed"
4. **New password too short** = ❌ "New password must be at least 6 characters long"
5. **New password same as current** = ❌ "New password must be different from current password"
6. **Missing fields** = ❌ "Current password and new password are required"

### Password Change Rules

- ✅ **Minimum 6 characters** for new password
- ✅ **Must be different** from current password
- ✅ **Current password verification** required
- ✅ **Updates database** immediately
- ✅ **Form clears** on successful change
- ✅ **Not available** for Google OAuth users

## Test Scenarios

### Password Authentication Tests

```text
✅ alice@example.com + alice123 → Login Success
❌ alice@example.com + wrong123 → Invalid password
❌ nonexistent@email.com + any → User not found
❌ charlie@example.com + charlie123 → Account deactivated
```

### Google OAuth Tests

```text
✅ New Google account → Creates account + Login
❌ Google account for existing password user → Blocked
```

### Registration Tests

```text
✅ New email + valid data → Account created + Login
❌ Existing email → "Account already exists"
❌ Missing fields → "All fields required"
```

### Password Change Tests

```text
✅ Login with alice@example.com → Go to Profile → Change password from alice123 to newpass123 → Success
❌ Try wrong current password → "Current password is incorrect"
❌ Try password < 6 chars → "Password must be at least 6 characters long"
❌ Try same password → "New password must be different from current password"
```

## How to Test Password Change

1. **Login** with any password-based account (e.g., `alice@example.com` / alice123)
2. **Navigate** to Profile Settings page
3. **Fill out** the Change Password form:
   - Current Password: alice123
   - New Password: newpassword123
   - Confirm New Password: newpassword123
4. **Submit** the form
5. **Verify** success message and form clears
6. **Test** by logging out and logging back in with the new password
