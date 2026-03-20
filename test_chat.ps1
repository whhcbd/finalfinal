# Test AI Chat API
$body = @{
    message = "什么是孟德尔第一定律？请用孟德尔方格图解释"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/chat" -Method POST -Body $body -ContentType "application/json"
Write-Host $response.Content
