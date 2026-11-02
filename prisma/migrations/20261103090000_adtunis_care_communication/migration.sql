-- Adtunis Care communication: consent scopes + participant workspace JSON store.

ALTER TYPE "ConsentScope" ADD VALUE 'adtunis_transcription';
ALTER TYPE "ConsentScope" ADD VALUE 'adtunis_personalisation';
ALTER TYPE "ConsentScope" ADD VALUE 'adtunis_research';
ALTER TYPE "ConsentScope" ADD VALUE 'adtunis_audio_retain';

CREATE TABLE "adtunis_participant_workspaces" (
    "participantId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adtunis_participant_workspaces_pkey" PRIMARY KEY ("participantId")
);

ALTER TABLE "adtunis_participant_workspaces"
  ADD CONSTRAINT "adtunis_participant_workspaces_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
