package db

import (
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/emiteze/tcc-ufu/internal/config"
	"github.com/emiteze/tcc-ufu/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInitDynamoDB_Configuration(t *testing.T) {
	cfg := &config.Config{
		AWSRegion:        "us-east-1",
		DynamoDBEndpoint: "http://localhost:8000",
	}

	client, err := InitDynamoDB(cfg)

	require.NoError(t, err)
	assert.NotNil(t, client)
}

func TestInitDynamoDB_InvalidRegion(t *testing.T) {
	cfg := &config.Config{
		AWSRegion:        "",
		DynamoDBEndpoint: "http://localhost:8000",
	}

	client, err := InitDynamoDB(cfg)

	// Should still work with empty region
	require.NoError(t, err)
	assert.NotNil(t, client)
}

func TestCustomerDataIntegrity_MarshalUnmarshal(t *testing.T) {
	// Test that customer data maintains integrity through marshal/unmarshal
	originalCustomer := &models.Customer{
		ID:    "123e4567-e89b-12d3-a456-426614174000",
		Name:  "John Doe",
		Email: "john.doe@example.com",
	}

	// Marshal to DynamoDB format
	item, err := dynamodbattribute.MarshalMap(originalCustomer)
	require.NoError(t, err)

	// Verify the marshaled data has the correct structure
	assert.NotNil(t, item["id"])
	assert.NotNil(t, item["name"])
	assert.NotNil(t, item["email"])

	// Unmarshal back to Customer
	var reconstructedCustomer models.Customer
	err = dynamodbattribute.UnmarshalMap(item, &reconstructedCustomer)
	require.NoError(t, err)

	// Verify data integrity
	assert.Equal(t, originalCustomer.ID, reconstructedCustomer.ID)
	assert.Equal(t, originalCustomer.Name, reconstructedCustomer.Name)
	assert.Equal(t, originalCustomer.Email, reconstructedCustomer.Email)
}

func TestCustomerDataIntegrity_EmptyCustomer(t *testing.T) {
	// Test marshaling/unmarshaling of empty customer
	originalCustomer := &models.Customer{}

	item, err := dynamodbattribute.MarshalMap(originalCustomer)
	require.NoError(t, err)

	var reconstructedCustomer models.Customer
	err = dynamodbattribute.UnmarshalMap(item, &reconstructedCustomer)
	require.NoError(t, err)

	assert.Equal(t, originalCustomer.ID, reconstructedCustomer.ID)
	assert.Equal(t, originalCustomer.Name, reconstructedCustomer.Name)
	assert.Equal(t, originalCustomer.Email, reconstructedCustomer.Email)
}

func TestCustomerDataIntegrity_SpecialCharacters(t *testing.T) {
	// Test that customer data with special characters is handled correctly
	originalCustomer := &models.Customer{
		ID:    "123e4567-e89b-12d3-a456-426614174000",
		Name:  "José María O'Brien-Smith",
		Email: "jose.maria+test@example.com",
	}

	item, err := dynamodbattribute.MarshalMap(originalCustomer)
	require.NoError(t, err)

	var reconstructedCustomer models.Customer
	err = dynamodbattribute.UnmarshalMap(item, &reconstructedCustomer)
	require.NoError(t, err)

	assert.Equal(t, originalCustomer.ID, reconstructedCustomer.ID)
	assert.Equal(t, originalCustomer.Name, reconstructedCustomer.Name)
	assert.Equal(t, originalCustomer.Email, reconstructedCustomer.Email)
}

func TestDynamoDBInputValidation_PutItem(t *testing.T) {
	customer := &models.Customer{
		ID:    "123",
		Name:  "John Doe",
		Email: "john.doe@example.com",
	}

	item, err := dynamodbattribute.MarshalMap(customer)
	require.NoError(t, err)

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String("TestTable"),
	}

	// Validate input structure
	assert.NotNil(t, input.Item)
	assert.Equal(t, "TestTable", *input.TableName)
	assert.NotNil(t, input.Item["id"])
	assert.NotNil(t, input.Item["name"])
	assert.NotNil(t, input.Item["email"])
}

func TestDynamoDBInputValidation_GetItem(t *testing.T) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("123"),
			},
		},
		TableName: aws.String("TestTable"),
	}

	// Validate input structure
	assert.NotNil(t, input.Key)
	assert.Equal(t, "TestTable", *input.TableName)
	assert.NotNil(t, input.Key["id"])
	assert.Equal(t, "123", *input.Key["id"].S)
}

func TestDynamoDBInputValidation_DeleteItem(t *testing.T) {
	input := &dynamodb.DeleteItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("123"),
			},
		},
		TableName: aws.String("TestTable"),
	}

	// Validate input structure
	assert.NotNil(t, input.Key)
	assert.Equal(t, "TestTable", *input.TableName)
	assert.NotNil(t, input.Key["id"])
	assert.Equal(t, "123", *input.Key["id"].S)
}

func TestDynamoDBInputValidation_ScanInput(t *testing.T) {
	input := &dynamodb.ScanInput{
		TableName: aws.String("TestTable"),
	}

	// Validate input structure
	assert.Equal(t, "TestTable", *input.TableName)
}

func TestCreateTableInputValidation(t *testing.T) {
	tableName := "TestTable"

	input := &dynamodb.CreateTableInput{
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			{
				AttributeName: aws.String("id"),
				AttributeType: aws.String("S"),
			},
		},
		KeySchema: []*dynamodb.KeySchemaElement{
			{
				AttributeName: aws.String("id"),
				KeyType:       aws.String("HASH"),
			},
		},
		ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
			ReadCapacityUnits:  aws.Int64(5),
			WriteCapacityUnits: aws.Int64(5),
		},
		TableName: aws.String(tableName),
	}

	// Validate input structure
	assert.Equal(t, tableName, *input.TableName)
	assert.Len(t, input.AttributeDefinitions, 1)
	assert.Equal(t, "id", *input.AttributeDefinitions[0].AttributeName)
	assert.Equal(t, "S", *input.AttributeDefinitions[0].AttributeType)
	assert.Len(t, input.KeySchema, 1)
	assert.Equal(t, "id", *input.KeySchema[0].AttributeName)
	assert.Equal(t, "HASH", *input.KeySchema[0].KeyType)
	assert.Equal(t, int64(5), *input.ProvisionedThroughput.ReadCapacityUnits)
	assert.Equal(t, int64(5), *input.ProvisionedThroughput.WriteCapacityUnits)
}

func TestDynamoDBAttributeValues(t *testing.T) {
	// Test different attribute value types
	tests := []struct {
		name     string
		value    interface{}
		expected string
	}{
		{
			name:     "string value",
			value:    "test",
			expected: "test",
		},
		{
			name:     "non-empty string",
			value:    "hello world",
			expected: "hello world",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			av, err := dynamodbattribute.Marshal(tt.value)
			require.NoError(t, err)

			assert.NotNil(t, av.S)
			assert.Equal(t, tt.expected, *av.S)
		})
	}
}

func TestListOfMapsUnmarshaling(t *testing.T) {
	// Test unmarshaling a list of DynamoDB items
	items := []map[string]*dynamodb.AttributeValue{
		{
			"id":    {S: aws.String("123")},
			"name":  {S: aws.String("John Doe")},
			"email": {S: aws.String("john.doe@example.com")},
		},
		{
			"id":    {S: aws.String("456")},
			"name":  {S: aws.String("Jane Smith")},
			"email": {S: aws.String("jane.smith@example.com")},
		},
	}

	var customers []models.Customer
	err := dynamodbattribute.UnmarshalListOfMaps(items, &customers)
	require.NoError(t, err)

	require.Len(t, customers, 2)
	assert.Equal(t, "123", customers[0].ID)
	assert.Equal(t, "John Doe", customers[0].Name)
	assert.Equal(t, "john.doe@example.com", customers[0].Email)
	assert.Equal(t, "456", customers[1].ID)
	assert.Equal(t, "Jane Smith", customers[1].Name)
	assert.Equal(t, "jane.smith@example.com", customers[1].Email)
}

func TestEmptyListUnmarshaling(t *testing.T) {
	// Test unmarshaling an empty list
	items := []map[string]*dynamodb.AttributeValue{}

	var customers []models.Customer
	err := dynamodbattribute.UnmarshalListOfMaps(items, &customers)
	require.NoError(t, err)

	assert.Len(t, customers, 0)
}
