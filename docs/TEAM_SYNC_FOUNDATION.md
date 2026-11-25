# DEEBO team mode and offline sync foundation

Status: design baseline for the isolated development branch. This document does not change the approved `فريدة` branch.

## Product modes

- **Local mode:** one device, no account and no network dependency. Existing IndexedDB behavior remains available.
- **Team mode:** one company / one security administration, multiple branches, users and devices. Supabase Auth identifies people; PostgreSQL is the shared source of truth for team data.
- Both modes use local-first reads. Team-mode writes are committed to IndexedDB first and placed in a durable outbox. A background/foreground sync worker retries when connectivity returns.

## Non-negotiable safety rules

1. Never change the approved baseline branch `feature/deeb-premium-gold-ui-2026-11-24`.
2. Never upgrade or clear the existing `DEBOO16_LOCAL_DB` as part of enabling team mode without a reviewed, reversible migration.
3. Preserve record IDs, entity types, payloads, branch links, archive/deletion flags, created timestamps, audit history, approved report snapshots, handover versions, and attachment bytes.
4. A first-time team-mode enrollment must create a validated export/backup, show a migration preview, map existing branches, and require confirmation before upload.
5. No silent last-write-wins for approved reports, audit events, handover versions, or critical operational records. Conflicts must be retained and surfaced for authorized review.
6. Local mode must not require Supabase credentials, login, or internet access.
7. No Supabase service-role key or other privileged secret may be shipped in the web app or APK.

## One-administration tenancy model

The first deployment has one organization row representing the company/security administration. Every team record carries `org_id`; branch-scoped records also carry `branch_id`. A future multi-company product would need a deliberate schema/RLS redesign and is not implied by this first release.

### Roles

- `system_admin`: manages the whole DEEBO team workspace and user assignments.
- `security_manager`: organization-wide security administration.
- `department_manager`: organization-wide department oversight.
- `supervisor`: only assigned branches.
- `security_officer`: only assigned branches and permitted operational actions.

Role names alone are not enough: branch membership and server-side row-level security determine access. The UI is not a security boundary.

## Existing local data inventory

Approved baseline `فريدة` uses IndexedDB `DEBOO16_LOCAL_DB`, version 3. The isolated development branch upgrades this database additively to version 4.

Stores: `records`, `audit_logs`, `approved_reports`, `handover_versions`, `attachments`, `automatic_backups`.

Current record envelope includes `id`, `entity_type`, `payload`, `branch_id`, `status`, `is_archived`, `is_deleted`, `created_at`, `updated_at`, and `created_by`. Existing audit rows and specialized stores must remain first-class data during migration.

## Sync protocol to implement

### Device identity and metadata

Each installation gets a random persistent `device_id`. Team-mode mutations carry:
- `org_id`, `branch_id`, `user_id`, `device_id`
- stable record UUID and stable mutation UUID (idempotency key)
- `base_revision`, local `updated_at`, server revision, and schema version
- tombstone metadata for deletions rather than immediate hard deletion

### Upload/download cycle

1. A local write and its outbox item are committed atomically in one IndexedDB transaction.
2. The client uploads outbox mutations in deterministic order with retry/backoff.
3. The server validates authentication, organization, branch membership, allowed entity/action, and expected revision.
4. Replayed mutation UUIDs return the original result; they do not create duplicate records or audit events.
5. Successful acknowledgements mark outbox items complete and advance a durable per-device sync cursor.
6. The client downloads changes after its cursor and applies them idempotently.
7. Attachments upload separately to a private Storage bucket; metadata is not marked synced until the object upload is verified.
8. Failed authorization and revision conflicts remain visible; they are not discarded.

### Conflict policy

- Reference/master data: field-aware merge only for explicitly declared safe fields; otherwise retain both versions for review.
- Ordinary operational records: optimistic concurrency using `base_revision`; stale writes create a conflict item rather than overwrite newer server data.
- Approved report snapshots, audit logs, and handover versions: append-only/immutable.
- Archive and delete: tombstones with actor, timestamp, reason, and audit event.
- No global "last write wins" rule.

## Current implementation boundary

The SQL migration is a **schema/RLS foundation only**. The current DEEBO app is not connected to Supabase, and no cloud sync is active. The migration does not yet provide the trusted mutation RPCs, revision-checked write path, invitation/bootstrap workflow, Storage bucket policies, or production RLS test suite. Do not connect real user data or deploy team mode until those pieces are implemented and tested. Direct table writes are not the final sync contract.

## Implemented in the development branch

- IndexedDB schema version 4 adds `sync_state`, `sync_outbox`, and `sync_conflicts` additively. Existing operational stores are not cleared or rewritten.
- A persistent per-installation device ID is created locally.
- Explicit team-context configuration is separate from the default local-only mode.
- Outbox primitives support stable mutation IDs, ordered pending reads, exponential retry backoff, server acknowledgements, and conflict records.
- In team mode, regular record create/update, manual and automatic archive, unarchive, motorcycle soft-delete/restore, handover versions, approved report snapshots, and attachment metadata are queued in the same IndexedDB transaction as their local data and audit event. Attachment bytes remain in IndexedDB for a later resumable upload.
- Cursor storage is available for later incremental downloads.
- Integration tests seed a version-3 database and verify its existing record survives the additive upgrade; they also cover local-mode default, stable device identity, duplicate mutation IDs, retry timing, acknowledgements, conflict resolution, cursor persistence, queued record/handover/attachment/approval/archive/tombstone changes, and switching back to local mode.

**Important current limit:** the local write paths now queue supported mutations, but there is still no network worker or Supabase endpoint connected. No cloud synchronization is active, and the local integration suite has been updated but not executed in this environment. Do not enroll real team data yet.

## Delivery phases

1. **Foundation (this branch):** isolated branch, data inventory, tenancy/role model, SQL schema with RLS, and migration/sync design.
2. **Local outbox integration (in progress):** complete and test every local mutation path, including archive cleanup, permanent retention, audit append-only semantics, and attachment upload lifecycle.
3. **Server mutation API:** authenticated RPCs for idempotent writes, revision checks, audit append, and scoped downloads.
4. **Team enrollment and administration:** create the one organization, invite users, assign roles and branch memberships.
5. **Attachments and recovery:** private object storage, resumable uploads, encrypted exports, tested restore and rollback.
6. **UI and Android verification:** mode selection, connection/sync status, permission screens, offline/online scenarios, and physical-device regression tests.

## Acceptance gates

- Existing local-mode behavior and all current reports/printing remain unchanged.
- A device can record work offline, close/reopen the app, then sync exactly once after reconnection.
- Two devices editing the same record cannot silently erase each other's changes.
- A user cannot read or mutate an unassigned branch by calling the API directly.
- Audit and approved snapshots cannot be edited/deleted by ordinary users.
- Migration can be cancelled or rolled back without loss of the original local database.
- CI tests cover duplicate delivery, out-of-order delivery, offline restart, conflict handling, tombstones, and RLS role/branch boundaries.
- A release candidate is not promoted over `فريدة` without explicit user approval.
