import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

function FlyTo({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 10);
            map.setZoom(11);
        }
    }, [position]);

    return null;
}

function MapComponent({ position }) {
    return (
        <MapContainer
            center={[55.753960, 37.620393]}
            zoom={10}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
            fadeAnimation={true}
        >
            <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && <Marker position={position} />}
            <FlyTo position={position} />
        </MapContainer>
    );
}

export default MapComponent;