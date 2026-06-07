import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      await login(res.data.token, res.data.user);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        authApi.google(id_token)
          .then(res => login(res.data.token, res.data.user))
          .catch(err => Alert.alert('Error', err.response?.data?.message || 'Google login failed'))
          .finally(() => setLoading(false));
      }
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SnapLedger</Text>
      <Text style={styles.subtitle}>Sign in to manage your bills</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={() => promptAsync()} 
        disabled={!request || loading}
      >
        <Text style={styles.googleButtonText}>Sign In with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#16162a',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6c47ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a4a',
  },
  orText: {
    color: '#8888aa',
    paddingHorizontal: 16,
  },
  googleButton: {
    backgroundColor: '#fff',
    marginTop: 0,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
