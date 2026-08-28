import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashCheckoutModal } from '../components/FlashCheckoutModal';
import { useStockStore } from '../store/useStockStore';

export default function CheckoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { products } = useStockStore();

  const product = products.find((p) => p.id === id) || products[0];

  return (
    <View style={styles.container}>
      <FlashCheckoutModal
        visible={true}
        product={product}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
