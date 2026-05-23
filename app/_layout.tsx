import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/theme/colors';
import { QueueProvider } from '../src/context/QueueContext';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { View } from 'react-native';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Could add a splash screen here
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <QueueProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.navy },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueueProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.navy }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
