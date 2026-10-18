import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScoreCard } from '../components/common/ScoreCard';

describe('ScoreCard Component', () => {
  it('renders score with /100 and coverage percentage', () => {
    render(<ScoreCard score={88} coverage={95} title="Security Score" />);
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
    expect(screen.getByText('95% evaluated')).toBeInTheDocument();
    expect(screen.getByText('Deployment compliant')).toBeInTheDocument();
  });

  it('renders warning status when score is between 60 and 79', () => {
    render(<ScoreCard score={72} coverage={90} />);
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('Warnings detected')).toBeInTheDocument();
  });

  it('renders critical status when score is below 60', () => {
    render(<ScoreCard score={48} coverage={85} />);
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('Action required')).toBeInTheDocument();
  });

  it('never displays score without coverage context', () => {
    render(<ScoreCard score={90} coverage={100} />);
    expect(screen.getByText('Rule Coverage')).toBeInTheDocument();
  });
});
