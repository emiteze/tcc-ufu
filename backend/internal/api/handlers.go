package api

import (
	"net/http"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/emiteze/tcc-ufu/internal/config"
	"github.com/emiteze/tcc-ufu/internal/db"
	"github.com/emiteze/tcc-ufu/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handler contains dependencies for API handlers
type Handler struct {
	dbClient  *dynamodb.DynamoDB
	tableName string
}

// NewHandler creates a new Handler
func NewHandler(dbClient *dynamodb.DynamoDB, cfg *config.Config) *Handler {
	return &Handler{
		dbClient:  dbClient,
		tableName: cfg.TableName,
	}
}

// CreateCustomer handles POST /customers
func (h *Handler) CreateCustomer(c *gin.Context) {
	var customer models.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate unique ID if not provided
	if customer.ID == "" {
		customer.ID = uuid.New().String()
	}

	// Save customer to DynamoDB
	if err := db.PutCustomer(h.dbClient, h.tableName, &customer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	c.JSON(http.StatusCreated, customer)
}

// GetAllCustomers handles GET /customers
func (h *Handler) GetAllCustomers(c *gin.Context) {
	customers, err := db.ListCustomers(h.dbClient, h.tableName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customers"})
		return
	}

	c.JSON(http.StatusOK, customers)
}

// GetCustomer handles GET /customers/:id
func (h *Handler) GetCustomer(c *gin.Context) {
	id := c.Param("id")

	customer, err := db.GetCustomer(h.dbClient, h.tableName, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer"})
		return
	}

	if customer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// UpdateCustomer handles PUT /customers/:id
func (h *Handler) UpdateCustomer(c *gin.Context) {
	id := c.Param("id")

	// Check if customer exists
	existingCustomer, err := db.GetCustomer(h.dbClient, h.tableName, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check customer"})
		return
	}

	if existingCustomer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	var customer models.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure ID in path matches ID in body
	customer.ID = id

	// Update customer in DynamoDB
	if err := db.PutCustomer(h.dbClient, h.tableName, &customer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// DeleteCustomer handles DELETE /customers/:id
func (h *Handler) DeleteCustomer(c *gin.Context) {
	id := c.Param("id")

	// Check if customer exists
	existingCustomer, err := db.GetCustomer(h.dbClient, h.tableName, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check customer"})
		return
	}

	if existingCustomer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Delete customer from DynamoDB
	if err := db.DeleteCustomer(h.dbClient, h.tableName, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// HealthCheck handles GET /health
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "customer-api",
	})
}
