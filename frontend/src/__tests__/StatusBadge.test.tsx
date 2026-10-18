import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders PASS status correctly with uppercase label and accessible role', () => {
    render(<StatusBadge status="PASS" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('PASS');
    expect(badge).toHaveAttribute('aria-label', 'Status: PASS');
  });

  it('renders WARNING status correctly', () => {
    render(<StatusBadge status="WARNING" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('WARNING');
  });

  it('renders FAIL status correctly', () => {
    render(<StatusBadge status="FAIL" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('FAIL');
  });

  it('renders SKIPPED status correctly', () => {
    render(<StatusBadge status="SKIPPED" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('SKIPPED');
  });
});
