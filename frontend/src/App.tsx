import React, { useState } from 'react';
import './App.css';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import { Customer } from './types/Customer';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleDelete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Customer Management System</h1>
      </header>
      <main className="App-main">
        {showForm ? (
          <CustomerForm
            customer={editingCustomer}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        ) : (
          <>
            <div className="actions">
              <button className="btn btn-primary" onClick={handleAddNew}>
                Add New Customer
              </button>
            </div>
            <CustomerList
              onEdit={handleEdit}
              onDelete={handleDelete}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
