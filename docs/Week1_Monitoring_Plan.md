# Week 1 – Monitoring Plan

## 1. Objective
Monitor the virtual machines, application services, and system resources to detect failures and help maintain service availability.

## 2. Monitoring infrastructure

The monitoring server is VM3:
- IP address: 10.10.10.13
- Services: Zabbix Server, Zabbix Web Interface, rsyslog collector.

## 3. Monitoring targets

| Machine | IP address | Monitoring targets |
|---|---|---|
| VM1 – Database | 10.10.10.11 | CPU, RAM, disk, PostgreSQL |
| VM2 – Application | 10.10.10.12 | CPU, RAM, disk, Nginx, Node.js API |
| VM4 – Automation | 10.10.10.14 | CPU, RAM, disk, GitLab Runner |

## 4. Monitoring tools
- Zabbix Server runs on VM3.
- Zabbix agents are installed on VM1, VM2, and VM4.
- Zabbix monitors system resources and service availability.
- Rsyslog collects logs from VM1, VM2, and VM4 on VM3.

## 5. Planned alerts
- A monitored service stops.
- CPU, RAM, or disk usage reaches a configured threshold.
- The application health check fails.
- A monitored machine becomes unavailable.

## 6. Expected result
A Zabbix dashboard displays the monitored hosts and application health. Alerts and centralized logs help the team identify and investigate failures.