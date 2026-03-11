import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";

const videoSource = require("@/assets/videos/splash.mp4");

interface Props {
  onFinish: () => void;
}

export function VideoSplash({ onFinish }: Props) {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener("playToEnd", onFinish);
    const timeout = setTimeout(onFinish, 12000);
    return () => {
      sub.remove();
      clearTimeout(timeout);
    };
  }, [player, onFinish]);

  if (Platform.OS === "web") {
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
