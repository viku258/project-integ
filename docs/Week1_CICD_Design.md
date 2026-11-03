# Week 1 – CI/CD Design

## 1. Objective
Automate the deployment of the Campus Bites application using GitLab CI/CD and Ansible.

## 2. Pipeline stages

The pipeline will contain four stages:

1. **Build:** Prepare the application.
2. **Check:** Verify that the application passes basic checks.
3. **Deploy:** Use Ansible to deploy the application to VM2.
4. **Verify:** Check that the application is accessible after deployment.

## 3. Infrastructure

- GitLab Runner: VM4 (`10.10.10.14`)
- Application server: VM2 (`10.10.10.12`)
- Deployment tool: Ansible

## 4. Pipeline rules

- If Build or Check fails, deployment must not start.
- Deployment is performed through Ansible.
- Verify must fail if the application health endpoint does not respond.
- Deployment credentials must be stored securely, not committed to Git.

## 5. Expected result

A successful pipeline should build, check, deploy, and verify the Campus Bites application automatically.