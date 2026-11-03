# Week 1 – Evidence Plan

## 1. Objective
Collect evidence demonstrating that CI/CD deployment and monitoring work correctly.

## 2. CI/CD evidence
- Screenshot of the GitLab pipeline.
- Screenshot showing the Build, Check, Deploy, and Verify stages.
- Screenshot of a successful pipeline.
- Screenshot showing that a failed check prevents deployment.
- Evidence of successful application availability verification.

## 3. Monitoring evidence
- Screenshot of the Zabbix dashboard.
- Screenshot showing VM1, VM2, and VM4.
- Screenshot of CPU, RAM, and disk monitoring.
- Screenshot of an alert when a service becomes unavailable.
- Screenshot of centralized logs on VM3.
- Evidence showing that the alert clears after recovery.

## 4. Security evidence
- Confirm that credentials are not committed to the repository.
- Confirm that sensitive CI/CD variables are protected.
- Confirm that the application's .env file has restricted permissions.

## 5. Final demonstration
Demonstrate a successful deployment, simulate an application or service outage in the authorized test environment, show the resulting alert and logs, and demonstrate recovery.