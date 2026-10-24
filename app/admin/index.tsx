import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiFetch } from '../../utils/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  balance_sats: number;
  expected_sats: number;
  active_miners: number;
}

interface AdminMetrics {
  total_outstanding_sats: number;
  projected_total_debt_sats: number;
  total_users: number;
  active_miners: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<'name' | 'email'>('name');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editOperation, setEditOperation] = useState<'add' | 'remove' | 'set'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, metricsRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/metrics'),
      ]);

      if (usersRes.ok && usersRes.data.users) {
        setUsers(usersRes.data.users);
      }
      if (metricsRes.ok && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data. You may not have admin access.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortMode === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return (a.email || '').localeCompare(b.email || '');
  });

  const openEditModal = (user: AdminUser) => {
    setEditUser(user);
    setEditAmount('');
    setEditOperation('add');
  };

  const submitBalanceChange = async () => {
    if (!editUser) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/admin/edit-balance/${editUser.id}`, {
        method: 'POST',
        body: JSON.stringify({ operation: editOperation, amount }),
      });
      if (res.ok) {
        Alert.alert('Success', res.data?.message || 'Balance updated.');
        setEditUser(null);
        loadData();
      } else {
        Alert.alert('Error', res.data?.detail || 'Failed to update balance.');
      }
    } catch {
      Alert.alert('Error', 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSats = (sats: number): string => {
    return Math.floor(sats).toLocaleString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading Admin Panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
      >
        {/* Outstanding Liability Macro Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroIcon}>
            <Ionicons name="wallet" size={28} color="#FF5722" />
          </View>
          <View style={styles.macroText}>
            <Text style={styles.macroLabel}>Outstanding Liability</Text>
            <Text style={styles.macroValue}>{formatSats(metrics?.total_outstanding_sats ?? 0)} sats</Text>
            <Text style={styles.macroSubtext}>Total satoshis currently held in user balances</Text>
          </View>
        </View>

        {/* Projected Total Debt Liability Macro Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroIcon}>
            <Ionicons name="trending-up" size={28} color="#FF9800" />
          </View>
          <View style={styles.macroText}>
            <Text style={styles.macroLabel}>Projected Total Debt Liability</Text>
            <Text style={styles.macroValue}>{formatSats(metrics?.projected_total_debt_sats ?? 0)} sats</Text>
            <Text style={styles.macroSubtext}>Current balances + future earnings from all active miners</Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{metrics?.total_users ?? users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{metrics?.active_miners ?? 0}</Text>
            <Text style={styles.statLabel}>Active Miners</Text>
          </View>
        </View>

        {/* Sort Toggle */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'name' && styles.sortButtonActive]}
            onPress={() => setSortMode('name')}
          >
            <Text style={[styles.sortButtonText, sortMode === 'name' && styles.sortButtonTextActive]}>Name</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'email' && styles.sortButtonActive]}
            onPress={() => setSortMode('email')}
          >
            <Text style={[styles.sortButtonText, sortMode === 'email' && styles.sortButtonTextActive]}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* User Ledger */}
        <View style={styles.ledgerCard}>
          <Text style={styles.cardTitle}>User Overview Ledger</Text>
          {sortedUsers.length === 0 ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : (
            sortedUsers.map((user) => (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name || 'Unknown'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.userStats}>
                    <Text style={styles.userStat}>Balance: {formatSats(user.balance_sats ?? 0)} sats</Text>
                    <Text style={styles.userStat}>Expected: {formatSats(user.expected_sats ?? 0)} sats</Text>
                    <Text style={styles.userStat}>Miners: {user.active_miners ?? 0}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(user)}>
                  <Ionicons name="create" size={18} color="#FF9800" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Balance Edit Modal */}
      <Modal visible={editUser !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Balance</Text>
            <Text style={styles.modalSubtitle}>{editUser?.name} ({editUser?.email})</Text>
            <Text style={styles.currentBalance}>Current: {formatSats(editUser?.balance_sats ?? 0)} sats</Text>

            <View style={styles.operationRow}>
              {(['add', 'remove', 'set'] as const).map((op) => (
                <TouchableOpacity
                  key={op}
                  style={[styles.operationButton, editOperation === op && styles.operationButtonActive]}
                  onPress={() => setEditOperation(op)}
                >
                  <Text style={[styles.operationButtonText, editOperation === op && styles.operationButtonTextActive]}>
                    {op === 'add' ? '+ Add' : op === 'remove' ? '- Remove' : 'Set'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (in Satoshis)"
              placeholderTextColor="#666"
              value={editAmount}
              onChangeText={t => setEditAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="number-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditUser(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={submitBalanceChange} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Apply</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  scrollContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { marginRight: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  macroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', margin: 15, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  macroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  macroText: { flex: 1 },
  macroLabel: { fontSize: 14, color: '#AAA', marginBottom: 4 },
  macroValue: { fontSize: 24, fontWeight: 'bold', color: '#FF9800', marginBottom: 4 },
  macroSubtext: { fontSize: 12, color: '#666' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#2a2a2a', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50' },
  statLabel: { fontSize: 12, color: '#AAA', marginTop: 4 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 12 },
  sortLabel: { fontSize: 14, color: '#AAA', marginRight: 10 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#333', marginRight: 8 },
  sortButtonActive: { backgroundColor: '#4CAF50' },
  sortButtonText: { fontSize: 13, color: '#AAA' },
  sortButtonTextActive: { color: '#FFF', fontWeight: 'bold' },
  ledgerCard: { backgroundColor: '#2a2a2a', marginHorizontal: 15, marginBottom: 30, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  emptyText: { fontSize: 14, color: '#AAA', textAlign: 'center', paddingVertical: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#333' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#AAA', marginBottom: 6 },
  userStats: { flexDirection: 'column', gap: 2 },
  userStat: { fontSize: 12, color: '#CCC' },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#FF9800' },
  editButtonText: { color: '#FF9800', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  modalContent: { width: '100%', backgroundColor: '#2a2a2a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#FF9800' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', marginBottom: 8 },
  currentBalance: { fontSize: 14, color: '#FF9800', textAlign: 'center', marginBottom: 16, fontWeight: 'bold' },
  operationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  operationButton: { flex: 1, backgroundColor: '#333', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  operationButtonActive: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
  operationButtonText: { fontSize: 14, color: '#AAA', fontWeight: 'bold' },
  operationButtonTextActive: { color: '#FFF' },
  modalInput: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: '#FFF', marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  modalCancelButton: { flex: 1, backgroundColor: '#333', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginRight: 10 },
  modalCancelText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButton: { flex: 1, backgroundColor: '#FF9800', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginLeft: 10 },
  modalConfirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
