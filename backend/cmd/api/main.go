package main

import (
	"log"

	"github.com/emiteze/tcc-ufu/internal/api"
	"github.com/emiteze/tcc-ufu/internal/config"
	"github.com/emiteze/tcc-ufu/internal/db"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize DynamoDB client
	dbClient, err := db.InitDynamoDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize DynamoDB: %v", err)
	}

	// Ensure table exists
	if err := db.EnsureTableExists(dbClient, cfg.TableName); err != nil {
		log.Fatalf("Failed to ensure table exists: %v", err)
	}

	// Setup and run the API server
	router := api.SetupRouter(dbClient, cfg)

	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
