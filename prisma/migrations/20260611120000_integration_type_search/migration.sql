-- Add search integration type for OpenSearch and similar backends
ALTER TYPE "IntegrationType" ADD VALUE IF NOT EXISTS 'search';
