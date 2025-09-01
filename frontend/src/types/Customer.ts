export interface Customer {
  id: string;
  name: string;
  email: string;
  telephone: string;
}

export interface CreateCustomer {
  name: string;
  email: string;
  telephone: string;
}