'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, GripVertical, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { categoriesApi, ApiError } from '@/lib/api';

export default function AdminCategoriesPage() {
  const { accessToken } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    categoriesApi
      .list(true)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(accessToken!, editingCategory.id, formData);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...formData } : c))
        );
        showToast('success', 'Category updated successfully!');
      } else {
        const newCategory = await categoriesApi.create(accessToken!, formData);
        setCategories((prev) => [...prev, newCategory]);
        showToast('success', 'Category created successfully!');
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', image: '' });
    } catch (error) {
      console.error('Failed to save category:', error);
      if (error instanceof ApiError) {
        showToast('error', error.message);
      } else {
        showToast('error', 'Failed to save category. Please try again.');
      }
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesApi.delete(accessToken!, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('success', 'Category deleted successfully!');
    } catch (error) {
      console.error('Failed to delete category:', error);
      if (error instanceof ApiError) {
        showToast('error', error.message);
      } else {
        showToast('error', 'Failed to delete category. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', image: '' });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full rounded-xl bg-white py-12 text-center text-gray-500">
            No categories yet. Create your first category!
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="group rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🏷️</div>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{category.description}</p>
              )}
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">{category.productCount || 0} products</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
