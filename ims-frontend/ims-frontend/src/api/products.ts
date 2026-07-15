import { api, unwrap } from '@/lib/api';
import type { Product, Category, Brand, Unit, Paginated } from '@/types';

export const productApi = {
  list: (params: { page?: number; limit?: number; search?: string; categoryId?: string; lowStockOnly?: boolean }) =>
    unwrap<Paginated<Product>>(api.get('/products', { params })),

  get: (id: string) => unwrap<Product>(api.get(`/products/${id}`)),

  create: (data: Partial<Product> & { openingStock?: number }) => unwrap<Product>(api.post('/products', data)),

  update: (id: string, data: Partial<Product>) => unwrap<Product>(api.patch(`/products/${id}`, data)),

  deactivate: (id: string) => api.delete(`/products/${id}`),

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return unwrap<Product>(
      api.post(`/products/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
  },
};

export const categoryApi = {
  list: () => unwrap<Category[]>(api.get('/categories')),
  create: (data: { name: string; parentId?: string }) => unwrap<Category>(api.post('/categories', data)),
};

export const brandApi = {
  list: () => unwrap<Brand[]>(api.get('/brands')),
  create: (data: { name: string }) => unwrap<Brand>(api.post('/brands', data)),
};

export const unitApi = {
  list: () => unwrap<Unit[]>(api.get('/units')),
  create: (data: { name: string; shortCode: string }) => unwrap<Unit>(api.post('/units', data)),
};
