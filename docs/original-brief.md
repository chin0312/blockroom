# original-brief.md — background reference only

> ⚠️ **This file is not authoritative.** It's the original product owner
> brief that `docs/spec.md` and `docs/design.md` were distilled from,
> kept here for audit-trail purposes only. Where anything here conflicts
> with `spec.md` or `design.md`, **those two win** — they represent the
> reviewed, deliberately-scoped-down version of this brief.

---

You are helping me build a mini Web3 prototype called "BlockRoom Alpha".

This is NOT a production-ready application.

The purpose of this project is to demonstrate:

1. What I built
2. Which parts involve real blockchain interaction
3. How AI assisted the development process
4. What human decisions and modifications I made
5. Future directions of the product

The final output should be a clear, understandable Web3 demo.

---

# Product Vision

BlockRoom is a Web3 co-learning and co-working space prototype.

The idea:

Users can use their wallet as their identity and participate in learning activities.

The prototype demonstrates:

- Web3 identity through wallet connection
- A learning room experience
- On-chain learning reputation/check-in

The product should feel like:

StudyTogether
+
StudyStream
+
Web3 identity

---

# Development Philosophy

This is a learning project.

Prioritize:

- understanding over complexity
- clear architecture over scalability
- explainability over too many features

Do not over-engineer.

Do not create unnecessary backend systems.

Do not build features that are not required for the demo.

---

# Important Product Principles

## No fake user activity

Never create fake:

- online users
- user counts
- bookings
- social proof
- fake statistics

The demo should not pretend to have real users.

If a section requires unavailable data:

Use a meaningful empty state.

Example:

"No active learning rooms yet. Connect your wallet and start your first session."

---

# Web3 Philosophy

Use blockchain only where it provides meaningful value.

On-chain:

- learning check-ins
- reputation records
- achievement history

Off-chain:

- UI state
- static content
- future user profiles

Do not force unnecessary blockchain usage.

---

# Design Direction

Use:

Glassmorphism

+

Bento Box Layout

+

Spatial UI


The experience should feel like:

A modern digital learning space.

Reference:

- StudyTogether
- StudyStream
- Notion
- Linear
- Apple Vision Pro spatial design


Avoid:

- crypto exchange dashboard style
- cyberpunk neon
- dark hacker aesthetic
- overly complicated Web3 visuals

---

# Theme

Light mode only.

Do not implement dark mode.

---

# Color Palette

Metallic Chic:

Primary:
#3D52A0

Secondary:
#7091E6

Accent:
#8697C4

Soft:
#ADBBDA

Background:
#EDE8F5


Use:

- glass cards
- blur effects
- soft shadows
- clean spacing
- modern typography

---

# Required Workflow Before Coding

Before implementation, create:

/docs/spec.md

/docs/design.md

/docs/agent.md


---

# Phase 0: Specification

Use Spec Kit:

https://github.com/github/spec-kit


Create spec.md.

Include:

## Product Overview

## User Problem

## Demo Objective

## Target User

## Core User Flow

## Features Included

## Features Excluded

## Technical Architecture

## Smart Contract Purpose

## Future Expansion


Keep the scope focused on a mini demo.

---

# Phase 0: Design System

Use UI UX Pro Max:

https://github.com/nextlevelbuilder/ui-ux-pro-max-skill


Create design.md.

Include:

- visual direction
- typography
- color system
- glassmorphism rules
- bento card patterns
- spacing system
- component style
- responsive behavior


---

# Phase 0: AI Agent Rules

Use Grill Me:

https://github.com/mattpocock/skills/tree/main/grill-me


Create agent.md.

Define:

- coding conventions
- when to ask questions
- explain before implementation
- avoid unnecessary complexity
- maintain beginner-friendly explanations
- document AI-generated code changes


---

# Implementation Scope

Only implement the following:

---

# 1. Landing Page

Purpose:

Explain what BlockRoom is.

Include:

Hero section:

"Your Web3 co-learning space."

Buttons:

- Connect Wallet
- Enter BlockRoom


Sections:

- What is BlockRoom
- How it works
- On-chain reputation explanation


---

# 2. Wallet Connection

Implement wallet connection together with frontend.

Use:

- wagmi
- RainbowKit
- viem


Requirements:

- Connect MetaMask compatible wallet
- Display wallet address
- Display Monad Testnet network

Example:

Connected:

0x1234...abcd

Network:

Monad Testnet


Wallet is used as:

User identity.

---

# 3. Learning Room Prototype

Create a simple room interface.

Example:

Room cards:

- Solidity Basics
- Monad Builder Room
- AI Agent Discussion


These are UI prototypes only.

Do NOT create fake users.

Do NOT show fake online numbers.

The purpose is to demonstrate the product concept.

---

# 4. Smart Contract

Create a minimal Solidity contract.

Contract name:

BlockRoomCheckIn.sol


Purpose:

Record learning achievements on-chain.


Function requirements:

## Write Function

checkIn()

When called:

- record user's check-in
- increase completed session count
- emit event


## Read Function

getCheckIns(address user)

Return:

number of completed sessions


Use:

Solidity

OpenZeppelin if needed


Keep the contract simple.

Explain every important line.

---

# 5. Deploy Smart Contract

Deploy to:

Monad Testnet


Use:

Remix or Hardhat.

Record:

- contract address
- deployment transaction hash


Complete:

1 read interaction

Example:

getCheckIns()


1 write interaction

Example:

checkIn()


---

# 6. Frontend Contract Interaction

Add button:

"Complete Learning Session"


Flow:

User connects wallet

↓

Clicks Complete Learning Session

↓

Wallet transaction appears

↓

Transaction confirmed

↓

On-chain reputation increases


---

# Technical Stack

Frontend:

- Next.js
- TypeScript
- Tailwind CSS


Web3:

- Solidity
- wagmi
- RainbowKit
- viem


Network:

Monad Testnet


---

# Development Approach

Work incrementally.

After every step:

Explain:

1. What was built
2. Why this approach was chosen
3. Which files changed
4. How to test it


Do not generate the entire project at once.

---

# Final Deliverables

The project should include:

## Working Demo

- Website
- Wallet connection
- Monad interaction


## Documentation

README.md including:

1. Project introduction

2. Features

3. Architecture

4. AI-assisted development process

5. Human decisions and modifications

6. Smart contract explanation

7. Deployment information

8. Future roadmap


---

# Future Ideas (Do NOT implement now)

Possible future improvements:

- real learning rooms
- database
- user profiles
- booking system
- video call
- NFT badges
- reputation system
- DAO/community features
