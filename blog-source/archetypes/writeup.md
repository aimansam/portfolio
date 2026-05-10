---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true
summary: "Short summary of the target, initial foothold, lateral movement, and privilege escalation path."
tags: ["ctf", "web", "privilege-escalation"]
categories: ["Writeups"]
showToc: true
TocOpen: true
---

Write a short intro that tells readers what the target teaches and what the main attack path looks like.

## Challenge description

Add the challenge image or a short description of the target.

## Full attack chain summary

### Initial foothold

Explain the first useful finding and how it becomes code execution or shell access.

### Lateral movement

Explain how access moves from the first user or service account to the next useful account.

### Privilege escalation

Explain the root path and why the misconfiguration is exploitable.

## VM setup

1. Add setup notes here.
2. Add network assumptions here.

## Service discovery

Show the initial scan and summarize the important services.

```bash
nmap <target-ip> -sV -sC -oN initial.txt
```

## Initial foothold

Document the foothold steps with commands, screenshots, and short reasoning.

## Lateral movement

Document enumeration, useful permissions, credentials, or file access that leads to another user.

## Privilege escalation to root

Document the root escalation path and proof.

## Lessons learned

- Add the first practical lesson.
- Add the second practical lesson.
- Add the third practical lesson.