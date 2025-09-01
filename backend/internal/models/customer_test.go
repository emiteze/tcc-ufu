package models

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCustomer_JSONMarshaling(t *testing.T) {
	tests := []struct {
		name     string
		customer Customer
		expected string
	}{
		{
			name: "valid customer with all fields",
			customer: Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "John Doe",
				Email:     "john.doe@example.com",
				Telephone: "+1-555-0123",
			},
			expected: `{"id":"123e4567-e89b-12d3-a456-426614174000","name":"John Doe","email":"john.doe@example.com","telephone":"+1-555-0123"}`,
		},
		{
			name: "customer with empty ID",
			customer: Customer{
				ID:        "",
				Name:      "Jane Smith",
				Email:     "jane.smith@example.com",
				Telephone: "555-0456",
			},
			expected: `{"id":"","name":"Jane Smith","email":"jane.smith@example.com","telephone":"555-0456"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, err := json.Marshal(tt.customer)
			require.NoError(t, err)
			assert.JSONEq(t, tt.expected, string(jsonData))
		})
	}
}

func TestCustomer_JSONUnmarshaling(t *testing.T) {
	tests := []struct {
		name     string
		jsonData string
		expected Customer
		wantErr  bool
	}{
		{
			name:     "valid JSON",
			jsonData: `{"id":"123e4567-e89b-12d3-a456-426614174000","name":"John Doe","email":"john.doe@example.com","telephone":"+1-555-0123"}`,
			expected: Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "John Doe",
				Email:     "john.doe@example.com",
				Telephone: "+1-555-0123",
			},
			wantErr: false,
		},
		{
			name:     "missing ID field",
			jsonData: `{"name":"Jane Smith","email":"jane.smith@example.com","telephone":"555-0456"}`,
			expected: Customer{
				ID:        "",
				Name:      "Jane Smith",
				Email:     "jane.smith@example.com",
				Telephone: "555-0456",
			},
			wantErr: false,
		},
		{
			name:     "invalid JSON",
			jsonData: `{"id":"123","name":"John Doe","email":}`,
			expected: Customer{},
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var customer Customer
			err := json.Unmarshal([]byte(tt.jsonData), &customer)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expected, customer)
			}
		})
	}
}

func TestCustomer_StructValidation(t *testing.T) {
	tests := []struct {
		name     string
		customer Customer
	}{
		{
			name: "valid customer",
			customer: Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "John Doe",
				Email:     "john.doe@example.com",
				Telephone: "+1-555-0123",
			},
		},
		{
			name: "customer with special characters in name",
			customer: Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "José María O'Brien-Smith",
				Email:     "jose.maria@example.com",
				Telephone: "+34-91-555-0789",
			},
		},
		{
			name: "customer with long name",
			customer: Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "This is a very long name that might be used in some applications",
				Email:     "longname@example.com",
				Telephone: "1234567890123456789",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test that the struct can be created and fields are accessible
			assert.NotEmpty(t, tt.customer.ID)
			assert.NotEmpty(t, tt.customer.Name)
			assert.NotEmpty(t, tt.customer.Email)
			assert.NotEmpty(t, tt.customer.Telephone)

			// Test JSON round-trip
			jsonData, err := json.Marshal(tt.customer)
			require.NoError(t, err)

			var unmarshaled Customer
			err = json.Unmarshal(jsonData, &unmarshaled)
			require.NoError(t, err)
			assert.Equal(t, tt.customer, unmarshaled)
		})
	}
}

func TestCustomer_EmptyCustomer(t *testing.T) {
	var customer Customer

	assert.Empty(t, customer.ID)
	assert.Empty(t, customer.Name)
	assert.Empty(t, customer.Email)
	assert.Empty(t, customer.Telephone)

	// Test JSON marshaling of empty customer
	jsonData, err := json.Marshal(customer)
	require.NoError(t, err)
	expected := `{"id":"","name":"","email":"","telephone":""}`
	assert.JSONEq(t, expected, string(jsonData))
}

func TestCustomer_TelephoneField(t *testing.T) {
	tests := []struct {
		name      string
		telephone string
		wantErr   bool
	}{
		{
			name:      "valid phone number with country code",
			telephone: "+1-555-0123",
			wantErr:   false,
		},
		{
			name:      "valid phone number without formatting",
			telephone: "5550123",
			wantErr:   false,
		},
		{
			name:      "international phone number",
			telephone: "+34-91-555-0789",
			wantErr:   false,
		},
		{
			name:      "empty telephone",
			telephone: "",
			wantErr:   false,
		},
		{
			name:      "long telephone number",
			telephone: "1234567890123456789",
			wantErr:   false,
		},
		{
			name:      "telephone with special characters",
			telephone: "(555) 123-4567 ext. 890",
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			customer := Customer{
				ID:        "123e4567-e89b-12d3-a456-426614174000",
				Name:      "John Doe",
				Email:     "john.doe@example.com",
				Telephone: tt.telephone,
			}

			// Test JSON marshaling
			jsonData, err := json.Marshal(customer)
			require.NoError(t, err)
			assert.Contains(t, string(jsonData), tt.telephone)

			// Test JSON unmarshaling
			var unmarshaled Customer
			err = json.Unmarshal(jsonData, &unmarshaled)
			require.NoError(t, err)
			assert.Equal(t, customer, unmarshaled)
		})
	}
}
