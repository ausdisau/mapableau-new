export class StorageError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.status = status;
  }
}

export class StorageNotEnabledError extends StorageError {
  constructor() {
    super(
      "Object storage is disabled (MAPABLE_OBJECT_STORAGE_ENABLED)",
      "STORAGE_DISABLED",
      404,
    );
    this.name = "StorageNotEnabledError";
  }
}

export class UnsupportedStorageProviderError extends StorageError {
  constructor(provider: string) {
    super(
      `Unsupported object storage provider: ${provider}`,
      "STORAGE_PROVIDER_UNSUPPORTED",
      503,
    );
    this.name = "UnsupportedStorageProviderError";
  }
}

export class StorageConfigurationError extends StorageError {
  constructor(message: string) {
    super(message, "STORAGE_CONFIGURATION", 500);
    this.name = "StorageConfigurationError";
  }
}

export class InvalidObjectKeyError extends StorageError {
  constructor(message = "Invalid object key") {
    super(message, "INVALID_OBJECT_KEY", 400);
    this.name = "InvalidObjectKeyError";
  }
}

export class StoragePolicyError extends StorageError {
  constructor(message: string, code = "STORAGE_POLICY_DENIED") {
    super(message, code, 400);
    this.name = "StoragePolicyError";
  }
}

export class ObjectNotFoundError extends StorageError {
  constructor() {
    super("Object not found", "OBJECT_NOT_FOUND", 404);
    this.name = "ObjectNotFoundError";
  }
}

export class StorageAuthorizationError extends StorageError {
  constructor(message = "Not authorised for this storage action") {
    super(message, "STORAGE_FORBIDDEN", 403);
    this.name = "StorageAuthorizationError";
  }
}

export class StorageReplayError extends StorageError {
  constructor(message = "Upload grant has already been used") {
    super(message, "STORAGE_REPLAY", 409);
    this.name = "StorageReplayError";
  }
}

export class StorageGrantExpiredError extends StorageError {
  constructor() {
    super("Upload grant has expired", "STORAGE_GRANT_EXPIRED", 410);
    this.name = "StorageGrantExpiredError";
  }
}

export class StorageProviderError extends StorageError {
  constructor(message = "Object storage provider error") {
    super(message, "STORAGE_PROVIDER_ERROR", 502);
    this.name = "StorageProviderError";
  }
}

export class MalwareDetectedError extends StorageError {
  constructor() {
    super("File failed malware scanning", "MALWARE_DETECTED", 400);
    this.name = "MalwareDetectedError";
  }
}

export class MalwareScanRequiredError extends StorageError {
  constructor() {
    super(
      "Malware scanning is required but no scanner is configured",
      "MALWARE_SCAN_REQUIRED",
      503,
    );
    this.name = "MalwareScanRequiredError";
  }
}

export function mapStorageError(err: unknown): StorageError {
  if (err instanceof StorageError) return err;
  return new StorageProviderError("Object storage provider error");
}
