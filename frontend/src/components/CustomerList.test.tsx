import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerList from './CustomerList';
import { Customer } from '../types/Customer';
import * as api from '../services/api';

// Mock the API module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true),
});

describe('CustomerList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      telephone: '+1-555-0123',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      telephone: '555-0456',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      telephone: '', // Empty telephone
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.customerApi.getAll = jest.fn().mockResolvedValue(mockCustomers);
  });

  test('renders table headers including telephone', async () => {
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/id/i)).toBeInTheDocument();
      expect(screen.getByText(/nome/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/telefone/i)).toBeInTheDocument();
      expect(screen.getByText(/ações/i)).toBeInTheDocument();
    });
  });

  test('displays customer data including telephone', async () => {
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      // Check first customer with telephone
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      
      // Check second customer with different telephone format
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-0456')).toBeInTheDocument();
      
      // Check third customer with empty telephone (should show '-')
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // Empty telephone displays as '-'
    });
  });

  test('displays telephone field correctly for various formats', async () => {
    const customersWithDifferentTelephones: Customer[] = [
      { id: '1', name: 'User 1', email: 'user1@example.com', telephone: '+1-555-0123' },
      { id: '2', name: 'User 2', email: 'user2@example.com', telephone: '(555) 123-4567' },
      { id: '3', name: 'User 3', email: 'user3@example.com', telephone: '555.123.4567' },
      { id: '4', name: 'User 4', email: 'user4@example.com', telephone: '' },
      { id: '5', name: 'User 5', email: 'user5@example.com', telephone: '+34-91-555-0789' },
    ];
    
    mockedApi.customerApi.getAll = jest.fn().mockResolvedValue(customersWithDifferentTelephones);
    
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('555.123.4567')).toBeInTheDocument();
      expect(screen.getByText('+34-91-555-0789')).toBeInTheDocument();
      // Empty telephone should show '-'
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  test('handles edit action with telephone data', async () => {
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByText(/editar/i);
      fireEvent.click(editButtons[0]);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockCustomers[0]);
    });
  });

  test('shows delete button and confirms deletion dialog', async () => {
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Verify delete buttons are present
    const deleteButtons = screen.getAllByText(/deletar/i);
    expect(deleteButtons).toHaveLength(3); // One for each customer
    
    // Click first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Verify confirm dialog was called
    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja deletar esse cliente?');
  });

  test('shows loading state', () => {
    mockedApi.customerApi.getAll = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    expect(screen.getByText(/carregando clientes/i)).toBeInTheDocument();
  });

  test('shows no customers message when list is empty', async () => {
    mockedApi.customerApi.getAll = jest.fn().mockResolvedValue([]);
    
    render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/não foram encontrados clientes/i)).toBeInTheDocument();
    });
  });

  test('refetches data when refreshTrigger changes', async () => {
    const { rerender } = render(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(mockedApi.customerApi.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Change refreshTrigger
    rerender(<CustomerList onEdit={mockOnEdit} onDelete={mockOnDelete} refreshTrigger={1} />);
    
    await waitFor(() => {
      expect(mockedApi.customerApi.getAll).toHaveBeenCalledTimes(2);
    });
  });
});