/**
 * Meridian RAG Seed Script
 * Run: npx tsx scripts/seed-rag.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const meetings = [
    {
        meeting_id: "a1b2c3d4-0001-0001-0001-000000000001",
        department: "engineering",
        transcript: `
      Sarah: After reviewing the options, we've decided to build the new auth service using REST APIs.
      It's the most battle-tested approach and our team knows it well.
      Tom: Agreed. I'll own the implementation. Target is two weeks.
      Sarah: Also, we're going with PostgreSQL for the user data store. No changes to the DB stack.
      Tom: One risk — if we hit scale issues, REST might become a bottleneck.
      Sarah: Noted. We'll revisit at 10k users. For now, ship it.
    `,
        extracted: {
            decisions: [
                { text: "Build new auth service using REST APIs", owner: "Tom", timestamp: 45 },
                { text: "Use PostgreSQL for the user data store", owner: "Sarah", timestamp: 90 },
            ],
            action_items: [
                { text: "Implement REST-based auth service", assignee: "Tom", due_date: "2025-08-01", timestamp: 60 },
                { text: "Document REST API endpoints for auth", assignee: "Tom", due_date: "2025-08-05", timestamp: 75 },
            ],
            risks: [
                { text: "REST may become a bottleneck at scale beyond 10k users", severity: "medium" },
            ],
            contradictions: [],
        },
    },
    {
        meeting_id: "a1b2c3d4-0002-0002-0002-000000000002",
        department: "engineering",
        transcript: `
      Sarah: Infrastructure review. We need to talk about the database layer.
      Marcus: I've been looking at this — I think we should move to MongoDB for flexibility.
      Sarah: That conflicts with our PostgreSQL decision. Let's discuss.
      Marcus: The new product requirements changed. We need document storage.
      Sarah: Fine, but this is a big shift. Marcus owns the migration plan.
      Marcus: Also, the mobile team is blocked on push notifications. We need Firebase.
    `,
        extracted: {
            decisions: [
                { text: "Migrate user data store from PostgreSQL to MongoDB", owner: "Marcus", timestamp: 120 },
                { text: "Adopt Firebase for push notification service", owner: "Marcus", timestamp: 200 },
            ],
            action_items: [
                { text: "Create MongoDB migration plan from PostgreSQL", assignee: "Marcus", due_date: "2025-08-10", timestamp: 150 },
                { text: "Set up Firebase project and integrate with mobile team", assignee: "Marcus", due_date: "2025-08-08", timestamp: 220 },
            ],
            risks: [
                { text: "PostgreSQL to MongoDB migration may cause downtime", severity: "high" },
            ],
            contradictions: [],
        },
    },
    {
        meeting_id: "a1b2c3d4-0003-0003-0003-000000000003",
        department: "engineering",
        transcript: `
      Tom: After the performance issues last sprint, I want to propose we migrate the entire API layer to GraphQL.
      Sarah: Tom, we literally decided to build the auth service on REST three weeks ago.
      Tom: I know, but the data fetching problems are real. GraphQL solves them.
      Sarah: This is a direct contradiction. We need to flag this.
      Tom: For now — decision is to pilot GraphQL on the dashboard service only.
      Sarah: Also — the design team needs a component library. We're going with Radix UI plus Tailwind.
    `,
        extracted: {
            decisions: [
                { text: "Pilot GraphQL on the dashboard service to evaluate migration from REST", owner: "Tom", timestamp: 180 },
                { text: "Adopt Radix UI and Tailwind CSS as the component library standard", owner: "Sarah", timestamp: 280 },
            ],
            action_items: [
                { text: "Set up GraphQL server for dashboard service as pilot", assignee: "Tom", due_date: "2025-08-15", timestamp: 200 },
                { text: "Scaffold component library with Radix UI and Tailwind", assignee: "Sarah", due_date: "2025-08-12", timestamp: 300 },
            ],
            risks: [
                { text: "GraphQL pilot may conflict with existing REST auth service decision", severity: "high" },
            ],
            contradictions: [],
        },
    },
];

async function seed() {
    console.log("🌱 Seeding Meridian RAG with mock meeting data...\n");
    for (const meeting of meetings) {
        try {
            console.log(`📨 Ingesting meeting ${meeting.meeting_id} (${meeting.department})...`);
            const res = await fetch(`${BASE_URL}/api/rag/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(meeting),
            });
            const data = await res.json();
            if (!res.ok) { console.error(`  ❌ Failed: ${data.error}`); continue; }
            const { extracted } = data;
            console.log(`  ✅ Decisions: ${extracted.decisions?.length ?? 0} | Actions: ${extracted.action_items?.length ?? 0} | Contradictions: ${extracted.contradictions?.length ?? 0}`);
            if (extracted.contradictions?.length > 0) {
                extracted.contradictions.forEach((c: any) => console.log(`  ⚠️  CONFLICT: "${c.new_decision}" ↔ "${c.conflicts_with}"`));
            }
        } catch (err: any) {
            console.error(`  ❌ Error: ${err.message}`);
        }
    }
    console.log("\n✅ Seed complete.");
}

seed();
