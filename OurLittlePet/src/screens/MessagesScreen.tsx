import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Avatar, Empty, Screen } from '../components/ui';
import { useWorld } from '../context/World';
import { markRead, sendMessage } from '../services/chat';
import { pickImage, uploadImage } from '../services/images';
import { timeLabel } from '../utils/format';
import type { Message } from '../types';
import { colors, radius } from '../theme';

export default function MessagesScreen() {
  const w = useWorld();
  const focused = useIsFocused();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Mark as read whenever this tab is open and new partner messages arrive.
  const newest = w.messages.find(m => m.from !== w.uid)?.createdAtMs ?? 0;
  useEffect(() => {
    if (focused && w.unread > 0) markRead(w.roomId, w.uid).catch(() => {});
  }, [focused, w.unread, newest, w.roomId, w.uid]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    sendMessage(w.roomId, w.uid, t).catch(e => w.toast(e?.message ?? 'Message failed to send.'));
  };
  const sendPhoto = async () => {
    try {
      const uri = await pickImage();
      if (!uri) return;
      setUploading(true);
      const { url } = await uploadImage(w.roomId, 'chat', w.uid, uri);
      await sendMessage(w.roomId, w.uid, '', url);
    } catch (e: any) { w.toast(e?.message ?? 'Could not send the photo.'); }
    setUploading(false);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.from === w.uid;
    const who = mine ? w.me : w.partner;
    const seen = mine && !item.pending && item.createdAtMs !== null && w.partnerReadMs >= item.createdAtMs;
    return (
      <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', marginVertical: 4, paddingHorizontal: 12 }}>
        <Avatar uri={who?.photoURL} name={who?.displayName ?? '?'} size={30} />
        <View style={{ maxWidth: '75%', marginHorizontal: 8, backgroundColor: mine ? colors.pinkDeep : colors.lavender, borderRadius: radius.md, borderBottomRightRadius: mine ? 4 : radius.md, borderBottomLeftRadius: mine ? radius.md : 4, padding: item.imageUrl ? 4 : 10 }}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: 220, height: 220, borderRadius: radius.md - 4 }} /> : null}
          {item.text ? <Text style={{ color: mine ? '#fff' : colors.text, fontSize: 15 }}>{item.text}</Text> : null}
          <Text style={{ fontSize: 10, color: mine ? 'rgba(255,255,255,0.85)' : colors.muted, alignSelf: 'flex-end', marginTop: 3, marginRight: item.imageUrl ? 6 : 0 }}>
            {timeLabel(item.createdAtMs)}{mine ? (item.pending ? '  ⏳ sending' : seen ? '  ✓✓ seen' : '  ✓ sent') : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Avatar uri={w.partner?.photoURL} name={w.partner?.displayName ?? '?'} size={38} status={w.presence.partner} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>{w.partner?.displayName ?? 'Your person'}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{w.presence.partner === 'online' ? 'Online' : w.presence.partner === 'recent' ? 'Recently active' : 'Offline'}</Text>
        </View>
      </View>
      {!w.connected && <Text style={{ textAlign: 'center', color: colors.warn, fontWeight: '700', fontSize: 12 }}>Offline: messages will send when you reconnect (not delivered until confirmed ✓)</Text>}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted data={w.messages} keyExtractor={m => m.id} renderItem={renderItem}
          ListEmptyComponent={<View style={{ transform: [{ scaleY: -1 }] }}><Empty emoji="💌" title="Say hello" text="Your private chat starts here. Only the two of you can read it." /></View>}
          contentContainerStyle={{ paddingVertical: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: colors.glass }}>
          <Pressable onPress={sendPhoto} disabled={uploading} style={{ padding: 10 }}><Text style={{ fontSize: 22 }}>{uploading ? '⏳' : '📷'}</Text></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="Write something sweet… 💗" placeholderTextColor={colors.muted} multiline maxLength={2000}
            style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 110, color: colors.text, fontSize: 15 }} />
          <Pressable onPress={send} disabled={!text.trim()} style={{ marginLeft: 8, backgroundColor: colors.pinkDeep, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12, opacity: text.trim() ? 1 : 0.5 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
