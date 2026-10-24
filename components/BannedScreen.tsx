import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface BannedScreenProps {
  onAppeal?: () => void;
}

export function BannedScreen({ onAppeal }: BannedScreenProps) {
  const appealEmail = 'koalabtcmining@gmail.com';

  const handleAppeal = () => {
    if (onAppeal) {
      onAppeal();
    } else {
      Linking.openURL(`mailto:${appealEmail}?subject=Account%20Appeal%20Request`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={64} color="#FF5722" />
        </View>
        <Text style={styles.title}>Account Deactivated</Text>
        <Text style={styles.body}>
          Your Koala Mining account has been permanently deactivated due to repeated attempts to exploit system mechanics.
        </Text>
        <Text style={styles.body}>
          In accordance with our Terms of Service, your current mining rigs and accrued balance have been frozen.
        </Text>
        <Text style={styles.body}>
          If you believe this enforcement action was taken in error, you may file a formal administrative appeal by reaching out to:
        </Text>
        <TouchableOpacity style={styles.emailButton} onPress={handleAppeal}>
          <Ionicons name="mail" size={20} color="#FFF" />
          <Text style={styles.emailText}>{appealEmail}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5722',
    textAlign: 'center',
    marginBottom: 24,
  },
  body: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  emailText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
