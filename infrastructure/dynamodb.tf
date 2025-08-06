resource "aws_dynamodb_table" "customers" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(local.tags, {
    Name = "${local.name}-customers-table"
  })
}

resource "aws_dynamodb_table_item" "example" {
  table_name = aws_dynamodb_table.customers.name
  hash_key   = aws_dynamodb_table.customers.hash_key

  item = jsonencode({
    id = {
      S = "example-customer-id"
    }
    name = {
      S = "Example Customer"
    }
    email = {
      S = "example@example.com"
    }
  })

  lifecycle {
    ignore_changes = all
  }
}