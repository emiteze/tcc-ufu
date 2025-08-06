resource "aws_apigatewayv2_api" "customer_api" {
  name          = "${local.name}-api"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway for Customer Management API"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = local.tags
}

resource "aws_apigatewayv2_stage" "customer_api" {
  api_id = aws_apigatewayv2_api.customer_api.id

  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId            = "$context.requestId"
      sourceIp             = "$context.identity.sourceIp"
      requestTime          = "$context.requestTime"
      protocol             = "$context.protocol"
      httpMethod           = "$context.httpMethod"
      resourcePath         = "$context.resourcePath"
      routeKey             = "$context.routeKey"
      status               = "$context.status"
      responseLength       = "$context.responseLength"
      integrationRequestId = "$context.integration.requestId"
      integrationStatus    = "$context.integration.status"
      integrationLatency   = "$context.integration.latency"
      responseLatency      = "$context.responseLatency"
    })
  }

  depends_on = [aws_cloudwatch_log_group.api_gw]

  tags = local.tags
}

# API Gateway integration will be configured after application deployment
# The integration URI will need to be set to the ALB hostname created by the ingress

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.customer_api.name}"

  retention_in_days = 30

  tags = local.tags
}