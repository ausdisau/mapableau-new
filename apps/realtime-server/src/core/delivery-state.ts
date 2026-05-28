export type DeliveryRecord = {
  messageId: string;
  room: string;
  senderId: string;
  createdAt: string;
  acks: Map<string, string>;
};

export class DeliveryState {
  private readonly records = new Map<string, DeliveryRecord>();

  register(messageId: string, room: string, senderId: string): DeliveryRecord {
    const record: DeliveryRecord = {
      messageId,
      room,
      senderId,
      createdAt: new Date().toISOString(),
      acks: new Map(),
    };
    this.records.set(messageId, record);
    return record;
  }

  get(messageId: string): DeliveryRecord | undefined {
    return this.records.get(messageId);
  }

  ack(messageId: string, userId: string): { record: DeliveryRecord; alreadyAcked: boolean } {
    const record = this.records.get(messageId);
    if (!record) {
      throw new Error("Message not found");
    }
    if (record.acks.has(userId)) {
      return { record, alreadyAcked: true };
    }
    const timestamp = new Date().toISOString();
    record.acks.set(userId, timestamp);
    return { record, alreadyAcked: false };
  }

  clear(): void {
    this.records.clear();
  }
}
