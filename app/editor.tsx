import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize } from '../src/constants/theme';
import { ImageCanvas } from '../src/components/ImageCanvas';
import { Toolbar, type ToolType } from '../src/components/Toolbar';
import { HistogramDisplay } from '../src/components/Histogram';
import { TunePanel } from '../src/components/Panels';
import { useEditorStore, selectCanUndo, selectCanRedo } from '../src/store';
import { createEmptyHistogram } from '../src/engine';
import { useState, useCallback } from 'react';

export default function EditorScreen() {
  const params = useLocalSearchParams<{
    projectId?: string;
    imageUri?: string;
    imageWidth?: string;
    imageHeight?: string;
  }>();

  const imageUri = params.imageUri;
  const imageWidth = params.imageWidth ? parseInt(params.imageWidth, 10) : 0;
  const imageHeight = params.imageHeight ? parseInt(params.imageHeight, 10) : 0;

  // Editor state
  const [selectedTool, setSelectedTool] = useState<ToolType>('tune');
  const editState = useEditorStore((state) => state.editState);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const startDrag = useEditorStore((state) => state.startDrag);
  const updateDrag = useEditorStore((state) => state.updateDrag);
  const endDrag = useEditorStore((state) => state.endDrag);
  const updateGlobal = useEditorStore((state) => state.updateGlobal);
  const undoAction = useEditorStore((state) => state.undoAction);
  const redoAction = useEditorStore((state) => state.redoAction);

  // Placeholder histogram (will be computed from actual render)
  const histogram = createEmptyHistogram();

  // Handle tune panel drag
  const handleTuneDrag = useCallback((updates: any) => {
    updateDrag((state) => ({
      ...state,
      global: {
        ...state.global,
        tone: { ...state.global.tone, ...updates },
        whiteBalance: { ...state.global.whiteBalance, ...updates },
      },
    }));
  }, [updateDrag]);

  // Handle tune panel commit
  const handleTuneCommit = useCallback((updates: any) => {
    updateGlobal({ tone: { ...editState.global.tone, ...updates } }, 'Adjust tone');
  }, [updateGlobal, editState.global.tone]);

  // Handle tune panel reset
  const handleTuneReset = useCallback((key: string) => {
    updateGlobal({ tone: { ...editState.global.tone, [key]: 0 } }, `Reset ${key}`);
  }, [updateGlobal, editState.global.tone]);

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.canvas}>
          <Text style={styles.placeholder}>No image loaded</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image canvas */}
      <View style={styles.canvas}>
        <ImageCanvas
          imageUri={imageUri}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
      </View>

      {/* Histogram */}
      <View style={styles.histogramContainer}>
        <HistogramDisplay histogram={histogram} />
      </View>

      {/* Adjustment panel */}
      <View style={styles.panel}>
        {selectedTool === 'tune' && (
          <TunePanel
            tone={editState.global.tone}
            whiteBalance={editState.global.whiteBalance}
            onDrag={handleTuneDrag}
            onCommit={handleTuneCommit}
            onReset={handleTuneReset}
          />
        )}
        {selectedTool !== 'tune' && (
          <View style={styles.panelPlaceholder}>
            <Text style={styles.panelPlaceholderText}>
              {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} panel
            </Text>
          </View>
        )}
      </View>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoAction}
        onRedo={redoAction}
        onExport={() => console.log('Export')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.sm,
    borderRadius: 8,
  },
  placeholder: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  histogramContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  panel: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 200,
    maxHeight: 250,
  },
  panelPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelPlaceholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
