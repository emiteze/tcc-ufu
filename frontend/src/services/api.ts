import axios from 'axios';
import { Customer, CreateCustomer } from '../types/Customer';

// API Base URL - will be configured via environment variables in Kubernetes
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerApi = {
  // Get all customers
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>('/customers');
    return response.data;
  },

  // Get customer by ID
  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  create: async (customer: CreateCustomer): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', customer);
    return response.data;
  },

  // Update customer
  update: async (id: string, customer: CreateCustomer): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, customer);
    return response.data;
  },

  // Delete customer
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};