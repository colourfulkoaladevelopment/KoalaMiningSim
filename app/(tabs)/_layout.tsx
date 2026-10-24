import React, { useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalModal, LegalFooter, LegalDoc } from '../../components/LegalContent';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#2a2a2a',
            borderTopColor: '#333',
            height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 10,
            // Prevent the tab bar from being covered by or overlapping
            // the physical home indicator / gesture nav bar on edge-to-edge
            // devices. The explicit bottom padding above handles inset-based
            // devices; this flag keeps the bar above system navigation on
            // older Android where insets can report 0.
            position: 'absolute',
            overflow: 'hidden',
          },
          tabBarActiveTintColor: '#FF9800',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
        }}
        screenLayout={({ children }) => (
          <View style={{ flex: 1 }}>
            {children}
            <LegalFooter onOpen={setLegalDoc} />
          </View>
        )}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
            title: 'Store',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="invites"
          options={{
            title: 'Invites',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <LegalModal
        visible={legalDoc !== null}
        doc={legalDoc}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
