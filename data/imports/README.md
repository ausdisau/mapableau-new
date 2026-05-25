# MapAble Access — legacy place data

Copy source files from operations storage into this folder for admin import:

| Source (Windows) | Target (repo) |
|------------------|---------------|
| `g:\Operations\MapAble\Place Data\MapAble.kml` | `data/imports/MapAble.kml` |
| `g:\Operations\MapAble\Place Data\accessible_locations_merged.geojson` | `data/imports/accessible_locations_merged.geojson` |

`MapAble.kml` is typically a **NetworkLink** to Google My Maps. The admin importer can also fetch the allowlisted feed:

`https://www.google.com/maps/d/kml?forcekml=1&mid=1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI`

GeoJSON import expects a **FeatureCollection** with Point features (`geometry.coordinates` as `[lng, lat]`) and properties such as `name`, `description`, `category`, or `address`.

These paths are gitignored when large; use **Admin → Access → Import** to upload or reference files on the server.
