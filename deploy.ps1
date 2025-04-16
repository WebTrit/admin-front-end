# Check if the first command-line parameter is provided
param(
    [Parameter(Position=0, Mandatory=$false)]
    [string]$serviceName,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$remainingArgs
)

if (-not $serviceName -or $serviceName -eq "-h") {
    Write-Host @"
Usage: cloud-deploy.ps1 <service-name> [options]

Deploy or update a Cloud Run service.

Arguments:
    service-name                 Name of the Cloud Run service to deploy. Required.

Options:
    --region <region>           GCP region for deployment.
                               Defaults to environment variable CLOUD_REGION
    --project-id <id>           GCP project ID. If not supplied, then env var PROJECT_ID
                               is used and if not set, then the default value multi-tenant-demo is used.
    --back-end-api <url>        URL of the backend API service.
                               If not supplied, uses BACK_END_API environment variable.

Environment variables:
    INITIAL_DEPLOY             If set, performs initial deployment with YAML config;
                              otherwise updates the code but keeps all the configuration variables
    CLOUD_REGION              Default region if not specified as argument
    PROJECT_ID                Default project ID if not specified as argument
    BACK_END_API             Default backend API URL if not specified as argument
"@
    exit 0
}

# Parse remaining arguments
$region = ""
$projectId = ""

for ($i = 0; $i -lt $remainingArgs.Count; $i++) {
    switch ($remainingArgs[$i]) {
        "--region" { 
            $region = $remainingArgs[$i + 1]
            $i++
        }
        "--project-id" { 
            $projectId = $remainingArgs[$i + 1]
            $i++
        }
    }
}

$projectId = if ($projectId) { $projectId } `
    elseif ([System.Environment]::GetEnvironmentVariable("PROJECT_ID")) { [System.Environment]::GetEnvironmentVariable("PROJECT_ID") } `
    else { "multi-tenant-demo" }

$projectName = "Multi Tenant Demo Staging"
$service_account = "bss-adapter"
$service_account_full = "$service_account@$projectId.iam.gserviceaccount.com"

$region = if ($region) { $region } `
    elseif ([System.Environment]::GetEnvironmentVariable("CLOUD_REGION")) { [System.Environment]::GetEnvironmentVariable("CLOUD_REGION") } `
    else { "europe-west3" }

# it should be near firestore, which is in the US
# not currently used in activation scripts
$pubsub_region = "us-central1"
$repo_region = "europe"

$tag = $serviceName
$cloudRunServiceName = $serviceName

# Perform operations in the new directory
$currentDirectory = $PWD.Path
Write-Host "Current Directory: $currentDirectory"

if (-not $repo_region) {
    $repo_region = "europe"
}

gcloud config set project $projectId

gcloud auth configure-docker "$repo_region-docker.pkg.dev"

$describe = gcloud run services describe $cloudRunServiceName --region $region --format="json"
$parsed = $describe | ConvertFrom-Json
$envVars = $parsed.spec.template.spec.containers[0].env

# Extract only VITE_* vars
$viteVars = $envVars | Where-Object { $_.name -like "VITE_*" }

# Write them to a .env.build file
@($viteVars | ForEach-Object { "$($_.name)=$($_.value)" }) | Set-Content -Path ".env.build"


#cd app
docker build -t $tag .

if (-not $repo_region) {
    $repo_region = "europe"
}
$registryId = "gcf-artifacts"
$image = "${repo_region}-docker.pkg.dev/$projectId/$registryId/$tag"
docker tag $tag $image
docker push $image

# when deploying 

$deployArgs = @(
    $cloudRunServiceName,
    "--image", $image,
    "--region", $region,
    "--port", "8080",
    "--cpu", "1",
    "--memory", "512Mi",
    "--concurrency", "80",
    "--timeout", "30",
    "--service-account", $service_account,
    "--allow-unauthenticated"
)


if ([System.Environment]::GetEnvironmentVariable("INITIAL_DEPLOY")) {
    # supply the yaml file with the environment variables so we do not have to set them all manually
    Write-Output "Will deploy a new service $cloudRunServiceName/$projectId in $region using image built in $currentDirectory"
    $yaml_cfg = "${currentDir}\vars\${cloudRunServiceName}.yaml"
    Write-Output "YAML config file $yaml_cfg"
    Get-Content -Path $yaml_cfg
    Write-Output "Edit the file if needed and press enter to continue..."
    $response = Read-Host
    $deployArgs += @("--env-vars-file", $yaml_cfg)
} else {
    Write-Output "Will update $projectId/$cloudRunServiceName in $region using image built in $currentDirectory"
    Write-Output "Press enter to continue..."
    $response = Read-Host
}

gcloud run deploy @deployArgs