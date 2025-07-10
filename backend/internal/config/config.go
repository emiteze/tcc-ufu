package config

import "os"

// Config holds application configuration
type Config struct {
	AWSRegion        string
	DynamoDBEndpoint string
	TableName        string
	Port             string
}

// Load returns configuration loaded from environment variables
func Load() *Config {
	return &Config{
		AWSRegion:        getEnv("AWS_REGION", "us-east-1"),
		DynamoDBEndpoint: getEnv("DYNAMODB_ENDPOINT", "http://localhost:8000"),
		TableName:        getEnv("TABLE_NAME", "Customers"),
		Port:             getEnv("PORT", "8080"),
	}
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
