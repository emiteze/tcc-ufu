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
				ID:    "123e4567-e89b-12d3-a456-426614174000",
				Name:  "John Doe",
				Email: "john.doe@example.com",
			},
			expected: `{"id":"123e4567-e89b-12d3-a456-426614174000","name":"John Doe","email":"john.doe@example.com"}`,
		},
		{
			name: "customer with empty ID",
			customer: Customer{
				ID:    "",
				Name:  "Jane Smith",
				Email: "jane.smith@example.com",
			},
			expected: `{"id":"","name":"Jane Smith","email":"jane.smith@example.com"}`,
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
			jsonData: `{"id":"123e4567-e89b-12d3-a456-426614174000","name":"John Doe","email":"john.doe@example.com"}`,
			expected: Customer{
				ID:    "123e4567-e89b-12d3-a456-426614174000",
				Name:  "John Doe",
				Email: "john.doe@example.com",
			},
			wantErr: false,
		},
		{
			name:     "missing ID field",
			jsonData: `{"name":"Jane Smith","email":"jane.smith@example.com"}`,
			expected: Customer{
				ID:    "",
				Name:  "Jane Smith",
				Email: "jane.smith@example.com",
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
				ID:    "123e4567-e89b-12d3-a456-426614174000",
				Name:  "John Doe",
				Email: "john.doe@example.com",
			},
		},
		{
			name: "customer with special characters in name",
			customer: Customer{
				ID:    "123e4567-e89b-12d3-a456-426614174000",
				Name:  "José María O'Brien-Smith",
				Email: "jose.maria@example.com",
			},
		},
		{
			name: "customer with long name",
			customer: Customer{
				ID:    "123e4567-e89b-12d3-a456-426614174000",
				Name:  "This is a very long name that might be used in some applications",
				Email: "longname@example.com",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test that the struct can be created and fields are accessible
			assert.NotEmpty(t, tt.customer.ID)
			assert.NotEmpty(t, tt.customer.Name)
			assert.NotEmpty(t, tt.customer.Email)

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

	// Test JSON marshaling of empty customer
	jsonData, err := json.Marshal(customer)
	require.NoError(t, err)
	expected := `{"id":"","name":"","email":""}`
	assert.JSONEq(t, expected, string(jsonData))
}
