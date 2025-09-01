import React, { useState, useEffect } from 'react';
import { Customer } from '../types/Customer';
import { customerApi } from '../services/api';

interface CustomerListProps {
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  refreshTrigger: number;
}

const CustomerList: React.FC<CustomerListProps> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getAll();
      setCustomers(data || []);
    } catch (err) {
      setError('Falha para carregar clientes');
      console.error('Erro para carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esse cliente?')) {
      try {
        await customerApi.delete(id);
        onDelete(id);
      } catch (err) {
        setError('Falha para deletar um cliente');
        console.error('Erro para deletar um cliente:', err);
      }
    }
  };

  if (loading) return <div className="loading">Carregando clientes...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="customer-list">
      <h2>Clientes</h2>
      {customers.length === 0 ? (
        <p>Não foram encontrados clientes.</p>
      ) : (
        <table className="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>
                  <button
                    className="btn btn-edit"
                    onClick={() => onEdit(customer)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDelete(customer.id)}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerList;