'use client';

import { useState, useEffect } from 'react';
import { X, Home, Briefcase, MapPin, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthStore, useUIStore, useAddressStore } from '@/lib/store';
import { addressesApi, ApiError } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const addressTypes = [
  { value: 'HOME', label: 'Home', icon: Home },
  { value: 'WORK', label: 'Work', icon: Briefcase },
  { value: 'OTHER', label: 'Other', icon: MapPin },
];

export function AddressModal() {
  const { accessToken } = useAuthStore();
  const { addressModalOpen, editingAddressId, closeAddressModal } = useUIStore();
  const { addresses, addAddress, updateAddress } = useAddressStore();
  const queryClient = useQueryClient();

  const editingAddress = editingAddressId
    ? addresses.find((a) => a.id === editingAddressId)
    : null;

  const [formData, setFormData] = useState({
    label: '',
    type: 'HOME',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    landmark: '',
    isDefault: false,
    fullName: '',
    phone: '',
  });

  useEffect(() => {
    if (editingAddress) {
      setFormData({
        label: editingAddress.label || '',
        type: editingAddress.type || 'HOME',
        addressLine1: editingAddress.addressLine1 || '',
        addressLine2: editingAddress.addressLine2 || '',
        city: editingAddress.city || '',
        state: editingAddress.state || '',
        postalCode: editingAddress.postalCode || '',
        landmark: editingAddress.landmark || '',
        isDefault: editingAddress.isDefault || false,
        fullName: editingAddress.fullName || '',
        phone: editingAddress.phone || '',
      });
    } else {
      setFormData({
        label: '',
        type: 'HOME',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        landmark: '',
        isDefault: false,
        fullName: '',
        phone: '',
      });
    }
  }, [editingAddress, addressModalOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => addressesApi.create(accessToken!, data),
    onSuccess: (newAddress) => {
      addAddress(newAddress);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({ title: 'Address added successfully!' });
      closeAddressModal();
    },
    onError: (error: any) => {
      if (error instanceof ApiError) {
        toast({ title: 'Failed to add address', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Failed to add address. Please try again.', variant: 'destructive' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      addressesApi.update(accessToken!, editingAddressId!, data),
    onSuccess: (updatedAddress) => {
      updateAddress(editingAddressId!, updatedAddress);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({ title: 'Address updated successfully!' });
      closeAddressModal();
    },
    onError: (error: any) => {
      if (error instanceof ApiError) {
        toast({ title: 'Failed to update address', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Failed to update address. Please try again.', variant: 'destructive' });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const payload = {
      ...formData,
      country: 'India', // Default
    };

    if (editingAddressId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!addressModalOpen) return null;

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={closeAddressModal}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Address Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address Type
            </label>
            <div className="flex gap-2">
              {addressTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                      formData.type === type.value
                        ? 'border-swiggy-orange bg-swiggy-orange-light text-swiggy-orange'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <TypeIcon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              placeholder="Enter full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              placeholder="10 digit mobile number"
              maxLength={10}
            />
          </div>

          {/* Label */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Label (Optional)
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              placeholder="e.g., Mom's House, Office Building A"
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              placeholder="House/Flat No., Building Name"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              placeholder="Street, Area"
            />
          </div>

          {/* City & State */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
              />
            </div>
          </div>

          {/* Postal Code & Landmark */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Postal Code *
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                placeholder="6 digit PIN"
                maxLength={6}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Landmark</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                placeholder="Near..."
              />
            </div>
          </div>

          {/* Default Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-5 w-5 rounded accent-swiggy-orange"
            />
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-700">Set as default address</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-swiggy-orange hover:bg-swiggy-orange-dark"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingAddressId
                  ? 'Update Address'
                  : 'Add Address'}
            </Button>
            <Button type="button" variant="outline" onClick={closeAddressModal}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
