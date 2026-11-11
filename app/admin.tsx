import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiFetch } from '../utils/api';

type TimeRange = '30_days' | 'all_time';
type BalanceOperation = 'add' | 'remove' | 'set';

interface AdminStats {
  total_users: number;
  active_miners: number;
  total_miner_revenue: number;
  total_btc_owed: number;
  time_range: TimeRange;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  active_miners: number;
  btc_wallet_address: string;
  wallet_status: string;
  created_at: string;
}

interface PendingWallet {
  user_id: string;
  name: string;
  email: string;
  btc_wallet_address: string;
  balance: number;
}

interface PendingAddressChange {
  user_id: string;
  name: string;
  email: string;
  current_address: string;
  new_address: string;
  balance: number;
}

const formatBTC = (value: number): string => `₿ ${Number(value || 0).toFixed(12)}`;

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
};

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingWallets, setPendingWallets] = useState<PendingWallet[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingAddressChange[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30_days');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [operation, setOperation] = useState<BalanceOperation>('add');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) setIsRefreshing(true);
    setError('');

    try {
      const access = await apiFetch('/api/admin/check');
      if (!access.ok) {
        setIsAdmin(false);
        setError(getErrorMessage(access.data, 'Administrator access is required.'));
        return;
      }

      setIsAdmin(true);
      const [statsResponse, usersResponse, walletsResponse, changesResponse] = await Promise.all([
        apiFetch<AdminStats>(`/api/admin/stats?time_range=${timeRange}`),
        apiFetch<{ users?: AdminUser[] }>('/api/admin/users'),
        apiFetch<{ pending_wallets?: PendingWallet[] }>('/api/admin/pending-wallets'),
        apiFetch<{ pending_changes?: PendingAddressChange[] }>('/api/admin/pending-address-changes'),
      ]);

      if (!statsResponse.ok || !usersResponse.ok || !walletsResponse.ok || !changesResponse.ok) {
        setError('Some admin information could not be loaded. Pull down to try again.');
        return;
      }

      setStats(statsResponse.data);
      setUsers(Array.isArray(usersResponse.data?.users) ? usersResponse.data.users : []);
      setPendingWallets(Array.isArray(walletsResponse.data?.pending_wallets) ? walletsResponse.data.pending_wallets : []);
      setPendingChanges(Array.isArray(changesResponse.data?.pending_changes) ? changesResponse.data.pending_changes : []);
    } catch {
      setError('The admin dashboard could not connect to the service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;
    return users.filter((user: AdminUser) =>
      `${user.name} ${user.email}`.toLowerCase().includes(normalizedSearch)
    );
  }, [search, users]);

  const runAdminAction = async (
    path: string,
    options: RequestInit,
    successMessage: string,
  ): Promise<void> => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(path, options);
      if (!response.ok) {
        setError(getErrorMessage(response.data, 'The action could not be completed.'));
        return;
      }
      setNotice(successMessage);
      await loadData(true);
    } catch {
      setError('The action could not be completed.');
    } finally {
      setIsSaving(false);
    }
  };

  const adjustBalance = async (): Promise<void> => {
    if (!selectedUser) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || (operation !== 'set' && parsedAmount === 0)) {
      setError(operation === 'set' ? 'Enter a balance of zero or more.' : 'Enter an amount greater than zero.');
      return;
    }

    await runAdminAction(
      `/api/admin/give-btc/${selectedUser.id}`,
      {
        method: 'POST',
        body: JSON.stringify({ operation, amount: parsedAmount }),
      },
      `Balance updated for ${selectedUser.email}.`,
    );
    setAmount('');
    setSelectedUser(null);
  };

  const renderMetric = (label: string, value: string, icon: keyof typeof Ionicons.glyphMap, accent: string): React.ReactNode => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFB000" />
          <Text style={styles.loadingText}>Loading admin console</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAdmin === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={32} color="#FFB000" />
          </View>
          <Text style={styles.emptyTitle}>Administrator access only</Text>
          <Text style={styles.emptyText}>{error || 'This area is restricted to authorized administrators.'}</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Return to app</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadData(true)} tintColor="#FFB000" />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>KOALA MINING</Text>
            <Text style={styles.title}>Admin console</Text>
            <Text style={styles.subtitle}>Monitor the platform and review account activity.</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#D9E1E8" />
          </Pressable>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeBanner}>{notice}</Text> : null}

        <View style={styles.rangeRow}>
          <Text style={styles.sectionTitle}>Platform overview</Text>
          <View style={styles.rangeSwitch}>
            {(['30_days', 'all_time'] as TimeRange[]).map((range: TimeRange) => (
              <Pressable
                key={range}
                style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>
                  {range === '30_days' ? '30 days' : 'All time'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {renderMetric('Total users', String(stats?.total_users ?? 0), 'people', '#FFB000')}
          {renderMetric('Active miners', String(stats?.active_miners ?? 0), 'flash', '#45C486')}
          {renderMetric('Miner revenue', `$${Number(stats?.total_miner_revenue ?? 0).toFixed(2)}`, 'card', '#61A8FF')}
          {renderMetric('BTC owed', formatBTC(stats?.total_btc_owed ?? 0), 'wallet', '#F28C8C')}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Review queue</Text>
          <Text style={styles.sectionCount}>{pendingWallets.length + pendingChanges.length} waiting</Text>
        </View>
        <View style={styles.queueCard}>
          {pendingWallets.length === 0 && pendingChanges.length === 0 ? (
            <Text style={styles.mutedText}>No wallet reviews are waiting.</Text>
          ) : (
            <>
              {pendingWallets.map((wallet: PendingWallet) => (
                <View style={styles.queueRow} key={`wallet-${wallet.user_id}`}>
                  <View style={styles.queueIcon}><Ionicons name="wallet-outline" size={18} color="#FFB000" /></View>
                  <View style={styles.queueBody}>
                    <Text style={styles.rowTitle}>{wallet.name || wallet.email}</Text>
                    <Text style={styles.rowMeta}>New wallet approval · {wallet.btc_wallet_address}</Text>
                  </View>
                  <Pressable
                    style={styles.smallButton}
                    disabled={isSaving}
                    onPress={() => void runAdminAction(`/api/admin/approve-wallet/${wallet.user_id}`, { method: 'POST' }, `Wallet approved for ${wallet.email}.`)}
                  >
                    <Text style={styles.smallButtonText}>Approve</Text>
                  </Pressable>
                </View>
              ))}
              {pendingChanges.map((change: PendingAddressChange) => (
                <View style={styles.queueRow} key={`change-${change.user_id}`}>
                  <View style={styles.queueIcon}><Ionicons name="swap-horizontal" size={18} color="#61A8FF" /></View>
                  <View style={styles.queueBody}>
                    <Text style={styles.rowTitle}>{change.name || change.email}</Text>
                    <Text style={styles.rowMeta}>Address change · {change.new_address}</Text>
                  </View>
                  <View style={styles.queueActions}>
                    <Pressable
                      style={styles.smallButton}
                      disabled={isSaving}
                      onPress={() => void runAdminAction(`/api/admin/approve-address-change/${change.user_id}`, { method: 'POST' }, `Address change approved for ${change.email}.`)}
                    >
                      <Text style={styles.smallButtonText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={styles.rejectButton}
                      disabled={isSaving}
                      onPress={() => void runAdminAction(`/api/admin/reject-address-change/${change.user_id}`, { method: 'POST', body: JSON.stringify({ reason: 'Rejected by administrator.' }) }, `Address change rejected for ${change.email}.`)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>User ledger</Text>
          <Text style={styles.sectionCount}>{filteredUsers.length} accounts</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#71808C"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />

        {selectedUser ? (
          <View style={styles.editorCard}>
            <View style={styles.editorHeader}>
              <View>
                <Text style={styles.editorTitle}>Adjust balance</Text>
                <Text style={styles.editorSubtitle}>{selectedUser.email}</Text>
              </View>
              <Pressable onPress={() => setSelectedUser(null)}><Ionicons name="close-circle" size={22} color="#71808C" /></Pressable>
            </View>
            <View style={styles.operationRow}>
              {(['add', 'remove', 'set'] as BalanceOperation[]).map((item: BalanceOperation) => (
                <Pressable key={item} style={[styles.operationButton, operation === item && styles.operationButtonActive]} onPress={() => setOperation(item)}>
                  <Text style={[styles.operationText, operation === item && styles.operationTextActive]}>
                    {item === 'add' ? 'Add' : item === 'remove' ? 'Remove' : 'Set'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="BTC amount"
              placeholderTextColor="#71808C"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Pressable style={[styles.primaryButton, isSaving && styles.disabledButton]} disabled={isSaving} onPress={() => void adjustBalance()}>
              {isSaving ? <ActivityIndicator color="#071014" /> : <Text style={styles.primaryButtonText}>Save balance</Text>}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.userList}>
          {filteredUsers.length === 0 ? <Text style={styles.mutedText}>No accounts match this search.</Text> : null}
          {filteredUsers.map((user: AdminUser) => (
            <Pressable key={user.id} style={styles.userRow} onPress={() => setSelectedUser(user)}>
              <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{(user.name || user.email || '?').charAt(0).toUpperCase()}</Text></View>
              <View style={styles.userBody}>
                <Text style={styles.rowTitle}>{user.name || 'Unnamed account'}</Text>
                <Text style={styles.rowMeta}>{user.email}</Text>
                <Text style={styles.rowMeta}>{user.active_miners} active miners · {user.wallet_status || 'No wallet'}</Text>
              </View>
              <View style={styles.userBalance}>
                <Text style={styles.balanceText}>{formatBTC(user.balance)}</Text>
                <Text style={styles.editHint}>Edit</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071014' },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#AAB7C2', marginTop: 12, fontSize: 15 },
  lockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#17242B', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { color: '#F4F7F8', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: '#AAB7C2', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10, maxWidth: 340 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  eyebrow: { color: '#FFB000', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: '#F4F7F8', fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 5 },
  subtitle: { color: '#8EA0AC', fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 290 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#17242B', alignItems: 'center', justifyContent: 'center' },
  errorBanner: { color: '#FFB4B4', backgroundColor: '#3A2025', borderRadius: 10, padding: 12, marginBottom: 14, lineHeight: 20 },
  noticeBanner: { color: '#B9F0D3', backgroundColor: '#17382A', borderRadius: 10, padding: 12, marginBottom: 14, lineHeight: 20 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#F4F7F8', fontSize: 18, fontWeight: '700' },
  sectionCount: { color: '#8EA0AC', fontSize: 13 },
  rangeSwitch: { flexDirection: 'row', backgroundColor: '#17242B', borderRadius: 8, padding: 3 },
  rangeButton: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6 },
  rangeButtonActive: { backgroundColor: '#FFB000' },
  rangeText: { color: '#9AAAB4', fontSize: 12, fontWeight: '600' },
  rangeTextActive: { color: '#071014' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', minHeight: 122, backgroundColor: '#102027', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C333D' },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricLabel: { color: '#8EA0AC', fontSize: 12 },
  metricValue: { color: '#F4F7F8', fontSize: 17, fontWeight: '700', marginTop: 4 },
  queueCard: { backgroundColor: '#102027', borderRadius: 14, borderWidth: 1, borderColor: '#1C333D', paddingHorizontal: 14 },
  queueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1C333D', gap: 10 },
  queueIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#172D36', alignItems: 'center', justifyContent: 'center' },
  queueBody: { flex: 1, minWidth: 0 },
  queueActions: { gap: 6 },
  rowTitle: { color: '#F4F7F8', fontSize: 14, fontWeight: '700' },
  rowMeta: { color: '#8EA0AC', fontSize: 12, lineHeight: 18, marginTop: 2 },
  smallButton: { backgroundColor: '#FFB000', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7 },
  smallButtonText: { color: '#071014', fontSize: 12, fontWeight: '700' },
  rejectButton: { backgroundColor: '#3A2025', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7 },
  rejectButtonText: { color: '#FFB4B4', fontSize: 12, fontWeight: '700' },
  mutedText: { color: '#8EA0AC', fontSize: 14, paddingVertical: 18 },
  searchInput: { height: 48, backgroundColor: '#102027', borderRadius: 10, borderWidth: 1, borderColor: '#1C333D', paddingHorizontal: 14, color: '#F4F7F8', fontSize: 14 },
  editorCard: { backgroundColor: '#172D36', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#FFB000' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  editorTitle: { color: '#F4F7F8', fontSize: 16, fontWeight: '700' },
  editorSubtitle: { color: '#8EA0AC', fontSize: 12, marginTop: 3 },
  operationRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  operationButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#102027' },
  operationButtonActive: { backgroundColor: '#FFB000' },
  operationText: { color: '#9AAAB4', fontSize: 13, fontWeight: '700' },
  operationTextActive: { color: '#071014' },
  amountInput: { height: 46, backgroundColor: '#071014', borderRadius: 8, paddingHorizontal: 12, color: '#F4F7F8', marginTop: 10, borderWidth: 1, borderColor: '#284652' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, backgroundColor: '#FFB000', borderRadius: 8, marginTop: 10 },
  primaryButtonText: { color: '#071014', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  userList: { backgroundColor: '#102027', borderRadius: 14, borderWidth: 1, borderColor: '#1C333D', marginTop: 12, overflow: 'hidden' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1C333D', gap: 10 },
  userAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#26424D', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#FFB000', fontSize: 16, fontWeight: '700' },
  userBody: { flex: 1, minWidth: 0 },
  userBalance: { alignItems: 'flex-end' },
  balanceText: { color: '#F4F7F8', fontSize: 12, fontWeight: '700' },
  editHint: { color: '#FFB000', fontSize: 11, marginTop: 4 },
  secondaryButton: { backgroundColor: '#17242B', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13, marginTop: 24 },
  secondaryButtonText: { color: '#F4F7F8', fontSize: 14, fontWeight: '700' },
});
