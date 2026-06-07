import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { invoicesApi } from '../lib/api';
import { Camera, LogOut } from 'lucide-react-native';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await invoicesApi.getAll();
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.merchant}>{item.merchantName || 'Unknown Merchant'}</Text>
        <Text style={styles.amount}>
          {item.totalAmount?.toLocaleString() ?? '0'}{'  '}
          <Text style={{ fontSize: 12, color: '#a78bfa' }}>{item.currency ?? 'USD'}</Text>
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName}</Text>
          <Text style={styles.subtitle}>Your recent bills</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <LogOut color="#ff4d6d" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6c47ff" style={{ marginTop: 50 }} />
      ) : invoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No invoices yet.</Text>
          <Text style={styles.emptySubtext}>Scan a bill to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Scan')}
      >
        <Camera color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#16162a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: '#8888aa',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#16162a',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  merchant: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: '#8888aa',
    fontSize: 12,
  },
  category: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#6c47ff',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c47ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#8888aa',
    marginTop: 8,
  },
});
