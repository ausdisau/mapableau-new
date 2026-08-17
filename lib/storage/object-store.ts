import type {
  GetObjectInput,
  ObjectKeyInput,
  ObjectMetadata,
  PutObjectInput,
  RemoveObjectInput,
  SignedObjectUrl,
  SignedReadInput,
  SignedUploadGrant,
  SignedUploadInput,
  StoredObject,
  StoredObjectStream,
} from "./types";

/**
 * Provider-neutral object store. Domain code must depend on this interface
 * only — never on a vendor SDK.
 *
 * Canonical object identity is provider + bucket + key. URLs are temporary
 * delivery mechanisms, never identifiers.
 */
export interface ObjectStore {
  readonly provider: string;

  put(input: PutObjectInput): Promise<StoredObject>;
  get(input: GetObjectInput): Promise<StoredObjectStream>;
  remove(input: RemoveObjectInput): Promise<void>;
  exists(input: ObjectKeyInput): Promise<boolean>;
  createSignedReadUrl(input: SignedReadInput): Promise<SignedObjectUrl>;
  createSignedUpload(input: SignedUploadInput): Promise<SignedUploadGrant>;
  getMetadata(input: ObjectKeyInput): Promise<ObjectMetadata | null>;
}
