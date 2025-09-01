import React, { useState, useEffect } from 'react';
import { Customer, CreateCustomer } from '../types/Customer';
import { customerApi } from '../services/api';

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateCustomer>({
    name: '',
    email: '',
    telephone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        telephone: customer.telephone,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        telephone: '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (customer) {
        await customerApi.update(customer.id, formData);
      } else {
        await customerApi.create(formData);
      }
      onSubmit();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Falha para salvar um cliente');
      console.error('Erro para salvar um cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-form">
      <h2>{customer ? 'Editar cliente' : 'Adicionar novo cliente'}</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nome:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telephone">Telefone:</label>
          <input
            type="tel"
            id="telephone"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : (customer ? 'Atualizar' : 'Criar')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;