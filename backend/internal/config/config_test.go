package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_WithDefaults(t *testing.T) {
	// Clear environment variables to ensure defaults are used
	clearEnvironmentVariables()

	cfg := Load()

	assert.Equal(t, "us-east-1", cfg.AWSRegion)
	assert.Equal(t, "http://localhost:8000", cfg.DynamoDBEndpoint)
	assert.Equal(t, "Customers", cfg.TableName)
	assert.Equal(t, "8080", cfg.Port)
}

func TestLoad_WithEnvironmentVariables(t *testing.T) {
	// Set environment variables
	os.Setenv("AWS_REGION", "us-west-2")
	os.Setenv("DYNAMODB_ENDPOINT", "https://dynamodb.us-west-2.amazonaws.com")
	os.Setenv("TABLE_NAME", "TestCustomers")
	os.Setenv("PORT", "3000")

	defer clearEnvironmentVariables()

	cfg := Load()

	assert.Equal(t, "us-west-2", cfg.AWSRegion)
	assert.Equal(t, "https://dynamodb.us-west-2.amazonaws.com", cfg.DynamoDBEndpoint)
	assert.Equal(t, "TestCustomers", cfg.TableName)
	assert.Equal(t, "3000", cfg.Port)
}

func TestLoad_WithPartialEnvironmentVariables(t *testing.T) {
	// Clear all environment variables first
	clearEnvironmentVariables()

	// Set only some environment variables
	os.Setenv("AWS_REGION", "eu-west-1")
	os.Setenv("PORT", "9090")

	defer clearEnvironmentVariables()

	cfg := Load()

	// Should use environment variables where set
	assert.Equal(t, "eu-west-1", cfg.AWSRegion)
	assert.Equal(t, "9090", cfg.Port)

	// Should use defaults where not set
	assert.Equal(t, "http://localhost:8000", cfg.DynamoDBEndpoint)
	assert.Equal(t, "Customers", cfg.TableName)
}

func TestLoad_WithEmptyEnvironmentVariables(t *testing.T) {
	// Set environment variables to empty strings
	os.Setenv("AWS_REGION", "")
	os.Setenv("DYNAMODB_ENDPOINT", "")
	os.Setenv("TABLE_NAME", "")
	os.Setenv("PORT", "")

	defer clearEnvironmentVariables()

	cfg := Load()

	// Should use defaults when environment variables are empty
	assert.Equal(t, "us-east-1", cfg.AWSRegion)
	assert.Equal(t, "http://localhost:8000", cfg.DynamoDBEndpoint)
	assert.Equal(t, "Customers", cfg.TableName)
	assert.Equal(t, "8080", cfg.Port)
}

func TestGetEnv_WithExistingVariable(t *testing.T) {
	os.Setenv("TEST_VAR", "test_value")
	defer os.Unsetenv("TEST_VAR")

	result := getEnv("TEST_VAR", "default_value")
	assert.Equal(t, "test_value", result)
}

func TestGetEnv_WithNonExistingVariable(t *testing.T) {
	os.Unsetenv("NON_EXISTING_VAR")

	result := getEnv("NON_EXISTING_VAR", "default_value")
	assert.Equal(t, "default_value", result)
}

func TestGetEnv_WithEmptyVariable(t *testing.T) {
	os.Setenv("EMPTY_VAR", "")
	defer os.Unsetenv("EMPTY_VAR")

	result := getEnv("EMPTY_VAR", "default_value")
	assert.Equal(t, "default_value", result)
}

func TestConfig_StructFields(t *testing.T) {
	cfg := &Config{
		AWSRegion:        "us-east-1",
		DynamoDBEndpoint: "http://localhost:8000",
		TableName:        "Customers",
		Port:             "8080",
	}

	assert.Equal(t, "us-east-1", cfg.AWSRegion)
	assert.Equal(t, "http://localhost:8000", cfg.DynamoDBEndpoint)
	assert.Equal(t, "Customers", cfg.TableName)
	assert.Equal(t, "8080", cfg.Port)
}

func TestLoad_MultipleCalls(t *testing.T) {
	// Ensure each call to Load() returns a new instance with current environment
	clearEnvironmentVariables()

	cfg1 := Load()
	assert.Equal(t, "us-east-1", cfg1.AWSRegion)

	// Change environment variable
	os.Setenv("AWS_REGION", "ap-south-1")
	defer os.Unsetenv("AWS_REGION")

	cfg2 := Load()
	assert.Equal(t, "ap-south-1", cfg2.AWSRegion)

	// Original config should still have the old value
	assert.Equal(t, "us-east-1", cfg1.AWSRegion)
}

// Helper function to clear all environment variables used by the config
func clearEnvironmentVariables() {
	os.Unsetenv("AWS_REGION")
	os.Unsetenv("DYNAMODB_ENDPOINT")
	os.Unsetenv("TABLE_NAME")
	os.Unsetenv("PORT")
}
