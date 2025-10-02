import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// FIX: Import jest-dom to extend Jest's `expect` with DOM-related matchers like `toBeInTheDocument` and `toHaveClass`.
import '@testing-library/jest-dom';
import Alert from './Alert';

describe('Alert', () => {
  it('renders the title and message correctly', () => {
    render(<Alert type="info" title="Information" message="This is an informational message." />);
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('This is an informational message.')).toBeInTheDocument();
  });

  it('calls onClose when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(<Alert type="warning" title="Warning" onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
  
  it('does not render a close button if onClose is not provided', () => {
    render(<Alert type="success" title="Success" />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it.each([
    ['error', 'bg-red-900/20'],
    ['success', 'bg-green-900/20'],
    ['warning', 'bg-yellow-900/20'],
    ['info', 'bg-blue-900/20'],
  ])('applies the correct styles for type "%s"', (type, expectedClass) => {
    // @ts-ignore
    render(<Alert type={type} title="Test" />);
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass(expectedClass);
  });
});