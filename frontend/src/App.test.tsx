import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders customer management system', () => {
  render(<App />);
  const headerElement = screen.getByText(/sistema de gestão de clientes/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders add new customer button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/adicionar novo cliente/i);
  expect(buttonElement).toBeInTheDocument();
});
