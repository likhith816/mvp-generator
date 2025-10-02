import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// FIX: Import jest-dom to extend Jest's `expect` with DOM-related matchers like `toBeInTheDocument` and `toHaveTextContent`.
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock the router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // FIX: Cast the result of requireActual to `any` to resolve the "spread types may only be created from object types" error.
  ...(jest.requireActual('react-router-dom') as any), // import and retain all actual exports
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>,
}));

describe('LoginPage', () => {
  let mockLogin: jest.Mock;
  let mockHandleGoogleCredentialResponse: jest.Mock;

  beforeEach(() => {
    mockLogin = jest.fn();
    mockHandleGoogleCredentialResponse = jest.fn();
    mockNavigate.mockClear();

    // Mock the Google Identity Services library on the window object
    // to prevent errors and allow testing of initialization.
    (window as any).google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
        },
      },
    };
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_KEY = 'test-client-id';
  });

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={{
        user: null,
        login: mockLogin as any,
        handleGoogleCredentialResponse: mockHandleGoogleCredentialResponse,
        logout: jest.fn(),
        signup: jest.fn() as any,
        updateUser: jest.fn(),
      }}>
        {ui}
      </AuthContext.Provider>
    );
  };

  it('allows a user to log in successfully', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue({ success: true });

    renderWithAuth(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/email address/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue({ success: false, message: 'Invalid credentials' });

    renderWithAuth(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/email address/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });
  
  // Test that the Google Sign-In library is initialized correctly on component mount.
  // We can't easily test the user click flow as it's inside a Google-rendered iframe.
  it('initializes Google Sign-In on component mount', () => {
    renderWithAuth(<LoginPage />);
    
    expect((window as any).google.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: 'test-client-id',
      callback: expect.any(Function), // The callback itself is tested implicitly by the auth context
    });
    
    // Check that it attempts to render the button to our placeholder div
    expect((window as any).google.accounts.id.renderButton).toHaveBeenCalledWith(
        expect.any(HTMLElement), // The div element
        { theme: "outline", size: "large", type: "standard", text: "signin_with", width: "350" }
    );
  });
});