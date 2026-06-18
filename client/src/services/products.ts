import { apiRequest } from './api';
import type { Product } from '../types';

export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products');
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  return apiRequest<Product>('/products', { method: 'POST', body: product });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, { method: 'PUT', body: product });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; id: string }> {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}
