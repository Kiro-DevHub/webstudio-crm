# WebStudio CRM — Ubiquitous Language

Glossary of domain terms. Implementation details do not belong here.

## Actors

- **User** — an employee of the web studio who logs into the CRM. Has a role: **ADMIN** (manages everything, including users) or **MANAGER** (sees everything, edits only what they own).
- **Owner** — the User responsible for a Client or a Deal. Ownership drives edit permissions for managers.
- **Assignee** — the User a Task is assigned to. Distinct from owner: a task on someone's deal can be assigned to another user.

## Core entities

- **Client** — a company (prospect or customer) the studio works with. Has a contact person and a **Source** — the channel the client came from: WEBSITE, REFERRAL, SOCIAL, COLD (outreach), OTHER.
- **Deal** — a potential or ongoing project for a Client, moving through the pipeline. Money amounts are always in kopecks (minor units). A deal belongs to exactly one client; deleting a client deletes its deals and everything attached to them.
- **Task** — a unit of work with a due date, assigned to a User, optionally attached to a Deal. A task is **overdue** when it is not DONE and its due date is in the past — overdue is derived, never stored.
- **Note** — a free-text comment written by a User on a Deal.
- **Activity** — a journal entry recording what happened to a Deal or Client (created, stage changed, task completed, note added…). Every meaningful domain event writes one. Activities are the deal's/client's history, not an independent audit log: they live and die with the entity they describe.

## Pipeline

- **Stage** — position of a deal in the pipeline: `LEAD → BRIEF → PROPOSAL → CONTRACT → IN_PROGRESS → DELIVERY → WON | LOST`.
- **WON / LOST** — terminal stages. Only a closed deal has a **closed-at** date; only a LOST deal has a **lost reason**. A deal in any earlier stage is **open**.
