import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/constants/theme';
import { pickImage } from '../src/features/import';

export default function HomeScreen() {
  const router = useRouter();

  const handleImport = async () => {
    const result = await pickImage();
    
    if (result.success && result.source && result.proxyPath) {
      // Navigate to editor with the imported image
      router.push({
        pathname: '/editor',
        params: {
          projectId: `project_${Date.now()}`,
          imageUri: result.proxyPath,
          imageWidth: result.source.width.toString(),
          imageHeight: result.source.height.toString(),
        },
      });
    } else if (result.error && !result.error.includes('canceled')) {
      Alert.alert('Import Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>PocketLab</Text>
        <Text style={styles.subtitle}>Photo editing laboratory</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleImport}
        >
          <Text style={styles.primaryButtonText}>Import Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/presets')}
        >
          <Text style={styles.secondaryButtonText}>Presets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/learn')}
        >
          <Text style={styles.secondaryButtonText}>Learn</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No projects yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Import a photo to get started
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
