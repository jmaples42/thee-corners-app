import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { LinkMeta } from '../firebase/firestore';
import { youtubeThumbnail, youtubeWatchUrl } from '../utils/youtube';

// A thumbnail that becomes the player in place when tapped. The WebView only mounts on tap,
// so a long chat doesn't load a player per post.
function playerHtml(videoId: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe src="https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=1&rel=0&modestbranding=1"
allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
}

export default function YouTubeTile({ videoId, meta }: { videoId: string; meta: LinkMeta }) {
  const [playing, setPlaying] = useState(false);
  const thumb = meta.thumbnail || youtubeThumbnail(videoId);

  return (
    <View style={s.wrap}>
      <View style={s.frame}>
        {playing ? (
          <WebView
            style={s.fill}
            // A real origin: YouTube refuses embeds that have none (error 153).
            source={{ html: playerHtml(videoId), baseUrl: 'https://corners.thefanlab.com' }}
            originWhitelist={['*']}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            javaScriptEnabled
            scrollEnabled={false}
          />
        ) : (
          <TouchableOpacity
            style={s.fill}
            activeOpacity={0.85}
            onPress={() => setPlaying(true)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${meta.title}`}
          >
            <Image source={{ uri: thumb }} style={s.fill} resizeMode="cover" />
            <View style={s.playWrap} pointerEvents="none">
              <View style={s.playDisc}>
                <Ionicons name="play" size={26} color={Colors.cream} style={{ marginLeft: 3 }} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.captionRow}>
        <View style={s.captionText}>
          <Text style={s.title} numberOfLines={2}>{meta.title}</Text>
          <Text style={s.channel}>YOUTUBE{meta.channel ? `  ·  ${meta.channel.toUpperCase()}` : ''}</Text>
        </View>
        {/* Some videos refuse to play outside YouTube even when the search says embeddable. */}
        <TouchableOpacity
          onPress={() => Linking.openURL(meta.url || youtubeWatchUrl(videoId))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open in YouTube"
        >
          <Ionicons name="open-outline" size={18} color={Colors.mutedText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: Colors.cardBg, borderLeftWidth: 2, borderLeftColor: Colors.rust, marginBottom: 12 },
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  fill: { width: '100%', height: '100%' },
  playWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playDisc: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(241,233,207,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  captionText: { flex: 1 },
  title: { fontFamily: Font.body, fontSize: 16, color: Colors.cream, lineHeight: 23 },
  channel: { fontFamily: Font.label, fontSize: 12, color: '#FF0000', letterSpacing: 1, marginTop: 6 },
});
