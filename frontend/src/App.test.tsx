import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders customer management system', () => {
  render(<App />);
  const headerElement = screen.getByText(/customer management system/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders add new customer button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/add new customer/i);
  expect(buttonElement).toBeInTheDocument();
});
