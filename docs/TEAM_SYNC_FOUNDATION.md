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

The first deployment has one organization row representing the company/security administration. Every team record carries `org_id`; branch-scoped records also carry `branch_id`. A future multi-company product would need a deliberate schema/RLS redesign and is not implied by this first release. The SQL schema enforces a single organization row and uses text keys for locally generated branch, record, device, attachment, and mutation IDs so older DEEBO-generated identifiers can be preserved during migration; authentication user IDs and organization IDs remain UUIDs. It also includes server-side mutation receipt keys for idempotency and per-device download cursors; those tables are intentionally inaccessible to direct client table access until trusted RPCs are added.

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

The SQL schema/RLS foundation is followed by a second migration containing authenticated `deeb_apply_record_mutation(jsonb)` and `deeb_pull_records(...)` RPCs. Direct INSERT/UPDATE policies on `deeb_records` are removed so operational record writes must use the revision-checked RPC. The apply RPC validates the authenticated profile, single organization, enrolled device, branch access, and the security-officer entity allowlist; it serializes idempotency-key retries, stores mutation receipts, checks `base_revision`, records conflicts, and appends the supplied audit event only on success. The pull RPC returns branch-scoped records in stable `(updated_at,id)` order with a bounded page size.

**These RPCs are not yet production-ready or connected to the app.** The client still has no network worker; device enrollment/bootstrap, invitations/role administration, append-only handover/report RPCs, attachment Storage lifecycle, cursor persistence, and a production RLS/RPC test suite remain outstanding. The current RPC deliberately rejects non-record actions such as `attachment`, `approve`, and `handover_version` rather than silently acknowledging them. Do not apply the migrations to real data or enable team mode until the remaining work and SQL tests are complete.

## Implemented in the development branch

- IndexedDB schema version 4 adds `sync_state`, `sync_outbox`, and `sync_conflicts` additively. Existing operational stores are not cleared or rewritten.
- A persistent per-installation device ID is created locally.
- Explicit team-context configuration is separate from the default local-only mode.
- Outbox primitives support stable mutation IDs, ordered pending reads, exponential retry backoff, server acknowledgements, and conflict records.
- In team mode, regular record create/update, manual and automatic archive, unarchive, motorcycle soft-delete/restore, handover versions, approved report snapshots, and attachment metadata are queued in the same IndexedDB transaction as their local data and audit event. Attachment bytes remain in IndexedDB for a later resumable upload. Local backup restore is blocked while team mode is active or unsynced/conflicted mutations remain, preventing a restore from silently orphaning queued work.
- Cursor storage is available for later incremental downloads.
- A separate SQL migration adds authenticated record-apply and incremental-pull RPCs, disables direct client record writes, checks branch/device/org permissions and revisions, stores idempotency receipts, and returns explicit conflict payloads. Handover versions are appended atomically with the parent record update.
- Device enrollment, device heartbeat, and monotonic per-device cursor advancement are available only through authenticated RPCs; direct device registration/update policies are removed.
- A dedicated append-only RPC stores approved report snapshots and their audit event. Direct client insert policies for audit history, approved reports, handover versions, and sync conflicts are removed.
- Private attachment flow now reserves an opaque org/record/attachment path, allows upload only to the private `deebo-private` bucket, and finalizes only after the stored object size and MIME type match the reservation. Allowed files are limited to 20 MiB and a short allowlist of image/document formats.
- A one-time, lock-protected first-admin bootstrap creates the singleton organization. Checked RPCs manage branches and branch assignments. The `deebo-invite` Edge Function validates the caller's role, sends an Auth invitation, creates the profile, and rolls back the invited account if profile or branch assignment fails.
- Incremental pulls now create a pending page boundary. The client must persist the returned page locally and acknowledge that exact boundary before the server cursor advances; retries replay from the committed boundary rather than skipping ahead.
- These server functions have not been applied to a Supabase project or exercised against PostgreSQL.
- Integration tests seed a version-3 database and verify its existing record survives the additive upgrade; they also cover local-mode default, stable device identity, duplicate mutation IDs, retry timing, acknowledgements, conflict resolution, cursor persistence, queued record/handover/attachment/approval/archive/tombstone changes, and switching back to local mode.

**Important current limit:** the local write paths now queue supported mutations, but there is still no network worker or Supabase endpoint connected. No cloud synchronization is active, and the local integration suite has been updated but not executed in this environment. Do not enroll real team data yet.

## Delivery phases

1. **Foundation (this branch):** isolated branch, data inventory, tenancy/role model, SQL schema with RLS, and migration/sync design.
2. **Local outbox integration (in progress):** complete and test every local mutation path, including permanent-retention audit semantics, and attachment upload lifecycle.
3. **Server mutation API:** authenticated record, handover, approved-report, device-enrollment, acknowledged cursor, attachment, bootstrap, branch-administration, and staff-invitation flows are authored. Next add account role/deactivation controls, the app network worker, and database-level regression tests.
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
