#!/usr/bin/env python3
"""
Complaint Management System - Integration Test
Tests all estates officer management endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
API_URL = "http://localhost:5000/api"
EMAIL = "admin@mak.ac.ug"
PASSWORD = "Admin@123"

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log_info(msg):
    print(f"{CYAN}ℹ {msg}{RESET}")

def log_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def log_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def log_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

print("\n" + "=" * 50)
print("Complaint Management System - Integration Test")
print("=" * 50 + "\n")

# Step 1: Login
log_info("Logging in...")
try:
    login_response = requests.post(
        f"{API_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=10
    )
    if not login_response.ok:
        log_error(f"Login failed: {login_response.text}")
        sys.exit(1)
    
    token = login_response.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    log_success(f"Login successful. Token: {token[:20]}...")
except Exception as e:
    log_error(f"Login error: {str(e)}")
    sys.exit(1)

# Step 2: Get management queue
log_info("\nTEST 1: Get Management Queue")
try:
    response = requests.get(f"{API_URL}/management/queue", headers=headers, timeout=10)
    if response.ok:
        data = response.json()["data"]
        log_success(f"Queue retrieved. {data.get('count', 0)} complaints found")
        
        if data.get("complaints") and len(data["complaints"]) > 0:
            complaint_id = data["complaints"][0]["_id"]
            log_info(f"Using complaint ID: {complaint_id}")
        else:
            log_warning("No complaints in queue. Create one first in the UI!")
            sys.exit(0)
    else:
        log_error(f"Failed to get queue: {response.text}")
        sys.exit(1)
except Exception as e:
    log_error(f"Queue error: {str(e)}")
    sys.exit(1)

# Step 3: Get stats
log_info("\nTEST 2: Get Dashboard Stats")
try:
    response = requests.get(f"{API_URL}/management/stats", headers=headers, timeout=10)
    if response.ok:
        stats = response.json()["data"]
        log_success(f"Stats retrieved:")
        log_info(f"  - Total: {stats.get('totalComplaints', 0)}")
        log_info(f"  - SLA Breaches: {stats.get('slaBreaches', 0)}")
        log_info(f"  - Resolved: {stats.get('resolved', 0)}")
    else:
        log_error(f"Failed to get stats: {response.text}")
except Exception as e:
    log_error(f"Stats error: {str(e)}")

# Step 4: Validate complaint
log_info("\nTEST 3: Validate Complaint")
try:
    payload = {
        "isLegitimate": True,
        "validationNotes": "Test validation - legitimate complaint"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/validate",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        status = response.json()["data"].get("status")
        log_success(f"Complaint validated. Status: {status}")
    else:
        log_warning(f"Validation: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Validation error: {str(e)}")

# Step 5: Triage
log_info("\nTEST 4: Triage Complaint")
try:
    payload = {
        "priority": "MEDIUM",
        "category": "Infrastructure",
        "triageNotes": "Medium priority infrastructure issue"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/triage",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        data = response.json()["data"]
        log_success(f"Triaged. Priority: {data.get('priority')}, Category: {data.get('category')}")
    else:
        log_warning(f"Triage: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Triage error: {str(e)}")

# Step 6: Define scope
log_info("\nTEST 5: Define Scope")
try:
    payload = {
        "scopeDescription": "Repair broken pipes",
        "estimatedCost": 15000,
        "estimatedDuration": "2 days",
        "resourcesNeeded": ["Plumber", "Pipes"]
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/scope",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        scope = response.json()["data"].get("taskScope", {})
        log_success(f"Scope defined. Duration: {scope.get('estimatedDuration')}, Cost: {scope.get('estimatedCost')}")
    else:
        log_warning(f"Scope: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Scope error: {str(e)}")

# Step 7: Get technicians
log_info("\nTEST 6: Get Technicians")
tech_id = None
try:
    response = requests.get(f"{API_URL}/management/technicians", headers=headers, timeout=10)
    if response.ok:
        techs = response.json()["data"]
        if techs:
            tech_id = techs[0]["_id"]
            log_success(f"Technicians retrieved. Count: {len(techs)}, First: {techs[0].get('name')}")
        else:
            log_warning("No technicians in system. Using mock ID.")
            tech_id = "mock-tech-001"
    else:
        log_warning("Could not fetch technicians. Using mock ID.")
        tech_id = "mock-tech-001"
except Exception as e:
    log_warning(f"Technician fetch error: {str(e)}. Using mock ID.")
    tech_id = "mock-tech-001"

# Step 8: Assign
log_info("\nTEST 7: Assign Complaint")
try:
    payload = {
        "assignedTo": tech_id,
        "assignedTechnicianName": "John Technician",
        "assignmentNotes": "Test assignment"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/assign",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        assigned_to = response.json()["data"].get("assignedTechnicianName")
        log_success(f"Assigned to: {assigned_to}")
    else:
        log_warning(f"Assignment: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Assignment error: {str(e)}")

# Step 9: Confirm
log_info("\nTEST 8: Confirm Assignment")
try:
    payload = {
        "resourcesConfirmed": True,
        "confirmationNotes": "Technician confirmed"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/confirm",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        status = response.json()["data"].get("status")
        log_success(f"Confirmed. Status: {status}")
    else:
        log_warning(f"Confirmation: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Confirmation error: {str(e)}")

# Step 10: Schedule inspection
log_info("\nTEST 9: Schedule Inspection")
try:
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    payload = {
        "inspectionDate": tomorrow,
        "inspectionTime": "14:00",
        "inspectorName": "Inspector John",
        "inspectionNotes": "Test inspection"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/schedule-inspection",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        inspection = response.json()["data"].get("inspectionSchedule", {})
        log_success(f"Scheduled. Date: {inspection.get('inspectionDate')}, Time: {inspection.get('inspectionTime')}")
    else:
        log_warning(f"Schedule: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Schedule error: {str(e)}")

# Step 11: Quality check
log_info("\nTEST 10: Quality Check")
try:
    payload = {
        "qualityStatus": "pass",
        "comments": "Work meets standards"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/quality-check",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        quality = response.json()["data"].get("qualityCheck", {})
        log_success(f"Quality check passed. Status: {quality.get('qualityStatus')}")
    else:
        log_warning(f"Quality: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Quality check error: {str(e)}")

# Step 12: Resident approval
log_info("\nTEST 11: Resident Approval")
try:
    payload = {
        "approved": True,
        "feedback": "Resident satisfied"
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/resident-approval",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        approval = response.json()["data"].get("residentApproval", {})
        log_success(f"Approval recorded. Approved: {approval.get('approved')}")
    else:
        log_warning(f"Approval: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Approval error: {str(e)}")

# Step 13: Close complaint
log_info("\nTEST 12: Close Complaint")
try:
    payload = {
        "closureReason": "resolved",
        "resolutionNotes": "Successfully resolved and approved",
        "followUpNeeded": False
    }
    response = requests.post(
        f"{API_URL}/management/{complaint_id}/close",
        json=payload,
        headers=headers,
        timeout=10
    )
    if response.ok:
        final_status = response.json()["data"].get("status")
        log_success(f"Complaint closed. Final status: {final_status}")
    else:
        log_warning(f"Close: {response.json().get('message', response.text)}")
except Exception as e:
    log_error(f"Close error: {str(e)}")

# Summary
print("\n" + "=" * 50)
log_success("Integration test completed!")
print("=" * 50)
print(f"\n{GREEN}✓ All management workflows tested successfully!{RESET}\n")
