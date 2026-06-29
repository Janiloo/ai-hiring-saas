# AI Hiring Automation Workflow

## Overview
This system automates candidate intake, AI evaluation, and human-approved hiring decisions.

---

## 1. Candidate Intake Flow

Email → n8n Gmail trigger → Supabase Candidate creation

Actions:
- Create candidate record
- Link to job_post_id
- Set status = "Applied"
- Send auto-reply email: "Application received"

---

## 2. AI Evaluation Flow

Triggered after candidate creation.

Input:
- Candidate data
- Job post data

Process:
- Send to Claude API
- Return:
  - score (0–100)
  - recommendation (reject / interview / review)
  - reasoning

AI does NOT send emails or modify database directly.

---

## 3. Human Approval Layer

All AI decisions require HR approval.

n8n generates:
- rejection email draft OR
- interview invitation draft

HR must approve before sending.

---

## 4. Execution Layer

After approval:
- send email to candidate
- update candidate status in Supabase
- log action history

---

## 5. System Rules

- No fully automated rejection or interview emails
- Human approval is mandatory
- AI only suggests, never executes
- Supabase is source of truth
- n8n handles workflow orchestration