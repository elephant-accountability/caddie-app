import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/theme/colors';
import { QueueProvider } from '../src/context/QueueContext';
import { ConversationProvider } from '../src/context/ConversationContext';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { View } from 'react-native';
import { useShareCapture } from '../src/hooks/useShareCapture';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Listen for share extension deep links
  useShareCapture();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <QueueProvider>
      <ConversationProvider>
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
      </ConversationProvider>
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
