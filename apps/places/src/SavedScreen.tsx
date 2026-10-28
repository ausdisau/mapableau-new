import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { createLocalId } from "./domain";
import { usePlacesStore } from "./store";
import { Action, Card, Choice, Field, Heading, Notice, S, Screen } from "./ui";

export function SavedScreen() {
  const { state, dispatch } = usePlacesStore();
  const [placeId, setPlaceId] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const editingUnbookmarked = state.memories.some(memory =>
      memory.id === editingId && memory.placeId === placeId);
    if (!state.savedPlaces.some(p=>p.id===placeId) && !editingUnbookmarked) {
      setPlaceId(state.savedPlaces[0]?.id ?? "");
    }
  }, [state.savedPlaces, state.memories, placeId, editingId]);

  const originalMemory = state.memories.find(m => m.id === editingId);
  const selectablePlaces = [...state.savedPlaces];
  if (originalMemory && !selectablePlaces.some(p => p.id === originalMemory.placeId)) {
    selectablePlaces.push({ id: originalMemory.placeId, name: originalMemory.placeName, suburb: "", savedAt: originalMemory.updatedAt });
  }

  function saveMemory() {
    const place = selectablePlaces.find(p => p.id === placeId);
    if (!place) { setError("Save a place first, then select it here."); return; }
    const trimmed = note.trim();
    if (trimmed.length < 3 || trimmed.length > 1500) {
      setError("Write a note between 3 and 1,500 characters."); return;
    }
    dispatch({ type:"save-memory", memory: {
      id: editingId ?? createLocalId("memory"), placeId: place.id, placeName: place.name,
      note: trimmed, audience: "private", updatedAt:new Date().toISOString(),
    }});
    setEditingId(null);
    setNote("");
    setError("");
    setFeedback("Private place memory saved on this device, not shared as a check-in.");
    AccessibilityInfo.announceForAccessibility?.("Private memory saved");
  }

  return <Screen>
    <Heading>My Places</Heading>
    <Text style={S.body}>Your saved places and private memories. No GPS tracking, public activity feed or visit verification.</Text>
    <Notice kind="warn">Local prototype storage is not encrypted. Do not write clinical or other highly sensitive information in demonstration notes.</Notice>
    <Heading level={2}>Saved places ({state.savedPlaces.length})</Heading>
    {state.savedPlaces.length===0 && <Notice>Nothing saved yet. Open the Places tab and choose Save to My Places.</Notice>}
    {state.savedPlaces.map(place=><Card key={place.id}>
      <Heading level={3}>{place.name}</Heading>
      <Text style={S.small}>{place.suburb}</Text>
      <Action label={"Remove " + place.name + " from saved places"} danger
        onPress={()=>dispatch({type:"remove-saved",id:place.id})}/>
    </Card>)}

    <Heading level={2}>Write a private place memory</Heading>
    <Text style={S.muted}>
      You do not need to be at a venue to write a note. Memories remain private and are not check-ins.
    </Text>
    {(state.savedPlaces.length>0 || Boolean(originalMemory)) && <Card>
      <Choice label="Choose the place" value={placeId}
        options={selectablePlaces.map(p=>({value:p.id,label:p.name}))}
        onChange={id=>{setPlaceId(id);setNote("");setEditingId(null);setError("");}}/>
      <Text style={S.small}>Selected place: {selectablePlaces.find(p=>p.id===placeId)?.name ?? "None"}</Text>
      <Field label="My private note" value={note} onChangeText={setNote} multiline maxLength={1500}
        placeholder="What matters about this place to you?"
        help="Plain text, 3–1,500 characters. Never published automatically; no precise time or GPS is recorded."/>
      {error ? <Notice kind="error" live>{error}</Notice> : null}
      {feedback ? <Notice kind="success" live>{feedback}</Notice> : null}
      <View style={S.row}>
        <Action label={editingId ? "Update private memory" : "Save private memory"} primary onPress={saveMemory}/>
        {editingId && <Action label="Cancel editing" onPress={()=>{setEditingId(null);setNote("");setError("");}}/>}
      </View>
    </Card>}

    <Heading level={2}>My memories ({state.memories.length})</Heading>
    {state.memories.length===0 && <Text style={S.muted}>Your journal is empty.</Text>}
    {state.memories.map(m=><Card key={m.id}>
      <Heading level={3}>{m.placeName}</Heading>
      <Text style={S.body}>{m.note}</Text>
      <Text style={S.small}>Private · Updated {m.updatedAt.slice(0,10)}</Text>
      <View style={S.row}>
        <Action label={"Edit memory for " + m.placeName} onPress={()=>{
          setPlaceId(m.placeId);setNote(m.note);setEditingId(m.id);setError("");setFeedback("");
        }}/>
        {confirmDelete === m.id
          ? <>
            <Text style={S.small}>Delete this memory permanently from local records?</Text>
            <Action label="Confirm delete memory" danger onPress={()=>{dispatch({type:"delete-memory",id:m.id});setConfirmDelete(null);}}/>
            <Action label="Keep memory" onPress={()=>setConfirmDelete(null)}/>
          </>
          : <Action label={"Delete memory for " + m.placeName} danger onPress={()=>setConfirmDelete(m.id)}/>}
      </View>
    </Card>)}
  </Screen>;
}
