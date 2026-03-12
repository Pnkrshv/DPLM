import { MapContainer, TileLayer } from "react-leaflet";

function MapComponent() {
  return (
    <MapContainer
      center={[55.753960, 37.620393]}
      zoom={10}
      attributionControl = {false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}

export default MapComponent;