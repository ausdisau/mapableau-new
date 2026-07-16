import { Worker } from "bullmq";

import { getQueueConnection } from "@/lib/queue/connection";
import { NOTIFY_REVIEW_QUEUE, type NotifyReviewJob } from "@/lib/queue/queues";

export function startNotifyReviewWorker() {
  return new Worker<NotifyReviewJob>(
    NOTIFY_REVIEW_QUEUE,
    async (job) => {
      console.log(
        `[notify-review] task=${job.data.reviewTaskId} category=${job.data.category} title=${job.data.title}`,
      );
      return { notified: true };
    },
    { connection: getQueueConnection() },
  );
}
