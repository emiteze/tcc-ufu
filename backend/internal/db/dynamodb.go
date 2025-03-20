package db

import (
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/emiteze/tcc-ufu/internal/config"
	"github.com/emiteze/tcc-ufu/internal/models"
)

// InitDynamoDB initializes a DynamoDB client
func InitDynamoDB(cfg *config.Config) (*dynamodb.DynamoDB, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:   aws.String(cfg.AWSRegion),
		Endpoint: aws.String(cfg.DynamoDBEndpoint),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return dynamodb.New(sess), nil
}

// EnsureTableExists checks if the table exists and creates it if it doesn't
func EnsureTableExists(client *dynamodb.DynamoDB, tableName string) error {
	// Check if table exists
	tables, err := client.ListTables(&dynamodb.ListTablesInput{})
	if err != nil {
		return fmt.Errorf("failed to list tables: %v", err)
	}

	// Check if our table exists
	tableExists := false
	for _, t := range tables.TableNames {
		if *t == tableName {
			tableExists = true
			break
		}
	}

	// If table doesn't exist, create it
	if !tableExists {
		if err := createTable(client, tableName); err != nil {
			return err
		}
	}

	return nil
}

// createTable creates a new DynamoDB table
func createTable(client *dynamodb.DynamoDB, tableName string) error {
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

	_, err := client.CreateTable(input)
	if err != nil {
		return fmt.Errorf("failed to create table: %v", err)
	}

	log.Printf("Created table: %s", tableName)

	// Wait for table to be active
	return waitForTableActive(client, tableName)
}

// waitForTableActive waits for a table to become active
func waitForTableActive(client *dynamodb.DynamoDB, tableName string) error {
	input := &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	}

	// Wait for table to be active with a timeout
	for i := 0; i < 30; i++ {
		result, err := client.DescribeTable(input)
		if err != nil {
			return fmt.Errorf("failed to describe table: %v", err)
		}

		if *result.Table.TableStatus == "ACTIVE" {
			log.Printf("Table %s is now active", tableName)
			return nil
		}

		// Wait before checking again
		time.Sleep(1 * time.Second)
	}

	return fmt.Errorf("timed out waiting for table %s to become active", tableName)
}

// PutCustomer adds or updates a customer in DynamoDB
func PutCustomer(client *dynamodb.DynamoDB, tableName string, customer *models.Customer) error {
	item, err := dynamodbattribute.MarshalMap(customer)
	if err != nil {
		return fmt.Errorf("failed to marshal customer: %v", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tableName),
	}

	_, err = client.PutItem(input)
	if err != nil {
		return fmt.Errorf("failed to put item: %v", err)
	}

	return nil
}

// GetCustomer retrieves a customer by ID
func GetCustomer(client *dynamodb.DynamoDB, tableName string, id string) (*models.Customer, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(tableName),
	}

	result, err := client.GetItem(input)
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %v", err)
	}

	if result.Item == nil {
		return nil, nil // Customer not found
	}

	var customer models.Customer
	err = dynamodbattribute.UnmarshalMap(result.Item, &customer)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal customer: %v", err)
	}

	return &customer, nil
}

// ListCustomers retrieves all customers
func ListCustomers(client *dynamodb.DynamoDB, tableName string) ([]models.Customer, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
	}

	result, err := client.Scan(input)
	if err != nil {
		return nil, fmt.Errorf("failed to scan table: %v", err)
	}

	var customers []models.Customer
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &customers)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal customers: %v", err)
	}

	return customers, nil
}

// DeleteCustomer removes a customer by ID
func DeleteCustomer(client *dynamodb.DynamoDB, tableName string, id string) error {
	input := &dynamodb.DeleteItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(tableName),
	}

	_, err := client.DeleteItem(input)
	if err != nil {
		return fmt.Errorf("failed to delete item: %v", err)
	}

	return nil
}
