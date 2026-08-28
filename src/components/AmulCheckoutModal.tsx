import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import {
  ShieldCheck,
  X,
  ExternalLink,
  Lock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { useSessionStore } from '../store/useSessionStore';
import { AmulApiClient } from '../services/amulApi';

interface AmulCheckoutModalProps {
  visible: boolean;
  product: AmulProduct | null;
  onClose: () => void;
}

const CHECKOUT_URL = 'https://shop.amul.com/en/checkout';

export const AmulCheckoutModal: React.FC<AmulCheckoutModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { session, loadUserData } = useSessionStore();
  const [isPreReserving, setIsPreReserving] = useState(true);
  const [reservationMessage, setReservationMessage] = useState('Reserving item on Amul Cloud...');
  const [webViewKey, setWebViewKey] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function preReserveItem() {
      if (visible && product) {
        setIsPreReserving(true);
        setReservationMessage(`Adding ${product.title} to Amul cart...`);

        try {
          const sku = product.variants?.[0]?.sku || product.id;
          await AmulApiClient.instantAddToCart(
            product.id,
            sku,
            1,
            session.sessionCookie
          );

          if (isMounted) {
            setReservationMessage('Redirecting to Official Amul Checkout...');
            setTimeout(() => {
              if (isMounted) setIsPreReserving(false);
            }, 500);
          }
        } catch (e) {
          console.warn('Pre-reserve note:', e);
          if (isMounted) setIsPreReserving(false);
        }
      }
    }

    preReserveItem();

    return () => {
      isMounted = false;
    };
  }, [visible, product, session.sessionCookie]);

  const handleClose = async () => {
    onClose();
    // Refresh user's orders and cart after returning from Amul checkout
    await loadUserData();
  };

  const handleOpenExternal = () => {
    if (Platform.OS === 'web') {
      window.open(CHECKOUT_URL, '_blank');
    } else {
      WebBrowser.openBrowserAsync(CHECKOUT_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: '#1D4ED8',
      });
    }
  };

  if (!product) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Official Security Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.securePill}>
              <Lock size={11} color="#059669" />
              <Text style={styles.secureDomain}>shop.amul.com/en/checkout</Text>
            </View>
            <Text style={styles.headerSubtitle}>Official GCMMF Direct Checkout</Text>
          </View>

          <TouchableOpacity
            style={styles.externalButton}
            onPress={handleOpenExternal}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ExternalLink size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Informational Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <ShieldCheck size={14} color="#1D4ED8" />
          <Text style={styles.disclaimerText}>
            Direct official Amul gateway. Payment & delivery are fulfilled 100% by Amul.
          </Text>
        </View>

        {/* Content Body: Pre-loader OR WebView / Browser */}
        {isPreReserving ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingTitle}>Connecting to Amul D2C</Text>
              <Text style={styles.loadingSub}>{reservationMessage}</Text>
            </View>
          </View>
        ) : Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <View style={styles.webCard}>
              <CheckCircle2 size={44} color="#10B981" />
              <Text style={styles.webTitle}>Item Pre-Reserved in Cart!</Text>
              <Text style={styles.webSub}>
                {product.title} has been added to your authenticated Amul session.
              </Text>

              <TouchableOpacity
                style={styles.openAmulBtn}
                onPress={handleOpenExternal}
                activeOpacity={0.8}
              >
                <Text style={styles.openAmulBtnText}>Open Amul Checkout Page</Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Return to App</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <WebView
            key={webViewKey}
            source={{
              uri: CHECKOUT_URL,
              headers: {
                Cookie: session.sessionCookie || '',
                'User-Agent':
                  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
              },
            }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingSub}>Loading Amul Checkout...</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerCenter: {
    alignItems: 'center',
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  secureDomain: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  externalButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  webSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  openAmulBtn: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  openAmulBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  webView: {
    flex: 1,
  },
});
