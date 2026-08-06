import { EvaluationReceiptSchema, type EvaluationReceipt } from "../contracts/evaluationReceipt";

export function buildExplanation(receipt: EvaluationReceipt) {
  // Plain-language summary and full evidence trace
  const plain = receipt.conclusions.map(c => {
    const label = c.label;
    const auth = c.authority;
    const score = c.score ? ` (score ${c.score.toFixed(2)})` : '';
    const review = c.requiresHumanReview ? ' — requires human review' : '';
    return `${label}${score}: ${auth}${review}`;
  }).join('\n');

  const full = JSON.stringify(receipt, null, 2);
  return { plain, full };
}

export default buildExplanation;