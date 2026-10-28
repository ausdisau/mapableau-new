import { describe, expect, it } from "vitest";
import { addTourismStop, getTourismPlace, isTourismTrip, makeSydneyDemoTrip, moveTourismStop, removeTourismStop, SYDNEY_TOURISM_PLACES } from "@/lib/tourism/demo";
describe("MapAble Tourism Sydney pilot", () => {
 it("records sources and does not claim independent verification",()=>{expect(SYDNEY_TOURISM_PLACES).toHaveLength(6);for(const p of SYDNEY_TOURISM_PLACES){expect(p.sourceUrl).toMatch(/^https:\/\//);expect(p.checkedOn).toBeTruthy();}expect(getTourismPlace("sea-life")?.stepFree.status).toBe("requires-confirmation");});
 it("creates an editable itinerary",()=>{const t=makeSydneyDemoTrip();expect(t.days.map(d=>d.stopIds.length)).toEqual([2,2,2]);expect(isTourismTrip(t)).toBe(true);const moved=moveTourismStop(t,1,"mca",2);expect(moved.days[0].stopIds).toEqual(["opera"]);expect(t.days[0].stopIds).toContain("mca");expect(moveTourismStop(t,1,"mca",1,1).days[0].stopIds).toEqual(["opera","mca"]);expect(removeTourismStop(t,"mca").days[0].stopIds).toEqual(["opera"]);expect(addTourismStop(removeTourismStop(t,"mca"),"mca",3).days[2].stopIds).toContain("mca");});
 it("rejects unknown stop ids",()=>{const t=makeSydneyDemoTrip();expect(addTourismStop(t,"not-a-place",1)).toBe(t);expect(isTourismTrip({...t,days:[{day:1,title:"Bad",stopIds:["not-a-place"]}]})).toBe(false);});
});
