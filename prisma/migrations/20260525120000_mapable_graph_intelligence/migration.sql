-- MapAble Graph Intelligence Layer

CREATE TABLE IF NOT EXISTS "graph_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "graphType" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "entityId" TEXT,
    "participantId" TEXT,
    "label" TEXT NOT NULL,
    "status" TEXT,
    "dataJson" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "graph_edges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "graphType" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL,
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "participantId" TEXT,
    "confidence" DECIMAL(5,4),
    "weight" DECIMAL(8,4),
    "dataJson" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "graph_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "graph_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "graph_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "graphType" TEXT NOT NULL,
    "participantId" TEXT,
    "eventType" TEXT NOT NULL,
    "relatedNodeId" UUID,
    "relatedEdgeId" UUID,
    "actorType" TEXT,
    "actorId" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "graph_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "graphType" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "graph_nodes_participantId_idx" ON "graph_nodes"("participantId");
CREATE INDEX IF NOT EXISTS "graph_nodes_graphType_idx" ON "graph_nodes"("graphType");
CREATE INDEX IF NOT EXISTS "graph_nodes_nodeType_idx" ON "graph_nodes"("nodeType");
CREATE INDEX IF NOT EXISTS "graph_edges_participantId_idx" ON "graph_edges"("participantId");
CREATE INDEX IF NOT EXISTS "graph_edges_graphType_idx" ON "graph_edges"("graphType");
CREATE INDEX IF NOT EXISTS "graph_edges_edgeType_idx" ON "graph_edges"("edgeType");
CREATE INDEX IF NOT EXISTS "graph_edges_fromNodeId_idx" ON "graph_edges"("fromNodeId");
CREATE INDEX IF NOT EXISTS "graph_edges_toNodeId_idx" ON "graph_edges"("toNodeId");
CREATE INDEX IF NOT EXISTS "graph_events_participantId_idx" ON "graph_events"("participantId");
CREATE INDEX IF NOT EXISTS "graph_events_eventType_idx" ON "graph_events"("eventType");
CREATE INDEX IF NOT EXISTS "graph_snapshots_participantId_idx" ON "graph_snapshots"("participantId");
CREATE INDEX IF NOT EXISTS "graph_snapshots_graphType_idx" ON "graph_snapshots"("graphType");
