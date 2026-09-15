import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { Colors } from '../theme/colors';
import { auth } from '../firebase/config';
import { signOut } from '../firebase/auth';
import AuthScreen from '../screens/AuthScreen';
import UsernameScreen from '../screens/UsernameScreen';
import GenrePickerScreen from '../screens/GenrePickerScreen';
import CornersListScreen from '../screens/CornersListScreen';
import CornerDetailScreen from '../screens/CornerDetailScreen';
import CreateCornerScreen from '../screens/CreateCornerScreen';
import ComposerScreen from '../screens/ComposerScreen';
import BrowseScreen from '../screens/BrowseScreen';
import ReleaseDetailScreen from '../screens/ReleaseDetailScreen';
import MethodologyScreen from '../screens/MethodologyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Corner, Release, UserProfile, getUserProfile } from '../firebase/firestore';

type Tab = 'home' | 'new' | 'me' | 'settings';
type Stage = 'loading' | 'auth' | 'username' | 'taste' | 'app';
type CornersView = 'list' | 'detail' | 'create' | 'compose';
type BrowseView = 'list' | 'detail' | 'methodology';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'new', label: 'New', icon: 'disc-outline', iconActive: 'disc' },
  { key: 'me', label: 'Me', icon: 'person-outline', iconActive: 'person' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  const [barWidth, setBarWidth] = useState(0);
  const activeIndex = TABS.findIndex(t => t.key === active);
  const anim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeIndex]);

  const slotWidth = barWidth / TABS.length;
  const pillWidth = Math.min(slotWidth - 8, 88);
  const translateX = anim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * slotWidth + (slotWidth - pillWidth) / 2),
  });

  return (
    <View style={tb.wrap}>
      <View style={tb.bar} onLayout={e => setBarWidth(e.nativeEvent.layout.width)}>
        {barWidth > 0 && (
          <Animated.View
            style={[tb.pill, { width: pillWidth, transform: [{ translateX }] }]}
          />
        )}
        {TABS.map(t => {
          const isActive = t.key === active;
          return (
            <TouchableOpacity key={t.key} style={tb.tab} onPress={() => onPress(t.key)} activeOpacity={0.7}>
              <Ionicons
                name={isActive ? t.iconActive : t.icon}
                size={20}
                color={isActive ? Colors.cream : Colors.mutedText}
              />
              <Text style={[tb.label, isActive && tb.labelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 28, backgroundColor: Colors.background },
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    shadowColor: Colors.cream,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  pill: {
    position: 'absolute',
    top: 6, bottom: 6, left: 0,
    backgroundColor: Colors.darkBrown,
    borderRadius: 22,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  label: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9,
    color: Colors.mutedText, letterSpacing: 0.5,
  },
  labelActive: { color: Colors.cream },
});

export default function AppNavigator() {
  const [stage, setStage] = useState<Stage>('loading');
  const [uid, setUid] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cornersView, setCornersView] = useState<CornersView>('list');
  const [selectedCorner, setSelectedCorner] = useState<Corner | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>('list');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  // ── Restore a persisted phone-auth session on launch ───────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStage('auth');
        return;
      }
      const existing = await getUserProfile(user.uid);
      setUid(user.uid);
      if (existing) {
        setProfile(existing);
        setStage('app');
      } else {
        setPendingPhone(user.phoneNumber ?? '');
        setStage('username');
      }
    });
    return unsub;
  }, []);

  const resetToSignedOut = () => {
    setUid('');
    setPendingPhone('');
    setPendingUsername('');
    setProfile(null);
    setActiveTab('home');
    setCornersView('list');
    setSelectedCorner(null);
    setBrowseView('list');
    setSelectedRelease(null);
    setStage('auth');
  };

  // ── Auth / onboarding stages ────────────────────────────────────────────────

  if (stage === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.amber} />
      </View>
    );
  }

  if (stage === 'auth') {
    return (
      <AuthScreen
        onAuthenticated={(newUid, phoneNumber) => {
          setUid(newUid);
          setPendingPhone(phoneNumber);
          setStage('username');
        }}
      />
    );
  }

  if (stage === 'username') {
    return (
      <UsernameScreen
        onSubmit={(username) => {
          setPendingUsername(username);
          setStage('taste');
        }}
      />
    );
  }

  if (stage === 'taste') {
    return (
      <GenrePickerScreen
        uid={uid}
        phoneNumber={pendingPhone}
        username={pendingUsername}
        onComplete={(newProfile) => {
          setProfile(newProfile);
          setStage('app');
        }}
      />
    );
  }

  if (!profile) {
    // Shouldn't happen — app stage requires a saved profile — but keep the
    // type checker honest and avoid rendering the tabs with no identity.
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.amber} />
      </View>
    );
  }

  // ── Corners stack (modal-style full screens, no tab bar) ──────────────────

  if (cornersView === 'create') {
    return (
      <CreateCornerScreen
        currentUid={uid}
        onCreated={(cornerId, cornerName) => {
          setSelectedCorner({
            id: cornerId,
            name: cornerName,
            ownerUid: uid,
            memberUids: [uid],
            createdAt: Date.now(),
            isPublic: false,
            lastActivityAt: Date.now(),
          });
          setCornersView('detail');
        }}
        onCancel={() => setCornersView('list')}
      />
    );
  }

  if (cornersView === 'compose' && selectedCorner) {
    return (
      <ComposerScreen
        currentUid={uid}
        username={profile.username}
        cornerId={selectedCorner.id}
        cornerName={selectedCorner.name}
        onPosted={() => setCornersView('detail')}
        onCancel={() => setCornersView('detail')}
      />
    );
  }

  // ── Main app (tabbed) ─────────────────────────────────────────────────────

  const renderHomeTab = () => {
    if (cornersView === 'detail' && selectedCorner) {
      return (
        <CornerDetailScreen
          corner={selectedCorner}
          currentUid={uid}
          onBack={() => setCornersView('list')}
          onCompose={() => setCornersView('compose')}
        />
      );
    }
    return (
      <CornersListScreen
        currentUid={uid}
        onOpenCorner={(corner) => {
          setSelectedCorner(corner);
          setCornersView('detail');
        }}
        onCreateCorner={() => setCornersView('create')}
      />
    );
  };

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'home' && cornersView !== 'list' && cornersView !== 'detail') {
      setCornersView('list');
    }
    if (tab === 'new' && browseView !== 'list') {
      setBrowseView('list');
    }
  };

  const renderNewTab = () => {
    if (browseView === 'detail' && selectedRelease) {
      return (
        <ReleaseDetailScreen
          release={selectedRelease}
          currentUid={uid}
          username={profile.username}
          onBack={() => setBrowseView('list')}
        />
      );
    }
    if (browseView === 'methodology') {
      return <MethodologyScreen onBack={() => setBrowseView('list')} />;
    }
    return (
      <BrowseScreen
        onOpenRelease={(release) => {
          setSelectedRelease(release);
          setBrowseView('detail');
        }}
        onOpenMethodology={() => setBrowseView('methodology')}
      />
    );
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return renderHomeTab();
      case 'new': return renderNewTab();
      case 'me': return <ProfileScreen username={profile.username} genres={profile.genres} />;
      case 'settings': return <SettingsScreen onSignOut={() => signOut().finally(resetToSignedOut)} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
      <TabBar active={activeTab} onPress={handleTabPress} />
    </View>
  );
}
