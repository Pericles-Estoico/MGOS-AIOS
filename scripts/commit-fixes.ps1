# Script para commitar as correcoes no GitHub via API
# Execute no PowerShell: .\scripts\commit-fixes.ps1

# ============================================================
# CONFIG - Preencha seu GitHub Personal Access Token abaixo
# Crie em: https://github.com/settings/tokens/new
# Permissao necessaria: repo (Contents write)
# ============================================================
$GITHUB_TOKEN = $env:GITHUB_TOKEN

if (-not $GITHUB_TOKEN) {
    Write-Host ""
    Write-Host "GITHUB_TOKEN nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Crie um token em: https://github.com/settings/tokens/new" -ForegroundColor Yellow
    Write-Host "Permissao necessaria: repo -> Contents -> Write" -ForegroundColor Yellow
    Write-Host ""
    $GITHUB_TOKEN = Read-Host "Cole seu GitHub Token aqui"
}

$REPO = "Pericles-Estoico/MGOS-AIOS"
$BRANCH = "main"
$HEADERS = @{
    "Authorization" = "Bearer $GITHUB_TOKEN"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "Content-Type" = "application/json"
}

function Commit-File {
    param($FilePath, $LocalPath, $CommitMessage, $CurrentSha)
    
    Write-Host "Commitando: $FilePath..." -ForegroundColor Cyan
    
    # Le o arquivo local e converte para Base64
    $Content = Get-Content -Path $LocalPath -Raw -Encoding UTF8
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Content)
    $Base64 = [Convert]::ToBase64String($Bytes)
    
    $Body = @{
        message = $CommitMessage
        content = $Base64
        sha = $CurrentSha
        branch = $BRANCH
    } | ConvertTo-Json -Depth 5
    
    $Url = "https://api.github.com/repos/$REPO/contents/$FilePath"
    
    try {
        $Response = Invoke-RestMethod -Uri $Url -Method Put -Headers $HEADERS -Body $Body -ContentType "application/json"
        Write-Host "  OK! Commit: $($Response.commit.sha.Substring(0,7))" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $Reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            Write-Host "  Detalhe: $($Reader.ReadToEnd())" -ForegroundColor Red
        }
        return $false
    }
}

Write-Host ""
Write-Host "=== Commitando correcoes de build ===" -ForegroundColor White
Write-Host ""

$ProjectRoot = "C:\Users\finaa\Documents\GitHub\MGOS-AIOS"

# Commit 1: redis-client.ts (remover export default duplicado)
$Ok1 = Commit-File `
    -FilePath "lib/redis-client.ts" `
    -LocalPath "$ProjectRoot\lib\redis-client.ts" `
    -CommitMessage "fix: remove duplicate export default in redis-client" `
    -CurrentSha "84bd4f7a9b7f82a7ce93cda11bcdc987223f64d2"

# Commit 2: apply-migration.ts (restaurar versao correta)
$Ok2 = Commit-File `
    -FilePath "scripts/apply-migration.ts" `
    -LocalPath "$ProjectRoot\scripts\apply-migration.ts" `
    -CommitMessage "fix: restore apply-migration with valid Supabase API" `
    -CurrentSha "228b510c5f4dc8eeb3626e27298584a6691cc678"

Write-Host ""
if ($Ok1 -and $Ok2) {
    Write-Host "SUCESSO! Ambos os arquivos foram commitados." -ForegroundColor Green
    Write-Host "O deploy na Vercel iniciara automaticamente em alguns segundos." -ForegroundColor Green
    Write-Host ""
    Write-Host "Acompanhe em: https://vercel.com/pericles-projects-371fcf77/mgos-aios-evqe/deployments" -ForegroundColor Cyan
} else {
    Write-Host "Alguns commits falharam. Verifique o token GitHub." -ForegroundColor Red
    Write-Host "Crie um novo token em: https://github.com/settings/tokens/new" -ForegroundColor Yellow
}
Write-Host ""
