$wrapperDir = "gradle\wrapper"
$wrapperJar = "$wrapperDir\gradle-wrapper.jar"

# Create directory if it doesn't exist
if (-not (Test-Path $wrapperDir)) {
    New-Item -ItemType Directory -Path $wrapperDir -Force
}

# Download the Gradle wrapper JAR
$url = "https://github.com/gradle/gradle/raw/master/gradle/wrapper/gradle-wrapper.jar"
Invoke-WebRequest -Uri $url -OutFile $wrapperJar

Write-Host "Gradle wrapper JAR downloaded successfully to $wrapperJar"
