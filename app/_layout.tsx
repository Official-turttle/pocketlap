import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'PocketLab' }} />
        <Stack.Screen
          name="editor"
          options={{
            title: 'Editor',
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen name="presets" options={{ title: 'Presets' }} />
        <Stack.Screen name="learn" options={{ title: 'Learn' }} />
      </Stack>
    </>
  );
}
