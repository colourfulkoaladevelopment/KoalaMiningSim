import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type LegalDoc = 'privacy' | 'tos' | null;

const PRIVACY_POLICY = `PRIVACY POLICY

Last updated: October 24, 2026

This Privacy Policy describes how Koala Mining ("we", "us", or "our") collects, uses, and protects your information when you use our mobile application (the "Service"). By using the Service, you agree to the practices described in this policy.

1. AGE REQUIREMENT
You must be at least 18 years old to use this Service. By registering an account, you confirm that you are 18 years of age or older. We do not knowingly collect information from anyone under 18. If we learn that a minor has registered, we will delete the account immediately.

2. INFORMATION WE COLLECT
- Account Information: Your name, email address, and password (hashed).
- Device Information: Device type, operating system, app version, and push notification token.
- Transaction Information: Purchase history, payment method (PayPal), and withdrawal requests.
- Mining Activity: Miner configurations, hash rates, earnings, and balance data.
- Wallet Information: Bitcoin withdrawal addresses submitted for administrative review.

3. HOW WE USE YOUR INFORMATION
- To operate and maintain the mining simulation Service.
- To process purchases via PayPal and manage miner activations.
- To review and process Bitcoin withdrawal requests through our administrative pipeline.
- To send push notifications about miner expirations and account updates.
- To detect and prevent fraud, abuse, and unauthorized access.

4. VIRTUAL EARNINGS DISCLAIMER
All mining earnings displayed in the Service are virtual and represent simulated mining activity. Bitcoin withdrawal requests are processed through an administrative review pipeline and are subject to verification, terms of service compliance, and available funds. We do not guarantee any specific withdrawal amount or timeline. The Service is a premium mining simulation, not a guarantee of financial return.

5. DATA SECURITY
We implement industry-standard security measures including JWT-based authentication, encrypted password hashing, and secure server-side data storage. Payment processing is handled by PayPal's secure infrastructure. We never store your PayPal credentials.

6. DATA RETENTION
We retain your account and transaction data for as long as your account is active. You may request deletion of your account at any time by contacting us.

7. THIRD-PARTY SERVICES
The Service integrates with PayPal for payments, AdMob for advertisements, and CoinGecko for price data. Each third party has its own privacy policy governing your data.

8. YOUR RIGHTS
You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at colourfulkoaladevelopment@gmail.com.

9. CONTACT US
For any privacy-related questions or requests, email us at colourfulkoaladevelopment@gmail.com.`;

const TERMS_OF_SERVICE = `TERMS OF SERVICE

Last updated: October 24, 2026

Welcome to Koala Mining. By creating an account or using our Service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

1. ELIGIBILITY
You must be at least 18 years old to use this Service. By registering, you represent and warrant that you are 18 or older. Use by anyone under 18 is strictly prohibited.

2. SERVICE DESCRIPTION
Koala Mining is a premium Bitcoin mining simulation application. Users can activate virtual miners, earn simulated Satoshi rewards, rent premium mining hardware, and request Bitcoin withdrawals through an administrative review pipeline.

3. VIRTUAL EARNINGS
All earnings generated within the Service are virtual and represent simulated mining output. Satoshi balances displayed in the app do not constitute a financial obligation until a withdrawal request is approved through our administrative review process. We reserve the right to approve, delay, or deny any withdrawal request at our discretion.

4. WITHDRAWAL PROCESS
- Withdrawal requests require a minimum of 1,000 Satoshis.
- A 1% service fee and a flat network fee are deducted from each withdrawal.
- All withdrawal requests are subject to administrative review and verification.
- Processing times vary and are not guaranteed.
- You must provide a valid Bitcoin wallet address approved by our team.

5. PURCHASES AND PAYMENTS
- Premium miners are purchased via PayPal at the prices displayed in the Store.
- All purchases are final and non-refundable unless required by law.
- Purchased miners are activated immediately upon successful payment capture.

6. PROHIBITED CONDUCT
You agree not to:
- Use bots, scripts, or automated tools to manipulate the Service.
- Spam or abuse the ad reward system.
- Attempt to reverse-engineer, decompile, or hack the application.
- Create multiple accounts to exploit referral bonuses.
- Transfer or sell your account to another person.

7. ADVERTISEMENTS
The Service displays advertisements through Google AdMob. Watching rewarded ads grants temporary mining boosts. Ad availability is limited daily. Abuse of the ad system, including rapid repeated taps or automated viewing, will result in account suspension.

8. INTELLECTUAL PROPERTY
All content, branding, and software within Koala Mining are the property of Koala Mining. You may not copy, modify, or distribute our content without permission.

9. LIMITATION OF LIABILITY
Koala Mining is provided "as is" without warranties of any kind. We are not liable for any losses, including but not limited to virtual earnings, purchase costs, or withdrawal delays. The Service is a simulation and does not constitute financial advice or a financial product.

10. ACCOUNT TERMINATION
We reserve the right to suspend or terminate any account that violates these Terms or engages in fraudulent activity. Upon termination, access to purchased miners and virtual balances may be revoked.

11. CHANGES TO TERMS
We may update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the updated Terms.

12. CONTACT
For questions about these Terms, contact us at colourfulkoaladevelopment@gmail.com.`;

interface LegalModalProps {
  visible: boolean;
  doc: LegalDoc;
  onClose: () => void;
}

export function LegalModal({ visible, doc, onClose }: LegalModalProps) {
  const content = doc === 'privacy' ? PRIVACY_POLICY : doc === 'tos' ? TERMS_OF_SERVICE : '';
  const title = doc === 'privacy' ? 'Privacy Policy' : doc === 'tos' ? 'Terms of Service' : '';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollBody}>
            <Text style={styles.bodyText}>{content}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface LegalFooterProps {
  onOpen: (doc: LegalDoc) => void;
}

export function LegalFooter({ onOpen }: LegalFooterProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => onOpen('privacy')}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>|</Text>
        <TouchableOpacity onPress={() => onOpen('tos')}>
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footerVersion}>Koala Mining - Production v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  footerLink: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  footerDivider: {
    fontSize: 13,
    color: '#555',
    marginHorizontal: 10,
  },
  footerVersion: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  scrollBody: {
    padding: 20,
  },
  bodyText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  },
});
