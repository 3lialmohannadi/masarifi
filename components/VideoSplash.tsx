import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

interface Props {
  onFinish: () => void;
  onReady?: () => void;
}

function VideoSplashNative({ onFinish, onReady }: Props) {
  const { VideoView, useVideoPlayer } = require("expo-video");
  const readyCalled = useRef(false);
  const videoSource = require("@/assets/videos/splash.mp4");

  const player = useVideoPlayer(videoSource, (p: any) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const playSub = player.addListener("playingChange", ({ isPlaying }: { isPlaying: boolean }) => {
      if (isPlaying && !readyCalled.current) {
        readyCalled.current = true;
        onReady?.();
      }
    });

    const endSub = player.addListener("playToEnd", onFinish);
    const timeout = setTimeout(onFinish, 5000);

    return () => {
      playSub.remove();
      endSub.remove();
      clearTimeout(timeout);
    };
  }, [player, onFinish, onReady]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export function VideoSplash({ onFinish, onReady }: Props) {
  useEffect(() => {
    if (Platform.OS === "web") {
      onReady?.();
      onFinish();
    }
  }, [onFinish, onReady]);

  if (Platform.OS === "web") {
    return <View style={styles.container} />;
  }

  return <VideoSplashNative onFinish={onFinish} onReady={onReady} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
