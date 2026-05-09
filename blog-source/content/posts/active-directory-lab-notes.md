---
title: "Active Directory Lab Notes"
date: 2026-05-09T18:40:00+08:00
draft: false
summary: "Notes from building and attacking an Active Directory lab, with emphasis on enumeration, trust relationships, and privilege escalation paths."
tags: ["active-directory", "windows", "lateral-movement"]
categories: ["Labs"]
---

This lab was built to practice the part of offensive security that is harder to fake in isolated challenge boxes: working through trust relationships, user context, and Windows misconfigurations across a domain environment.

## Lab goals

- Practice AD enumeration without relying entirely on automation.
- Understand how low-privilege access turns into useful domain knowledge.
- Build repeatable notes for privilege escalation and lateral movement.

## Workflow that helped most

I split the lab into three phases.

### 1. Enumerate the environment

The first step was not exploitation. It was understanding the domain: hosts, users, groups, shares, policies, and where the interesting trust boundaries existed. BloodHound was useful, but I treated it as a visual aid rather than the entire workflow.

### 2. Validate attack paths manually

Once a possible path appeared, I tried to confirm it with smaller, targeted checks. That prevented me from over-trusting one tool result and forced me to understand why a path actually worked.

### 3. Record escalation patterns

Every successful step went into notes: weak permissions, reusable credentials, service misconfigurations, and pivots that made later movement easier. That note-taking matters because AD work becomes much clearer when repeated patterns start to stand out.

## Main takeaway

The value of an AD lab is not just learning one attack. It is learning how domain structure, user behavior, and small configuration weaknesses connect into a full compromise path.

That is the part I want to keep improving: not just executing the technique, but recognizing the chain early.
