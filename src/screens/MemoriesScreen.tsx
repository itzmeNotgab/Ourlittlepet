import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Body, Button, Card, Empty, H2, Screen } from '../components/ui';
import { useWorld } from '../context/World';
import { addMemory, deleteMemory, updateMemory, watchMemories } from '../services/memories';
import { deleteImage, pickImage, uploadImage } from '../services/images';
import { isValidDate, todayISO } from '../utils/format';
import type { Memory } from '../types';
import { colors, radius, shadow } from '../theme';

const inputStyle = { backgroundColor: colors.cream, borderRadius: radius.md, padding: 12, marginTop: 8, color: colors.text, fontSize: 15 } as const;

function Polaroid({ m, i, onPress }: { m: Memory; i: number; onPress: () => void }) {
  const tilt = ((i * 37) % 7) - 3;
  return (
    <Pressable onPress={onPress} style={{ width: '48%', marginBottom: 16, transform: [{ rotate: `${tilt}deg` }] }}>
      <View style={{ backgroundColor: '#fff', padding: 8, paddingBottom: 14, borderRadius: 6, ...shadow }}>
        <Image source={{ uri: m.imageUrl }} style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.lavender }} />
        <Text numberOfLines={1} style={{ marginTop: 8, fontWeight: '700', color: colors.text, fontSize: 13 }}>{m.caption || 'Untitled'}</Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>{m.date}</Text>
      </View>
    </Pressable>
  );
}

export default function MemoriesScreen() {
  const w = useWorld();
  const [list, setList] = useState<Memory[]>([]);
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState<Memory | null>(null);
  const [editing, setEditing] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => watchMemories(w.roomId, setList, () => {}), [w.roomId]);

  const openAdd = () => { setUri(null); setCaption(''); setNote(''); setDate(todayISO()); setAdding(true); };
  const choose = async () => { try { const u = await pickImage(); if (u) setUri(u); } catch (e: any) { w.toast(e.message); } };
  const save = async () => {
    if (!uri) return w.toast('Pick a photo first 📷');
    if (!isValidDate(date)) return w.toast('Date must look like 2026-11-16');
    setSaving(true);
    let path: string | null = null;
    try {
      const up = await uploadImage(w.roomId, 'memories', w.uid, uri);
      path = up.path;
      await addMemory(w.roomId, { authorId: w.uid, authorName: w.me.displayName, imageUrl: up.url, storagePath: up.path, caption: caption.trim(), note: note.trim(), date });
      setAdding(false);
    } catch (e: any) {
      if (path) await deleteImage(path);
      w.toast(e?.message ?? 'Could not save this memory.');
    }
    setSaving(false);
  };
  const saveEdit = async () => {
    if (!sel) return;
    if (!isValidDate(date)) return w.toast('Date must look like 2026-11-16');
    setSaving(true);
    try { await updateMemory(w.roomId, sel.id, { caption: caption.trim(), note: note.trim(), date }); setEditing(false); setSel(null); }
    catch (e: any) { w.toast(e?.message ?? 'Could not save.'); }
    setSaving(false);
  };
  const remove = () => {
    if (!sel) return;
    Alert.alert('Delete this memory?', 'This removes your photo for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteMemory(w.roomId, sel); setSel(null); } catch (e: any) { w.toast(e?.message ?? 'Could not delete.'); } } },
    ]);
  };
  const open = (m: Memory) => { setSel(m); setCaption(m.caption); setNote(m.note); setDate(m.date); setEditing(false); };

  return (
    <Screen>
      <View style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H2>Our Memories 📸</H2>
        <Button small title="+ Add" onPress={openAdd} />
      </View>
      <FlatList
        data={list} numColumns={2} keyExtractor={m => m.id} columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
        ListEmptyComponent={<Empty emoji="🖼️" title="No memories yet" text="Add your first photo together. Only the two of you can see them." />}
        renderItem={({ item, index }) => <Polaroid m={item} i={index} onPress={() => open(item)} />} />

      <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)}>
        <Screen><ScrollView contentContainerStyle={{ padding: 20 }}>
          <H2>New memory</H2>
          <Pressable onPress={choose} style={{ marginTop: 12, backgroundColor: colors.lavender, borderRadius: radius.md, height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: colors.purpleDark, fontWeight: '700' }}>📷 Tap to choose a photo</Text>}
          </Pressable>
          <TextInput style={inputStyle} placeholder="Caption" placeholderTextColor={colors.muted} value={caption} onChangeText={setCaption} maxLength={200} />
          <TextInput style={inputStyle} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={date} onChangeText={setDate} maxLength={10} />
          <TextInput style={[inputStyle, { height: 100, textAlignVertical: 'top' }]} placeholder="A little note…" placeholderTextColor={colors.muted} value={note} onChangeText={setNote} multiline maxLength={2000} />
          <Button title="Save memory" onPress={save} loading={saving} style={{ marginTop: 16 }} />
          <Button title="Cancel" variant="soft" onPress={() => setAdding(false)} style={{ marginTop: 8 }} />
        </ScrollView></Screen>
      </Modal>

      <Modal visible={!!sel} animationType="fade" transparent onRequestClose={() => setSel(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(74,59,92,0.55)', justifyContent: 'center', padding: 16 }}>
          {sel && (
            <Card style={{ maxHeight: '92%' }}>
              <ScrollView>
                <Image source={{ uri: sel.imageUrl }} style={{ width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.lavender }} />
                {editing ? (
                  <>
                    <TextInput style={inputStyle} value={caption} onChangeText={setCaption} placeholder="Caption" maxLength={200} />
                    <TextInput style={inputStyle} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" maxLength={10} />
                    <TextInput style={[inputStyle, { height: 90, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} multiline maxLength={2000} />
                    <Button title="Save changes" onPress={saveEdit} loading={saving} style={{ marginTop: 12 }} />
                  </>
                ) : (
                  <>
                    <H2>{sel.caption || 'Untitled'}</H2>
                    <Body style={{ color: colors.muted }}>{sel.date} · added by {sel.authorId === w.uid ? 'you' : sel.authorName}</Body>
                    {sel.note ? <Body style={{ marginTop: 8 }}>{sel.note}</Body> : null}
                    {sel.authorId === w.uid && (
                      <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        <Button small variant="soft" title="Edit" onPress={() => setEditing(true)} style={{ flex: 1, marginRight: 6 }} />
                        <Button small variant="danger" title="Delete" onPress={remove} style={{ flex: 1, marginLeft: 6 }} />
                      </View>
                    )}
                  </>
                )}
                <Button title="Close" variant="glass" onPress={() => setSel(null)} style={{ marginTop: 10 }} />
              </ScrollView>
            </Card>
          )}
        </View>
      </Modal>
    </Screen>
  );
}
