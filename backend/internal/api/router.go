package api

import (
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/emiteze/tcc-ufu/internal/config"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router
func SetupRouter(dbClient *dynamodb.DynamoDB, cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// Add middleware
	router.Use(CORSMiddleware())

	// Create a handler with the db client and config
	handler := NewHandler(dbClient, cfg)

	// Routes
	router.POST("/customers", handler.CreateCustomer)
	router.GET("/customers", handler.GetAllCustomers)
	router.GET("/customers/:id", handler.GetCustomer)
	router.PUT("/customers/:id", handler.UpdateCustomer)
	router.DELETE("/customers/:id", handler.DeleteCustomer)

	return router
}
