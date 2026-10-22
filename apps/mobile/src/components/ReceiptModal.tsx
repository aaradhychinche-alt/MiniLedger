import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { Radii } from '../constants/theme';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const { width, height } = Dimensions.get('window');

export function ReceiptModal({ visible, onClose, imageUrl }: ReceiptModalProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.92,
    height: height * 0.75,
    borderRadius: Radii.lg,
  },
});
