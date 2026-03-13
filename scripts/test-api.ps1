# API Pipeline Test Script (PowerShell)
# Hits the live Next.js server to verify RAG and Recall endpoints

$baseUrl = "http://localhost:3000"

Write-Host "`n🧪 Testing /api/rag/extract..." -ForegroundColor Cyan
$extractPayload = @{
    transcript = "Sarah: We decided to migrate from REST to GraphQL. Tom: Agreed, I will own the implementation by Friday."
    department = "engineering"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$baseUrl/api/rag/extract" -ContentType "application/json" -Body $extractPayload | ConvertTo-Json


Write-Host "`n🧪 Testing /api/rag/graph..." -ForegroundColor Cyan
$graphRes = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/rag/graph?department=engineering"
Write-Host "✅ Nodes in graph: $($graphRes.nodes.Count)"
Write-Host "✅ Edges in graph: $($graphRes.edges.Count)"


Write-Host "`n🧪 Testing /api/recall/status (invalid bot_id check)..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Method Get -Uri "$baseUrl/api/recall/status?bot_id=invalid-id"
} catch {
    Write-Host "✅ Correctly failed as expected: $($_.Exception.Message)"
}

Write-Host "`n🎉 API Tests Complete!`n"
