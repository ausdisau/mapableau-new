# Optional CSS snippet for the Leaflet marker component

Add this to your global CSS if the project uses the provided `SuburbGuideMap` component.

```css
.mapable-marker {
  display: grid;
  place-items: center;
  border-radius: 999px 999px 999px 0;
  background: #0f766e;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  transform: rotate(-45deg);
  border: 3px solid white;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.22);
}

.mapable-marker span {
  transform: rotate(45deg);
}

.mapable-marker-selected {
  background: #facc15;
  color: #0f172a;
}

.mapable-popup {
  max-width: 260px;
}

.mapable-popup strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #0f172a;
}

.mapable-popup p {
  margin: 0.35rem 0;
  line-height: 1.4;
}

.mapable-popup a {
  display: inline-flex;
  margin-top: 0.5rem;
  font-weight: 700;
  color: #0f766e;
}
```
