# Requires: gh auth login (https://github.com/login/device)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "Install GitHub CLI: https://cli.github.com/"
}

gh auth status | Out-Null
$user = gh api user -q .login
$repo = "deal-math"

Write-Host "GitHub user: $user"
Write-Host "Creating public repo $repo (if missing) and pushing main..."

$exists = gh repo view "$user/$repo" 2>$null
if (-not $exists) {
  gh repo create $repo --public --source=. --remote=origin --push
} else {
  git push -u origin main
}

Write-Host "Enabling GitHub Pages (workflow build)..."
gh api -X PUT "repos/$user/$repo/pages" -f build_type=workflow | Out-Null

$url = "https://$user.github.io/$repo/"
Write-Host "Site (after Actions finish, ~1-2 min): $url"
Write-Host "Actions: https://github.com/$user/$repo/actions"
