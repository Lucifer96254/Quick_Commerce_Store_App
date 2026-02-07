import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function HelpScreen() {
  const handleOpenWeb = () => {
    Linking.openURL('https://quickmart-web.onrender.com');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@quickmart.com?subject=Support Request');
  };

  const helpTopics = [
    {
      icon: 'package',
      title: 'Order Issues',
      description: 'Track orders, cancellations, and refunds',
    },
    {
      icon: 'credit-card',
      title: 'Payment & Billing',
      description: 'Payment methods, invoices, and billing questions',
    },
    {
      icon: 'truck',
      title: 'Delivery',
      description: 'Delivery times, addresses, and delivery issues',
    },
    {
      icon: 'user',
      title: 'Account',
      description: 'Profile settings, password, and account management',
    },
    {
      icon: 'shopping-cart',
      title: 'Products & Cart',
      description: 'Product information, cart, and availability',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="help-circle" size={48} color="#FC8019" />
        </View>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          Need help? We're here for you. Contact our support team or visit the web dashboard for
          detailed assistance.
        </Text>

        <View style={styles.topicsContainer}>
          {helpTopics.map((topic, index) => (
            <View key={index} style={styles.topicCard}>
              <View style={styles.topicIconContainer}>
                <Feather name={topic.icon as any} size={24} color="#FC8019" />
              </View>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleEmailSupport}
            activeOpacity={0.8}
          >
            <Feather name="mail" size={18} color="#FC8019" />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.webButton]}
            onPress={handleOpenWeb}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={18} color="#fff" />
            <Text style={[styles.contactButtonText, styles.webButtonText]}>
              Open Web Dashboard
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
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
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
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
  topicsContainer: {
    marginBottom: 32,
  },
  topicCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FC8019',
    marginBottom: 12,
    gap: 8,
  },
  webButton: {
    backgroundColor: '#FC8019',
    borderColor: '#FC8019',
  },
  contactButtonText: {
    color: '#FC8019',
    fontWeight: '700',
    fontSize: 15,
  },
  webButtonText: {
    color: '#fff',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
});
