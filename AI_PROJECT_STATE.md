# AI HR SaaS — Project State (Current Architecture)

## 🧠 Overview

This is a multi-tenant AI-powered HR SaaS platform built with:

* Next.js frontend
* Supabase backend (Auth + Database + RLS)
* SMTP (Gmail) for email notifications
* Role-based access control (RBAC)
* Organization-based multi-tenancy

---

## 🏗️ Current System Status

### ✅ Completed Systems

* Supabase Auth (login / signup / session management)
* Invitation system (email-based onboarding)
* Role-based access control:

  * admin
  * recruiter
  * interviewer
* Organization system (multi-tenant structure)
* SMTP email sending (Gmail working)
* Candidate pipeline system (basic stages working)
* Job posts system
* Candidate activity logging system
* Interview scheduling system

---

## 🧩 Core Architecture Rules

### 1. Multi-tenancy rule

ALL data must be scoped by:

* organization_id

This applies to:

* job_posts
* candidates
* interviews
* email_drafts
* activity_logs

---

### 2. Authentication vs Authorization

* Supabase Auth = identity (who you are)
* organization_members = permissions (what you can do)
* invitations = onboarding only

---

### 3. Role permissions

#### ADMIN

* Full access to organization data
* Manage users (invite/remove roles)
* Create/edit/delete job posts
* Manage candidates & interviews
* View all activity logs
* Manage email drafts

#### RECRUITER

* Manage job posts
* Manage candidates
* Schedule interviews
* Create email drafts
* Cannot manage users or settings

#### INTERVIEWER

* View assigned candidates/interviews
* Submit feedback
* Cannot modify job posts or users

---

## 📩 Invitation Flow (IMPORTANT)

1. Admin sends invitation
2. Email sent via SMTP
3. User clicks invite link
4. User either:

   * signs up (if new user)
   * logs in (if existing user)
5. System creates:

   * organization_members entry
   * assigns role from invitation
   * marks invitation as accepted

NO ROLE EXISTS WITHOUT organization_members.

---

## ⚠️ Known Constraints

* Supabase RLS is strictly enforced
* No direct access to auth.users table
* Service role key used ONLY in backend admin actions
* No n8n integration yet (future phase)
* No AI automation implemented yet

---

## 🧪 What Works Right Now

* Invitation emails are sent successfully
* Users can accept invitations
* Roles are assigned correctly
* SMTP is working
* Basic pipeline system works
* Candidate activity logs are working

---

## 🚧 Current Gaps / Risks

* Role-based UI inconsistencies may still exist
* Some queries may not fully enforce organization_id scoping
* Delete account feature is not stable
* Invitation acceptance flow must be verified for edge cases

---

## 🎯 Next Phase (NOT IMPLEMENTED YET)

Planned:

* AI candidate scoring system
* Email draft approval workflow
* n8n automation layer
* Advanced hiring pipeline per job post
* Analytics dashboard
