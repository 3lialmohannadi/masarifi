import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

const videoSource = require("@/assets/videos/splash.mp4");

interface Props {
  onFinish: () => void;
  onReady?: () => void;
}

export function VideoSplash({ onFinish, onReady }: Props) {
  const readyCalled = useRef(false);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const playSub = player.addListener("playingChange", ({ isPlaying }) => {
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
