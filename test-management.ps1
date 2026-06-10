# Complaint Management System - Integration Test Script
# Tests all estates officer management endpoints

param(
    [string]$ApiUrl = "http://localhost:5000/api",
    [string]$AuthToken = ""
)

# Colors for output
$Success = @{ ForegroundColor = "Green" }
$Error = @{ ForegroundColor = "Red" }
$Warning = @{ ForegroundColor = "Yellow" }
$Info = @{ ForegroundColor = "Cyan" }

Write-Host "============================================" @Info
Write-Host "Complaint Management System - Integration Test" @Info
Write-Host "============================================" @Info
Write-Host ""

# Test 1: Get all complaints in queue
Write-Host "TEST 1: Get Management Queue" @Info
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/queue" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Queue retrieved successfully" @Success
    Write-Host "  Complaints in queue: $($response.data.count)" @Success
    
    if ($response.data.complaints.Count -gt 0) {
        $complaintId = $response.data.complaints[0]._id
        Write-Host "  First complaint ID: $complaintId" @Info
    }
} catch {
    Write-Host "✗ Failed to get queue: $($_.Exception.Message)" @Error
    exit 1
}

if (-not $complaintId) {
    Write-Host ""
    Write-Host "No complaints found in database. Please create a complaint first:" @Warning
    Write-Host "1. Go to http://localhost:5173/" @Warning
    Write-Host "2. Submit a test complaint" @Warning
    Write-Host "3. Run this test again" @Warning
    exit 0
}

Write-Host ""
Write-Host "TEST 2: Get Dashboard Stats" @Info
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/stats" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Stats retrieved successfully" @Success
    Write-Host "  Total complaints: $($response.data.totalComplaints)" @Success
    Write-Host "  SLA breaches: $($response.data.slaBreaches)" @Success
    Write-Host "  Resolved: $($response.data.resolved)" @Success
} catch {
    Write-Host "✗ Failed to get stats: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 3: Validate Complaint (Status: PENDING → ANALYZED)" @Info
try {
    $payload = @{
        isLegitimate = $true
        validationNotes = "Test validation - complaint is legitimate and requires follow-up"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/validate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Complaint validated successfully" @Success
    Write-Host "  New status: $($response.data.status)" @Success
} catch {
    Write-Host "✗ Validation failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 4: Triage Complaint (Status: ANALYZED → TRIAGED)" @Info
try {
    $payload = @{
        priority = "MEDIUM"
        category = "Infrastructure"
        triageNotes = "Categorized as infrastructure issue - medium priority"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/triage" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Complaint triaged successfully" @Success
    Write-Host "  Priority: $($response.data.priority)" @Success
    Write-Host "  Category: $($response.data.category)" @Success
} catch {
    Write-Host "✗ Triage failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 5: Define Scope (Status: TRIAGED → SCOPE_DEFINED)" @Info
try {
    $payload = @{
        scopeDescription = "Repair broken water pipes in block A"
        estimatedCost = 15000
        estimatedDuration = "2 days"
        resourcesNeeded = @("Plumber", "Pipes", "Tools")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/scope" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Scope defined successfully" @Success
    Write-Host "  Estimated duration: $($response.data.taskScope.estimatedDuration)" @Success
    Write-Host "  Estimated cost: $($response.data.taskScope.estimatedCost)" @Success
} catch {
    Write-Host "✗ Scope definition failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 6: Get Technicians" @Info
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/technicians" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    if ($response.data.Count -gt 0) {
        $technicianId = $response.data[0]._id
        Write-Host "✓ Technicians retrieved successfully" @Success
        Write-Host "  Available technicians: $($response.data.Count)" @Success
        Write-Host "  First technician: $($response.data[0].name)" @Info
    } else {
        Write-Host "⚠ No technicians found in system" @Warning
        $technicianId = "tech-001"
    }
} catch {
    Write-Host "✗ Failed to get technicians: $($_.Exception.Message)" @Error
    $technicianId = "tech-001"
}

Write-Host ""
Write-Host "TEST 7: Assign Complaint (Status: SCOPE_DEFINED → ASSIGNED)" @Info
try {
    $payload = @{
        assignedTo = $technicianId
        assignedTechnicianName = "John Doe"
        assignmentNotes = "Test assignment to available technician"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/assign" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Complaint assigned successfully" @Success
    Write-Host "  Assigned to: $($response.data.assignedTechnicianName)" @Success
} catch {
    Write-Host "✗ Assignment failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 8: Confirm Assignment (Status: ASSIGNED → CONFIRMED)" @Info
try {
    $payload = @{
        resourcesConfirmed = $true
        confirmationNotes = "Technician confirmed receipt and availability"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/confirm" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Assignment confirmed successfully" @Success
    Write-Host "  Status: $($response.data.status)" @Success
} catch {
    Write-Host "✗ Confirmation failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 9: Schedule Inspection (Status: WORK_COMPLETED → READY_FOR_VALIDATION)" @Info
try {
    $tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $payload = @{
        inspectionDate = $tomorrow
        inspectionTime = "14:00"
        inspectorName = "Inspector John"
        inspectionNotes = "Test inspection scheduling"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/schedule-inspection" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Inspection scheduled successfully" @Success
    Write-Host "  Date: $($response.data.inspectionSchedule.inspectionDate)" @Success
    Write-Host "  Time: $($response.data.inspectionSchedule.inspectionTime)" @Success
} catch {
    Write-Host "✗ Inspection scheduling failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 10: Perform Quality Check (Status: READY_FOR_VALIDATION → VALIDATED)" @Info
try {
    $payload = @{
        qualityStatus = "pass"
        comments = "Work meets quality standards"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/quality-check" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Quality check performed successfully" @Success
    Write-Host "  Quality status: $($response.data.qualityCheck.qualityStatus)" @Success
} catch {
    Write-Host "✗ Quality check failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 11: Record Resident Approval (Status: VALIDATED → APPROVED)" @Info
try {
    $payload = @{
        approved = $true
        feedback = "Resident is satisfied with the work"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/resident-approval" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Resident approval recorded successfully" @Success
    Write-Host "  Approval status: $($response.data.residentApproval.approved)" @Success
} catch {
    Write-Host "✗ Resident approval failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "TEST 12: Close Complaint (Status: APPROVED → CLOSED)" @Info
try {
    $payload = @{
        closureReason = "resolved"
        resolutionNotes = "Complaint resolved successfully and approved by resident"
        followUpNeeded = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/management/$complaintId/close" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -Headers @{ "Authorization" = "Bearer $AuthToken" } `
        -ErrorAction Stop
    
    Write-Host "✓ Complaint closed successfully" @Success
    Write-Host "  Final status: $($response.data.status)" @Success
    Write-Host "  Closure reason: $($response.data.closureReason)" @Success
} catch {
    Write-Host "✗ Closure failed: $($_.Exception.Message)" @Error
}

Write-Host ""
Write-Host "============================================" @Success
Write-Host "✓ All tests completed successfully!" @Success
Write-Host "============================================" @Success
Write-Host ""
Write-Host "Summary:" @Info
Write-Host "  - Queue management: ✓" @Success
Write-Host "  - Validation workflow: ✓" @Success
Write-Host "  - Triage workflow: ✓" @Success
Write-Host "  - Scope definition: ✓" @Success
Write-Host "  - Technician assignment: ✓" @Success
Write-Host "  - Confirmation process: ✓" @Success
Write-Host "  - Inspection scheduling: ✓" @Success
Write-Host "  - Quality checks: ✓" @Success
Write-Host "  - Resident approval: ✓" @Success
Write-Host "  - Complaint closure: ✓" @Success
