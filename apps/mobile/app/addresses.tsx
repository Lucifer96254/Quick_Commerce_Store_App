import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi } from '@/lib/api';

export default function AddressesScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
  });

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const createMutation = useMutation({
    mutationFn: () => addressesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      });
      setShowForm(false);
      Alert.alert('Success', 'Address added successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Failed', err?.message || 'Please check your details.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: any) => {
      Alert.alert('Failed', err?.message || 'Please try again.');
    },
  });

  const handleSubmit = () => {
    if (
      !form.fullName ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.postalCode
    ) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load addresses.</Text>
      </View>
    );
  }

  const addresses = (data as any)?.items || (data as any[]) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Saved addresses */}
      {addresses.length === 0 && !showForm ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="map-pin" size={32} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>No addresses saved</Text>
          <Text style={styles.emptySubtitle}>Add an address for quick checkout</Text>
        </View>
      ) : (
        addresses.map((item: any) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressIconContainer}>
                <Feather name="map-pin" size={16} color="#FC8019" />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.addressLabelRow}>
                  <Text style={styles.addressName}>{item.label || item.fullName}</Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>
                  {item.fullAddress || `${item.addressLine1}, ${item.city}`}
                </Text>
                <Text style={styles.addressMeta}>
                  {item.city}, {item.state} {item.postalCode}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert('Delete address', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(item.id),
                  },
                ])
              }
            >
              <Feather name="trash-2" size={14} color="#ef4444" />
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add Address Button / Form */}
      {!showForm ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color="#FC8019" />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New Address</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Feather name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full name *"
            placeholderTextColor="#9ca3af"
            value={form.fullName}
            onChangeText={(text) => setForm((f) => ({ ...f, fullName: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number *"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm((f) => ({ ...f, phone: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address line 1 *"
            placeholderTextColor="#9ca3af"
            value={form.addressLine1}
            onChangeText={(text) => setForm((f) => ({ ...f, addressLine1: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address line 2 (optional)"
            placeholderTextColor="#9ca3af"
            value={form.addressLine2}
            onChangeText={(text) => setForm((f) => ({ ...f, addressLine2: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Landmark (optional)"
            placeholderTextColor="#9ca3af"
            value={form.landmark}
            onChangeText={(text) => setForm((f) => ({ ...f, landmark: text }))}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="City *"
              placeholderTextColor="#9ca3af"
              value={form.city}
              onChangeText={(text) => setForm((f) => ({ ...f, city: text }))}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="State *"
              placeholderTextColor="#9ca3af"
              value={form.state}
              onChangeText={(text) => setForm((f) => ({ ...f, state: text }))}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Postal code *"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={form.postalCode}
            onChangeText={(text) => setForm((f) => ({ ...f, postalCode: text }))}
          />

          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.8}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  defaultBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
    lineHeight: 18,
  },
  addressMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deleteText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FC8019',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 15,
    color: '#FC8019',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  submitButton: {
    backgroundColor: '#FC8019',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
