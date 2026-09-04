import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import AuthScreen from '../screens/AuthScreen';
import CornersListScreen from '../screens/CornersListScreen';
import CornerDetailScreen from '../screens/CornerDetailScreen';
import CreateCornerScreen from '../screens/CreateCornerScreen';
import ComposerScreen from '../screens/ComposerScreen';
import BrowseScreen from '../screens/BrowseScreen';
import { Corner } from '../firebase/firestore';

type Tab = 'corners' | 'browse';
type Stage = 'auth' | 'app';
type CornersView = 'list' | 'detail' | 'create' | 'compose';

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  return (
    <View style={tb.bar}>
      <TouchableOpacity style={tb.tab} onPress={() => onPress('corners')}>
        <Text style={[tb.label, active === 'corners' && tb.labelActive]}>CORNERS</Text>
        {active === 'corners' && <View style={tb.dot} />}
      </TouchableOpacity>
      <TouchableOpacity style={tb.tab} onPress={() => onPress('browse')}>
        <Text style={[tb.label, active === 'browse' && tb.labelActive]}>BROWSE</Text>
        {active === 'browse' && <View style={tb.dot} />}
      </TouchableOpacity>
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.darkBrown,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 11,
    color: Colors.mutedText, letterSpacing: 2,
  },
  labelActive: { color: Colors.cream },
  dot: { width: 3, height: 3, backgroundColor: Colors.rust, borderRadius: 2, marginTop: 3 },
});

export default function AppNavigator() {
  const [stage, setStage] = useState<Stage>('auth');
  const [uid, setUid] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('corners');
  const [cornersView, setCornersView] = useState<CornersView>('list');
  const [selectedCorner, setSelectedCorner] = useState<Corner | null>(null);

  // ── Auth stages ───────────────────────────────────────────────────────────

  if (stage === 'auth') {
    return (
      <AuthScreen
        onAuthenticated={(newUid) => {
          setUid(newUid);
          setStage('app');
        }}
      />
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
        username="your_handle" // TODO: pull from user profile
        cornerId={selectedCorner.id}
        cornerName={selectedCorner.name}
        onPosted={() => setCornersView('detail')}
        onCancel={() => setCornersView('detail')}
      />
    );
  }

  // ── Main app (tabbed) ─────────────────────────────────────────────────────

  const renderCornersTab = () => {
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
        username="your_handle" // TODO: pull from user profile
        genres={['shoegaze', 'doom']} // TODO: pull from user profile
        onOpenCorner={(corner) => {
          setSelectedCorner(corner);
          setCornersView('detail');
        }}
        onCreateCorner={() => setCornersView('create')}
        onSignOut={() => {
          setStage('auth');
          setUid('');
          setActiveTab('corners');
          setCornersView('list');
          setSelectedCorner(null);
        }}
      />
    );
  };

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'corners' && cornersView !== 'list' && cornersView !== 'detail') {
      setCornersView('list');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'corners' ? renderCornersTab() : <BrowseScreen />}
      </View>
      <TabBar active={activeTab} onPress={handleTabPress} />
    </View>
  );
}
