import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerForm from './CustomerForm';
import { Customer } from '../types/Customer';
import * as api from '../services/api';

// Mock the API module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('CustomerForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields including telephone', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  test('updates telephone field value', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const telephoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement;
    fireEvent.change(telephoneInput, { target: { value: '+1-555-0123' } });
    
    expect(telephoneInput.value).toBe('+1-555-0123');
  });

  test('populates form with customer data including telephone', () => {
    const customer: Customer = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      telephone: '+1-555-0123',
    };
    
    render(<CustomerForm customer={customer} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('John Doe');
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('john@example.com');
    expect((screen.getByLabelText(/telefone/i) as HTMLInputElement).value).toBe('+1-555-0123');
    expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
  });

  test('submits form with telephone field for new customer', async () => {
    mockedApi.customerApi.create = jest.fn().mockResolvedValue({});
    
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '+1-555-0123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /criar/i }));
    
    await waitFor(() => {
      expect(mockedApi.customerApi.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        telephone: '+1-555-0123',
      });
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('submits form with empty telephone field', async () => {
    mockedApi.customerApi.create = jest.fn().mockResolvedValue({});
    
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    // Leave telephone field empty
    
    fireEvent.click(screen.getByRole('button', { name: /criar/i }));
    
    await waitFor(() => {
      expect(mockedApi.customerApi.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        telephone: '',
      });
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('submits form with telephone field for updating customer', async () => {
    const customer: Customer = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      telephone: '+1-555-0123',
    };
    
    mockedApi.customerApi.update = jest.fn().mockResolvedValue({});
    
    render(<CustomerForm customer={customer} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '+1-555-9999' } });
    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));
    
    await waitFor(() => {
      expect(mockedApi.customerApi.update).toHaveBeenCalledWith('1', {
        name: 'John Doe',
        email: 'john@example.com',
        telephone: '+1-555-9999',
      });
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('telephone field is not required', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const telephoneInput = screen.getByLabelText(/telefone/i);
    expect(telephoneInput).not.toHaveAttribute('required');
  });

  test('telephone field accepts various formats', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const telephoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement;
    
    const telephoneFormats = [
      '+1-555-0123',
      '(555) 123-4567',
      '555.123.4567',
      '5551234567',
      '+34-91-555-0789',
      '',
    ];
    
    telephoneFormats.forEach(format => {
      fireEvent.change(telephoneInput, { target: { value: format } });
      expect(telephoneInput.value).toBe(format);
    });
  });
});