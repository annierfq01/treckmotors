import { apiRequest } from './api';
import type { ProductReview } from '../types';

export async function getReviews(): Promise<ProductReview[]> {
  return apiRequest<ProductReview[]>('/reviews');
}

export async function createReview(review: Partial<ProductReview>): Promise<ProductReview> {
  return apiRequest<ProductReview>('/reviews', { method: 'POST', body: review });
}
