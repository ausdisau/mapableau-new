import React, { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { useCatalog } from "./catalog";
import {
  createLocalId, validateReport, type AccessReport, type FeatureType,
  type ObservationOutcome, type ObservationSource,
} from "./domain";
import { usePlacesStore } from "./store";
import { Action, Card, Choice, Field, Heading, Notice, S, Screen } from "./ui";

const featureOptions: {value: FeatureType; label: string}[] = [
  {value:"entrance",label:"Step-free entrance"},
  {value:"toilets",label:"Accessible toilets"},
  {value:"communication",label:"Communication access"},
  {value:"sensory",label:"Sensory environment"},
  {value:"transport",label:"Approach and transport"},
];
const outcomeOptions: {value: ObservationOutcome; label: string}[] = [
  {value:"usable",label:"Feature usable for me"},
  {value:"barrier",label:"I encountered a barrier"},
  {value:"unsure",label:"Cannot confirm"},
];
const sourceOptions: {value: ObservationSource; label: string}[] = [
  {value:"personal-observation",label:"My observation"},
  {value:"venue-information",label:"Venue's information"},
  {value:"other",label:"Another source"},
];

export function ContributeScreen() {
  const {places} = useCatalog();
  const {state,dispatch} = usePlacesStore();
  const [placeId,setPlaceId] = useState("demo:state-library");
  const [placeSearch,setPlaceSearch] = useState("");
  const [feature,setFeature] = useState<FeatureType>("entrance");
  const [outcome,setOutcome] = useState<ObservationOutcome>("unsure");
  const [sourceType,setSourceType] = useState<ObservationSource>("personal-observation");
  const [observedOn,setObservedOn] = useState(new Date().toISOString().slice(0,10));
  const [description,setDescription] = useState("");
  const [editingId,setEditingId] = useState<string | null>(null);
  const [preview,setPreview] = useState(false);
  const [errors,setErrors] = useState<string[]>([]);
  const [feedback,setFeedback] = useState("");
  const [confirmDelete,setConfirmDelete] = useState<string | null>(null);
  const place=places.find(p=>p.id===placeId);
  const matches=places.filter(p=>(p.name+" "+p.suburb).toLowerCase().includes(placeSearch.trim().toLowerCase())).slice(0,8);

  function candidate(): AccessReport {
    return {
      id:editingId ?? createLocalId("report"),placeId,placeName:place?.name??"",
      feature,outcome,sourceType,observedOn,description:description.trim(),
      status:"draft",updatedAt:new Date().toISOString(),
    };
  }

  function check() {
    const issues = validateReport(candidate());
    setErrors(issues);
    setPreview(issues.length===0);
    if(issues.length) AccessibilityInfo.announceForAccessibility?.(issues.join(" "));
    else AccessibilityInfo.announceForAccessibility?.("Accessible report preview ready");
  }

  function save() {
    const draft=candidate();
    const issues=validateReport(draft);
    if(issues.length){setErrors(issues);setPreview(false);return;}
    dispatch({type:"save-report",report:draft});
    setEditingId(null);setDescription("");setPreview(false);setErrors([]);
    setFeedback("Access observation draft saved on your device. It has not been sent to MapAble, the venue or CripSquare.");
    AccessibilityInfo.announceForAccessibility?.("Observation saved locally");
  }

  return <Screen>
    <Heading>Contribute access knowledge</Heading>
    <Text style={S.body}>
      Help describe access in practical, respectful terms. Authoring is accessible by keyboard, voice input, switch and screen reader wherever those are supported by the device.
    </Text>
    <Notice kind="warn">This is a local authoring prototype. No report is submitted, moderated, verified or published to MapAble. Avoid real names, diagnoses and sensitive personal information.</Notice>
    <Card>
      <Text style={S.eyebrow}>Accessible authoring · ATAG 2.0</Text>
      <Heading level={2}>Write an accessibility observation</Heading>
      <Text style={S.muted}>
        Describe a specific feature and what you experienced or read. Include measurements when known, but never guess.
        Explain uncertainty and avoid claiming that your experience applies to everyone.
      </Text>
      <Field label="Find the place to describe" value={placeSearch} onChangeText={setPlaceSearch}
        placeholder="Search places" maxLength={80}
        help="Filtered to eight visible results; refine your search to locate another venue."/>
      <Choice label="Choose a place" value={placeId}
        options={matches.map(p=>({value:p.id,label:p.name}))}
        onChange={id=>{setPlaceId(id);setPreview(false);}}/>
      <Text style={S.small}>Selected: {place?.name??"No place available. Change the search."}</Text>
      <Choice<FeatureType> label="Which access feature?" options={featureOptions} value={feature} onChange={v=>{setFeature(v);setPreview(false);}}/>
      <Choice<ObservationOutcome> label="What did you find?" options={outcomeOptions} value={outcome} onChange={v=>{setOutcome(v);setPreview(false);}}/>
      <Choice<ObservationSource> label="Where does this information come from?" options={sourceOptions} value={sourceType} onChange={v=>{setSourceType(v);setPreview(false);}}/>
      <Field label="Observation date (YYYY-MM-DD)" value={observedOn} maxLength={10}
        onChangeText={v=>{setObservedOn(v);setPreview(false);}}
        placeholder="2026-10-28"
        help="A past or today's date. This date is not a live GPS check-in."/>
      <Field label="Describe the access feature" value={description} multiline maxLength={1200}
        onChangeText={v=>{setDescription(v);setPreview(false);}}
        placeholder="Example: Venue website reports a step-free entrance on the east side. I have not personally checked it."
        help="At least 25 characters. Describe the actual feature, source, route and uncertainty, rather than giving only a star rating."/>
      <Notice>
        Content quality check: this editor records a text description and its source method. Photo uploads are deliberately unavailable until image alternatives, captions and privacy-safe authoring are implemented.
      </Notice>
      {errors.length>0 && <Notice kind="error" live>{errors.join(" ")}</Notice>}
      {feedback && <Notice kind="success" live>{feedback}</Notice>}
      {preview && <View style={{gap:10}}>
        <Heading level={3}>Review your observation</Heading>
        <Text style={S.label}>{place?.name}: {feature.replace(/-/g," ")}</Text>
        <Text style={S.body}>Finding: {outcome}. Source: {sourceType}. Date: {observedOn}.</Text>
        <Text style={S.body}>{description.trim()}</Text>
        <Text style={S.small}>Visibility: local draft only. Verification: not independently verified.</Text>
      </View>}
      <View style={S.row}>
        {!preview
          ? <Action label="Check content and preview report" primary onPress={check}/>
          : <Action label={editingId?"Save edited observation draft":"Save observation draft"} primary onPress={save}/>}
        {preview && <Action label="Return to editing" onPress={()=>setPreview(false)}/>}
        {editingId && <Action label="Cancel editing" onPress={()=>{setEditingId(null);setDescription("");setPreview(false);setErrors([]);}}/>}
      </View>
    </Card>
    <Heading level={2}>My observation drafts ({state.reports.length})</Heading>
    {state.reports.length===0 && <Text style={S.muted}>You haven't saved any observations.</Text>}
    {state.reports.map(report=><Card key={report.id}>
      <Heading level={3}>{report.placeName}</Heading>
      <Text style={S.body}>{report.feature}: {report.outcome}</Text>
      <Text style={S.body}>{report.description}</Text>
      <Text style={S.small}>Recorded: {report.observedOn} · Source: {report.sourceType}</Text>
      <Text style={S.small}>Status: {report.status==="prepared-for-review"
        ? "Prepared for possible human review, locally only"
        : "Private local draft"}. No MapAble publication.</Text>
      <View style={S.row}>
        <Action label={"Edit observation for "+report.placeName} onPress={()=>{
          setPlaceId(report.placeId);setPlaceSearch("");setFeature(report.feature);setOutcome(report.outcome);
          setSourceType(report.sourceType);setObservedOn(report.observedOn);setDescription(report.description);
          setEditingId(report.id);setPreview(false);setErrors([]);setFeedback("");
        }}/>
        {report.status==="draft" && <Action label={"Mark observation ready for future human review at "+report.placeName}
          onPress={()=>dispatch({type:"prepare-report",id:report.id})}/>}
        {confirmDelete===report.id
          ? <>
            <Text style={S.small}>Permanently delete this local observation?</Text>
            <Action danger label="Confirm delete observation" onPress={()=>{dispatch({type:"delete-report",id:report.id});setConfirmDelete(null);}}/>
            <Action label="Keep observation" onPress={()=>setConfirmDelete(null)}/>
          </>
          : <Action danger label={"Delete observation for "+report.placeName} onPress={()=>setConfirmDelete(report.id)}/>}
      </View>
    </Card>)}
  </Screen>;
}
