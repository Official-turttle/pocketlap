/**
 * PocketLab Image Canvas
 * 
 * Skia-based image canvas with zoom and pan gestures.
 * Displays the proxy image during editing.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  rect,
  FilterMode,
  MipmapMode,
} from 'react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

// ============================================================================
// Types
// ============================================================================

export interface ImageCanvasProps {
  /** Path to the proxy image */
  imageUri: string;
  /** Original image width */
  imageWidth: number;
  /** Original image height */
  imageHeight: number;
  /** Called when the canvas is ready */
  onReady?: () => void;
}

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

// ============================================================================
// Component
// ============================================================================

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageUri,
  imageWidth,
  imageHeight,
  onReady,
}) => {
  const screenDimensions = Dimensions.get('window');
  const canvasWidth = screenDimensions.width;
  const canvasHeight = screenDimensions.height * 0.6; // Approximate editor canvas area

  // Load the image
  const skiaImage = useImage(imageUri);

  // Transform state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Track initial values for gestures
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Calculate fit-to-screen scale
  const fitScale = useMemo(() => {
    if (!skiaImage) return 1;
    
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    return Math.min(scaleX, scaleY) * 0.95; // 95% to leave some margin
  }, [skiaImage, canvasWidth, canvasHeight, imageWidth, imageHeight]);

  // Initialize scale to fit
  useEffect(() => {
    if (skiaImage && fitScale > 0) {
      scale.value = fitScale;
      savedScale.value = fitScale;
      onReady?.();
    }
  }, [skiaImage, fitScale]);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onChange((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      // Optional: add momentum or bounds checking
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onChange((event) => {
      const newScale = savedScale.value * event.scale;
      // Clamp scale
      scale.value = Math.max(0.5, Math.min(5, newScale));
    })
    .onEnd(() => {
      // Optional: snap back to fit if zoomed out too far
    });

  // Double tap to reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(fitScale);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedScale.value = fitScale;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Combine gestures
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  if (!skiaImage) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={styles.canvas}>
          <SkiaImage
            image={skiaImage}
            x={(canvasWidth - imageWidth * scale.value) / 2 + translateX.value}
            y={(canvasHeight - imageHeight * scale.value) / 2 + translateY.value}
            width={imageWidth * scale.value}
            height={imageHeight * scale.value}
            fit="cover"
            filterMode={FilterMode.Linear}
            mipmapMode={MipmapMode.Linear}
          />
        </Canvas>
      </GestureDetector>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  loadingPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
});
