$f = "d:\LMS-Main-Pro-main\apps\admin-web\app\components\NeumorphicLoginForm.tsx"
$c = [System.IO.File]::ReadAllText($f)
$nl = "`n"

Write-Host "File length: $($c.Length)"

# === PRIMARY BUTTONS ===

# 1. Request OTP button
$old = "        <button type=""button"" className={primaryButton} onClick={requestOtp} disabled={isRequestingOtp || isOtpLocked}>" + $nl + "          {isOtpLocked ? ""OTP locked"" : otpRequested ? ""Resend OTP"" : ""Request OTP""}" + $nl + "        </button>"
$new = "        <NeumorphicButton type=""button"" variant=""primary"" pill block onClick={requestOtp} disabled={isRequestingOtp || isOtpLocked} iconLeft={<Send className=""h-4 w-4"" />}>" + $nl + "          {isOtpLocked ? ""OTP locked"" : otpRequested ? ""Resend OTP"" : ""Request OTP""}" + $nl + "        </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Request OTP" } else { Write-Host "MISS: Request OTP" }

# 2. Verify OTP button
$old = "                  <button type=""button"" className={primaryButton} onClick={() => verifyOtpCode()} disabled={!otpRequested || isRequestingOtp}>" + $nl + "                    Verify OTP" + $nl + "                  </button>"
$new = "                  <NeumorphicButton type=""button"" variant=""primary"" pill block onClick={() => verifyOtpCode()} disabled={!otpRequested || isRequestingOtp} iconLeft={<ShieldCheck className=""h-4 w-4"" />}>" + $nl + "                    Verify OTP" + $nl + "                  </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Verify OTP" } else { Write-Host "MISS: Verify OTP" }

# 3. Sign in (primary submit) - 4 occurrences
$old = "                  <button type=""submit"" className={primaryButton} disabled={isLoggingIn}>" + $nl + "                    Sign in" + $nl + "                  </button>"
$new = "                  <NeumorphicButton type=""submit"" variant=""primary"" pill block disabled={isLoggingIn} iconLeft={<LogIn className=""h-4 w-4"" />}>" + $nl + "                    Sign in" + $nl + "                  </NeumorphicButton>"
$count = 0
while ($c.Contains($old)) { $c = $c.Replace($old, $new); $count++ }
Write-Host "OK: Sign in x$count"

# === SECONDARY BUTTONS ===

# 4. Hide fallback options (template literal, single-line opening)
$old = "              <button type=""button"" className={`${secondaryButton} w-full sm:w-auto`} onClick={() => setShowFallback(false)}>" + $nl + "                Hide fallback options" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={() => setShowFallback(false)} iconLeft={<ChevronUp className=""h-4 w-4"" />}>" + $nl + "                Hide fallback options" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Hide fallback" } else { Write-Host "MISS: Hide fallback" }

# 5. Use selected method
$old = "              <button type=""button"" className={secondaryButton} onClick={chooseOtherMethod}>" + $nl + "                Use selected method" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={chooseOtherMethod} iconRight={<ArrowRight className=""h-4 w-4"" />}>" + $nl + "                Use selected method" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Use selected method" } else { Write-Host "MISS: Use selected method" }

# 6. Check fallback methods (template literal mt-4)
$old = "            <button type=""button"" className={`${secondaryButton} mt-4`} onClick={openFallbackMethods}>" + $nl + "              Check fallback methods" + $nl + "            </button>"
$new = "            <NeumorphicButton type=""button"" variant=""soft"" pill onClick={openFallbackMethods} iconLeft={<ListFilter className=""h-4 w-4"" />}>" + $nl + "              Check fallback methods" + $nl + "            </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Check fallback" } else { Write-Host "MISS: Check fallback" }

# 7. Verify authenticator
$old = "              <button type=""button"" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>" + $nl + "                Verify authenticator" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={verifyFallbackMethod} disabled={isVerifyingFallback} iconLeft={<ShieldCheck className=""h-4 w-4"" />}>" + $nl + "                Verify authenticator" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Verify authenticator" } else { Write-Host "MISS: Verify authenticator" }

# 8. Verify answers
$old = "              <button type=""button"" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>" + $nl + "                Verify answers" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={verifyFallbackMethod} disabled={isVerifyingFallback} iconLeft={<ShieldCheck className=""h-4 w-4"" />}>" + $nl + "                Verify answers" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Verify answers" } else { Write-Host "MISS: Verify answers" }

# 9. Verify backup code
$old = "              <button type=""button"" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>" + $nl + "                Verify backup code" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={verifyFallbackMethod} disabled={isVerifyingFallback} iconLeft={<ShieldCheck className=""h-4 w-4"" />}>" + $nl + "                Verify backup code" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Verify backup code" } else { Write-Host "MISS: Verify backup code" }

# 10. Verify recovery code
$old = "              <button type=""button"" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>" + $nl + "                Verify recovery code" + $nl + "              </button>"
$new = "              <NeumorphicButton type=""button"" variant=""soft"" pill onClick={verifyFallbackMethod} disabled={isVerifyingFallback} iconLeft={<ShieldCheck className=""h-4 w-4"" />}>" + $nl + "                Verify recovery code" + $nl + "              </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: Verify recovery code" } else { Write-Host "MISS: Verify recovery code" }

# 11. QR code button (multi-line tag)
$old = "                <button" + $nl + "                  type=""button""" + $nl + "                  className={`${secondaryButton} w-full sm:w-auto ${isInitializingTotp ? ""opacity-70 cursor-not-allowed"" : """"}`}" + $nl + "                  onClick={initiateTotpSetup}" + $nl + "                  disabled={isInitializingTotp}" + $nl + "                >" + $nl + "                  {qrCodeDataUrl ? ""Refresh QR code"" : ""Show QR scanner""}" + $nl + "                </button>"
$new = "                <NeumorphicButton" + $nl + "                  type=""button""" + $nl + "                  variant=""soft"" pill className={isInitializingTotp ? ""opacity-70 cursor-not-allowed"" : """"}" + $nl + "                  onClick={initiateTotpSetup}" + $nl + "                  disabled={isInitializingTotp}" + $nl + "                  iconLeft={<Smartphone className=""h-4 w-4"" />}" + $nl + "                >" + $nl + "                  {qrCodeDataUrl ? ""Refresh QR code"" : ""Show QR scanner""}" + $nl + "                </NeumorphicButton>"
if ($c.Contains($old)) { $c = $c.Replace($old, $new); Write-Host "OK: QR code button" } else { Write-Host "MISS: QR code button" }

# 12. Choose another method (4x)
$old = "                <button" + $nl + "                  type=""button""" + $nl + "                  className={secondaryButton}" + $nl + "                  onClick={() => {" + $nl + "                    setFallbackSelectionOpen(true);" + $nl + "                    setShowFallback(true);" + $nl + "                    setFallbackAttemptFailed(false);" + $nl + "                  }}" + $nl + "                >" + $nl + "                  Choose another method" + $nl + "                </button>"
$new = "                <NeumorphicButton" + $nl + "                  type=""button""" + $nl + "                  variant=""soft"" pill" + $nl + "                  onClick={() => {" + $nl + "                    setFallbackSelectionOpen(true);" + $nl + "                    setShowFallback(true);" + $nl + "                    setFallbackAttemptFailed(false);" + $nl + "                  }}" + $nl + "                  iconRight={<ArrowRight className=""h-4 w-4"" />}" + $nl + "                >" + $nl + "                  Choose another method" + $nl + "                </NeumorphicButton>"
$count = 0
while ($c.Contains($old)) { $c = $c.Replace($old, $new); $count++ }
Write-Host "OK: Choose another method x$count"

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "SAVED"
Write-Host "Remaining primaryButton: $((Select-String -Path $f -Pattern 'className=\{primaryButton\}' -AllMatches).Matches.Count)"
Write-Host "Remaining secondaryButton: $((Select-String -Path $f -Pattern 'className=\{secondaryButton\}' -AllMatches).Matches.Count)"
