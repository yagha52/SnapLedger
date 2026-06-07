import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { invoicesApi } from '../lib/api';
import { X, Check, Camera as CameraIcon, Image as ImageIcon } from 'lucide-react-native';

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

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
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setPhoto(data);
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
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

  if (extractedData) {
    const currencySymbol = (c: string) => {
      switch(c) { case 'USD': return '$'; case 'EUR': return '€'; case 'GBP': return '£'; default: return c; }
    };
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
          <Text style={styles.value}>{extractedData.invoiceDate ? new Date(extractedData.invoiceDate).toLocaleDateString() : 'N/A'}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#2a2a4a', flex: 1 }]} onPress={() => { setPhoto(null); setExtractedData(null); }}>
            <Text style={styles.btnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveInvoice}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#6c47ff' }]} onPress={uploadPhoto}>
              <Check color="#fff" size={32} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />
      {/* Overlay rendered OUTSIDE CameraView using absolute positioning */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <X color="#fff" size={28} />
      </TouchableOpacity>
      
      <View style={styles.captureContainer}>
        {/* Placeholder for symmetry */}
        <View style={{ width: 48 }} />
        
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
          <ImageIcon color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  resultContainer: {
    backgroundColor: '#0f0f1a',
    padding: 24,
    justifyContent: 'center',
  },
  text: { color: '#fff', textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#6c47ff', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { position: 'absolute', top: 50, left: 24, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, zIndex: 10 },
  captureContainer: { position: 'absolute', bottom: 50, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  galleryBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  preview: { flex: 1, resizeMode: 'contain' },
  actions: { position: 'absolute', bottom: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40 },
  iconBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#16162a', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  label: { color: '#8888aa', fontSize: 12, marginBottom: 4, marginTop: 16 },
  value: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
