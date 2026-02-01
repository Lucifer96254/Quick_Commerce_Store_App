'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { productsApi, categoriesApi, ApiError } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    categoryId: '',
    unit: 'piece',
    unitValue: '1',
    stockQuantity: '0',
    lowStockThreshold: '10',
    isAvailable: true,
    isFeatured: false,
    tags: '',
  });

  const [images, setImages] = useState<Array<{ url: string; altText: string }>>([]);

  useEffect(() => {
    categoriesApi.list(true).then(setCategories).catch(console.error);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoading(true);
    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : undefined,
        categoryId: formData.categoryId,
        unit: formData.unit,
        unitValue: parseFloat(formData.unitValue),
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        images: images.filter((img) => img.url),
      };

      await productsApi.create(accessToken, productData);
      showToast('success', 'Product created successfully!');
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (error) {
      console.error('Failed to create product:', error);
      if (error instanceof ApiError) {
        showToast('error', error.message);
      } else {
        showToast('error', 'Failed to create product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    setImages([...images, { url: '', altText: '' }]);
  };

  const updateImage = (index: number, field: 'url' | 'altText', value: string) => {
    setImages(images.map((img, i) => (i === index ? { ...img, [field]: value } : img)));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Create a new product in your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Basic Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                    placeholder="e.g., PROD-001"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Discounted Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                    placeholder="Leave empty if no discount"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="l">Liter</option>
                    <option value="ml">Milliliter</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Unit Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Inventory</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Images</h2>
                <Button type="button" variant="outline" size="sm" onClick={addImage}>
                  <Plus className="mr-1 h-4 w-4" /> Add Image
                </Button>
              </div>
              {images.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No images added yet</p>
              ) : (
                <div className="space-y-3">
                  {images.map((image, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={image.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                          placeholder="Image URL"
                        />
                        <input
                          type="text"
                          value={image.altText}
                          onChange={(e) => updateImage(index, 'altText', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                          placeholder="Alt text (optional)"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Status</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-5 w-5 rounded"
                  />
                  <span className="text-gray-700">Available for sale</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="h-5 w-5 rounded"
                  />
                  <span className="text-gray-700">Featured product</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Tags</h2>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                placeholder="organic, fresh, local"
              />
              <p className="mt-2 text-xs text-gray-500">Separate tags with commas</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
            <Link href="/admin/products" className="block">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
