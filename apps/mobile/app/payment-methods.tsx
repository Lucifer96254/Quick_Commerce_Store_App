import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Linking } from 'react-native';

export default function PaymentMethodsScreen() {
  const handleOpenWeb = () => {
    Linking.openURL('https://quickmart-web.onrender.com');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="credit-card" size={48} color="#FC8019" />
        </View>
        <Text style={styles.title}>Payment Methods</Text>
        <Text style={styles.subtitle}>
          To manage your payment methods, saved cards, and billing information, please visit our
          web dashboard.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color="#059669" />
            <Text style={styles.featureText}>Add and remove payment methods</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color="#059669" />
            <Text style={styles.featureText}>Save cards for faster checkout</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color="#059669" />
            <Text style={styles.featureText}>View payment history</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color="#059669" />
            <Text style={styles.featureText}>Manage billing addresses</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.webButton} onPress={handleOpenWeb} activeOpacity={0.8}>
          <Feather name="external-link" size={18} color="#fff" />
          <Text style={styles.webButtonText}>Open Web Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC8019',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  webButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
});
