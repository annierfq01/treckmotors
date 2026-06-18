import { apiRequest } from './api';
import type { Order, OrderStatus } from '../types';

export async function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>('/orders');
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  return apiRequest<Order>('/orders', { method: 'POST', body: order });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}/status`, { method: 'PUT', body: { status } });
}

export function subscribeToOrders(onMessage: (data: any) => void): EventSource {
  const eventSource = new EventSource('/api/orders/subscribe');

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onMessage(payload);
    } catch (err) {
      console.error('[SSE] Error parsing message', err);
    }
  };

  eventSource.onerror = () => {
    console.error('[SSE] Connection error');
  };

  return eventSource;
}
