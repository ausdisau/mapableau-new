import React, { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { createLocalId, validatePost, type CommunityPost } from "./domain";
import { DEMO_CIRCLES, DEMO_GATHERINGS, DEMO_PLACES } from "./seed";
import { usePlacesStore } from "./store";
import { Action, Card, Choice, Field, Heading, Notice, S, Screen } from "./ui";

export function CommunityScreen() {
  const { state, dispatch } = usePlacesStore();
  const [circleId, setCircleId] = useState(DEMO_CIRCLES[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const circle = DEMO_CIRCLES.find(c => c.id === circleId) ?? DEMO_CIRCLES[0];
  const related = DEMO_GATHERINGS.filter(g => g.circleId === circle?.id);
  const posts = state.posts.filter(p => p.circleId === circleId);

  function candidate(): CommunityPost {
    return {
      id: editingId ?? createLocalId("post"),
      circleId, circleTitle: circle?.title ?? "",
      title: title.trim(), body: body.trim(),
      status: "draft", updatedAt: new Date().toISOString(),
    };
  }
  function checkPost() {
    const problems = validatePost(candidate());
    setErrors(problems);
    setPreview(problems.length === 0);
    if (problems.length) AccessibilityInfo.announceForAccessibility?.(problems.join(" "));
    else AccessibilityInfo.announceForAccessibility?.("Preview ready for review");
  }
  function savePost() {
    const draft = candidate();
    const problems = validatePost(draft);
    if (problems.length) { setErrors(problems); setPreview(false); return; }
    dispatch({ type: "save-post", post: draft });
    setEditingId(null); setTitle(""); setBody(""); setPreview(false); setErrors([]);
    setNotice("Post draft saved on this device. Nothing has been published to CripSquare.");
    AccessibilityInfo.announceForAccessibility?.("Draft saved on device");
  }
  return <Screen>
    <Heading>CripSquare communities</Heading>
    <Text style={S.body}>
      Meet around shared interests, not location surveillance. These are hypothetical CripSquare circles and gatherings for UX testing.
    </Text>
    <Notice kind="warn">
      CripSquare's live forum, accounts and events are not connected. Following a circle, saving interest or writing a post affects only this device.
    </Notice>

    <Heading level={2}>Explore a circle</Heading>
    <Choice label="Choose a community" options={DEMO_CIRCLES.map(c=>({value:c.id,label:c.title}))}
      value={circleId} onChange={v=>{setCircleId(v);setPreview(false);setErrors([]);setNotice("");setTitle("");setBody("");setEditingId(null);}}/>
    {circle && <Card>
      <Heading level={2}>{circle.title}</Heading>
      <Text style={S.body}>{circle.description}</Text>
      <Text style={S.small}>Linked example place: {DEMO_PLACES.find(p=>p.id===circle.placeId)?.name ?? "Place unavailable"}</Text>
      <Action label={state.joinedCircleIds.includes(circle.id) ? "Unfollow this circle locally" : "Follow this circle locally"}
        selected={state.joinedCircleIds.includes(circle.id)}
        onPress={()=>dispatch({type:"toggle-circle",circleId:circle.id})}
        hint="This does not create membership in the real CripSquare platform."/>
    </Card>}

    <Heading level={2}>Potential community activities</Heading>
    {related.map(gathering=><Card key={gathering.id}>
      <Heading level={3}>{gathering.title}</Heading>
      <Text style={S.body}>{gathering.timing}</Text>
      <Text style={S.muted}>Access planning: {gathering.accessPlan}</Text>
      <Action label={state.interestEventIds.includes(gathering.id) ? "Remove my locally saved interest" : "Save interest on this device"}
        selected={state.interestEventIds.includes(gathering.id)}
        onPress={()=>dispatch({type:"toggle-interest",eventId:gathering.id})}
        hint="This is not an RSVP, ticket, attendance confirmation or notification to an organiser."/>
    </Card>)}

    <Heading level={2}>Write a community discussion draft</Heading>
    <Text style={S.body}>
      This accessible text-only editor helps authors communicate clearly. You can review and edit before saving; no automatic publication.
    </Text>
    <Card>
      <Text style={S.eyebrow}>ATAG authoring support</Text>
      <Text style={S.small}>
        Use a descriptive title, write content that makes sense without a picture, avoid another person's identifiable information,
        and clearly distinguish an accessibility fact from an opinion. Multimedia is not enabled in this pilot.
      </Text>
      <Field label="Discussion title" value={title} maxLength={120} onChangeText={v=>{setTitle(v);setPreview(false);}}
        placeholder="For example: A relaxed local book club"/>
      <Field label="Discussion message" value={body} maxLength={2000} multiline onChangeText={v=>{setBody(v);setPreview(false);}}
        placeholder="What would you like to discuss? Include enough context for someone reading without images."
        help="At least 20 characters. Please do not add personal medical details or other people's private information."/>
      {errors.length>0 && <Notice kind="error" live>{errors.join(" ")}</Notice>}
      {notice ? <Notice kind="success" live>{notice}</Notice> : null}
      {preview && <View style={{ gap: 10 }}>
        <Heading level={3}>Preview before saving</Heading>
        <Text style={S.label}>{title.trim()}</Text>
        <Text style={S.body}>{body.trim()}</Text>
        <Text style={S.small}>Destination: {circle?.title}. Visibility: private on this device.</Text>
      </View>}
      <View style={S.row}>
        {!preview
          ? <Action label="Check accessibility and preview draft" primary onPress={checkPost}/>
          : <Action label={editingId?"Save edited draft locally":"Save discussion draft locally"} primary onPress={savePost}/>}
        {preview && <Action label="Return to editing" onPress={()=>setPreview(false)}/>}
        {editingId && <Action label="Cancel editing" onPress={()=>{setEditingId(null);setTitle("");setBody("");setPreview(false);setErrors([]);}}/>}
      </View>
    </Card>

    <Heading level={2}>My discussion drafts ({posts.length})</Heading>
    {posts.length===0 && <Text style={S.muted}>No posts drafted for this circle yet.</Text>}
    {posts.map(post=><Card key={post.id}>
      <Heading level={3}>{post.title}</Heading>
      <Text style={S.body}>{post.body}</Text>
      <Text style={S.small}>Status: {post.status === "prepared-for-review"
        ? "Prepared for possible human moderation, on this device only"
        : "Private draft on this device"}.</Text>
      <View style={S.row}>
        <Action label={"Edit post " + post.title} onPress={()=>{
          setCircleId(post.circleId);setTitle(post.title);setBody(post.body);
          setEditingId(post.id);setPreview(false);setErrors([]);setNotice("");
        }}/>
        {post.status === "draft" && <Action label={"Mark post ready for later human review: " + post.title}
          onPress={()=>dispatch({type:"prepare-post",id:post.id})}/>}
        {confirmDelete===post.id
          ? <>
            <Text style={S.small}>Permanently delete this local post?</Text>
            <Action label="Confirm delete post" danger onPress={()=>{dispatch({type:"delete-post",id:post.id});setConfirmDelete(null);}}/>
            <Action label="Keep post" onPress={()=>setConfirmDelete(null)}/>
          </>
          : <Action label={"Delete draft " + post.title} danger onPress={()=>setConfirmDelete(post.id)}/>}
      </View>
    </Card>)}
  </Screen>;
}
