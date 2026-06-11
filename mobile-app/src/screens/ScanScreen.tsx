import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { invoicesApi } from '../lib/api';
import { X, Check, Image as ImageIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Viewfinder frame dimensions — centered square with padding
const FRAME_MARGIN_H = 24;
const FRAME_WIDTH = SCREEN_WIDTH - FRAME_MARGIN_H * 2;
const FRAME_HEIGHT = FRAME_WIDTH * 1.3; // A4-ish portrait ratio
const FRAME_TOP = (SCREEN_HEIGHT - FRAME_HEIGHT) / 2 - 40;

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const data = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });

    // Crop to the viewfinder frame region
    const scaleX = data.width / SCREEN_WIDTH;
    const scaleY = data.height / SCREEN_HEIGHT;

    const cropX = FRAME_MARGIN_H * scaleX;
    const cropY = FRAME_TOP * scaleY;
    const cropWidth = FRAME_WIDTH * scaleX;
    const cropHeight = FRAME_HEIGHT * scaleY;

    const cropped = await ImageManipulator.manipulateAsync(
      data.uri,
      [{ crop: { originX: cropX, originY: cropY, width: cropWidth, height: cropHeight } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );

    setPhoto(cropped);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const uploadPhoto = async () => {
    setScanning(true);
    try {
      const formData = new FormData() as any;
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      });
      const res = await invoicesApi.scan(formData);
      setExtractedData(res.data);
    } catch (err: any) {
      Alert.alert('Scan Failed', err.response?.data?.message || 'Failed to process receipt');
      setPhoto(null);
    } finally {
      setScanning(false);
    }
  };

  const saveInvoice = async () => {
    try {
      await invoicesApi.saveScanned(extractedData);
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Error', 'Failed to save invoice');
    }
  };

  // ── Results screen ──────────────────────────────────────────────────
  if (extractedData) {
    return (
      <View style={[styles.container, styles.resultContainer]}>
        <Text style={styles.title}>Scanned Details</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Merchant</Text>
          <Text style={styles.value}>{extractedData.merchantName || 'Unknown'}</Text>

          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.value}>
            {extractedData.totalAmount?.toLocaleString() ?? '—'}
            {'  '}
            <Text style={{ color: '#a78bfa', fontSize: 14 }}>{extractedData.currency ?? 'USD'}</Text>
          </Text>

          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{extractedData.category}</Text>

          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {extractedData.invoiceDate
              ? new Date(extractedData.invoiceDate).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#2a2a4a', flex: 1 }]}
            onPress={() => { setPhoto(null); setExtractedData(null); }}>
            <Text style={styles.btnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveInvoice}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Preview screen ──────────────────────────────────────────────────
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        {scanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#6c47ff" />
            <Text style={{ color: '#fff', marginTop: 16 }}>Analyzing with AI...</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setPhoto(null)}>
              <X color="#fff" size={32} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: '#6c47ff' }]}
              onPress={uploadPhoto}>
              <Check color="#fff" size={32} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Camera + viewfinder screen ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />

      {/* Dark overlay — top */}
      <View style={[styles.dimOverlay, { top: 0, height: FRAME_TOP }]} />
      {/* Dark overlay — bottom */}
      <View style={[styles.dimOverlay, { top: FRAME_TOP + FRAME_HEIGHT, bottom: 0 }]} />
      {/* Dark overlay — left */}
      <View style={[styles.dimOverlay, {
        top: FRAME_TOP, height: FRAME_HEIGHT, left: 0, width: FRAME_MARGIN_H,
      }]} />
      {/* Dark overlay — right */}
      <View style={[styles.dimOverlay, {
        top: FRAME_TOP, height: FRAME_HEIGHT, right: 0, width: FRAME_MARGIN_H,
      }]} />

      {/* Blue viewfinder frame */}
      <View style={[styles.viewfinder, {
        top: FRAME_TOP,
        left: FRAME_MARGIN_H,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      }]}>
        {/* Corner accents */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <Text style={styles.hint}>Fit the document inside the frame</Text>

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <X color="#fff" size={28} />
      </TouchableOpacity>

      {/* Bottom controls */}
      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
          <ImageIcon color="#fff" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <View style={{ width: 48 }} />
      </View>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  resultContainer: { backgroundColor: '#0f0f1a', padding: 24, justifyContent: 'center' },
  text: { color: '#fff', textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#6c47ff', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },

  // Dim overlays
  dimOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // Viewfinder frame
  viewfinder: {
    position: 'absolute',
    borderRadius: 4,
  },

  // Blue corner accents
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#3b82f6',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  hint: {
    position: 'absolute',
    top: FRAME_TOP - 36,
    alignSelf: 'center',
    color: '#ffffffcc',
    fontSize: 13,
    fontWeight: '500',
  },

  closeBtn: {
    position: 'absolute', top: 50, left: 24,
    padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
  },
  captureContainer: {
    position: 'absolute', bottom: 50, width: '100%',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40,
  },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  galleryBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  preview: { flex: 1, resizeMode: 'contain' },
  actions: {
    position: 'absolute', bottom: 50, width: '100%',
    flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40,
  },
  iconBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: { backgroundColor: '#16162a', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  label: { color: '#8888aa', fontSize: 12, marginBottom: 4, marginTop: 16 },
  value: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
