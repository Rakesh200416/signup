$f = "d:\LMS-Main-Pro-main\apps\admin-web\app\components\NeumorphicLoginForm.tsx"
$c = [System.IO.File]::ReadAllText($f)
$nl = "`n"

Write-Host "File length: $($c.Length)"

# === FALLBACK SIGN IN BUTTONS (16-space indent, 4x) ===
$old = '                <button type="submit" className={primaryButton} disabled={isLoggingIn}>' + $nl + '                  Sign in' + $nl + '                </button>'
$new = '                <NeumorphicButton type="submit" variant="primary" pill block disabled={isLoggingIn} iconLeft={<LogIn className="h-4 w-4" />}>' + $nl + '                  Sign in' + $nl + '                </NeumorphicButton>'
$count = 0; while ($c.Contains($old)) { $c = $c.Replace($old, $new); $count++ }
Write-Host "Fallback Sign in x$count"

# === HIDE FALLBACK OPTIONS ===
$old = '              <button type="button" className={`${secondaryButton} w-full sm:w-auto`} onClick={() => setShowFallback(false)}>' + $nl + '                Hide fallback options' + $nl + '              </button>'
$new = '              <NeumorphicButton type="button" variant="soft" pill onClick={() => setShowFallback(false)} iconLeft={<ChevronUp className="h-4 w-4" />}>' + $nl + '                Hide fallback options' + $nl + '              </NeumorphicButton>'
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Hide fallback" } else { Write-Host "MISS: Hide fallback" }

# === CHECK FALLBACK METHODS ===
$old = '            <button type="button" className={`${secondaryButton} mt-4`} onClick={openFallbackMethods}>' + $nl + '              Check fallback methods' + $nl + '            </button>'
$new = '            <NeumorphicButton type="button" variant="soft" pill onClick={openFallbackMethods} iconLeft={<ListFilter className="h-4 w-4" />}>' + $nl + '              Check fallback methods' + $nl + '            </NeumorphicButton>'
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Check fallback" } else { Write-Host "MISS: Check fallback" }

# === QR CODE BUTTON ===
$old = '                <button' + $nl + '                  type="button"' + $nl + '                  className={`${secondaryButton} w-full sm:w-auto ${isInitializingTotp ? "opacity-70 cursor-not-allowed" : ""}`}' + $nl + '                  onClick={initiateTotpSetup}' + $nl + '                  disabled={isInitializingTotp}' + $nl + '                >' + $nl + '                  {qrCodeDataUrl ? "Refresh QR code" : "Show QR scanner"}' + $nl + '                </button>'
$new = '                <NeumorphicButton' + $nl + '                  type="button"' + $nl + '                  variant="soft" pill className={isInitializingTotp ? "opacity-70 cursor-not-allowed" : ""}' + $nl + '                  onClick={initiateTotpSetup}' + $nl + '                  disabled={isInitializingTotp}' + $nl + '                  iconLeft={<Smartphone className="h-4 w-4" />}' + $nl + '                >' + $nl + '                  {qrCodeDataUrl ? "Refresh QR code" : "Show QR scanner"}' + $nl + '                </NeumorphicButton>'
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: QR code" } else { Write-Host "MISS: QR code" }

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "SAVED"
Write-Host "Remaining primaryButton: $((@(Select-String -Path $f -Pattern 'className=\{primaryButton\}')).Count)"
Write-Host "Remaining secondaryButton: $((@(Select-String -Path $f -Pattern 'className=\{secondaryButton\}|className=\{`')).Count)"
