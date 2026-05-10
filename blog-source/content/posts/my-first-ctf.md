---
title: "My First CTF: Enumeration Lessons That Made Exploitation Click"
date: 2026-05-06T00:34:31+08:00
draft: false
summary: "How my first rooted CTF target taught me to slow down, enumerate carefully, and turn small signals into a full attack path."
tags: ["ctf", "enumeration", "privilege-escalation"]
categories: ["Writeups"]
---

My first rooted CTF machine was where a lot of disconnected concepts finally started to feel practical. Instead of solving isolated challenge boxes, I had to think through a full attack path: enumerate, identify the weak point, gain a foothold, and then escalate privileges without guessing.

## What I focused on

- Enumerating services before touching exploitation.
- Taking notes on every interesting response instead of relying on memory.
- Testing the smallest believable path first instead of jumping straight into noisy payloads.

## Attack path summary

The initial foothold came from basic web enumeration. A directory I almost ignored exposed functionality that behaved differently depending on input, which led to the first working access path. The lesson there was simple: slow enumeration beats clever guessing.

Once I had user-level access, the rest of the machine became a privilege escalation exercise. I checked scheduled tasks, SUID permissions, readable configs, and anything that looked like it might connect one user context to another. The escalation path was not especially advanced, but it reinforced a habit that matters in almost every box: understand the environment before firing tools blindly.

## What I learned

1. Enumeration is usually the real challenge.
2. Good notes make privilege escalation much faster.
3. Small signals matter more than large wordlists when the target is narrow.

This machine was not the hardest target I have solved, but it was the one that made the full workflow click for me.
