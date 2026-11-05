import type { Coordinates, MapPlace } from "@/domain/location/entities";
export type NearbyMapProps = {
  position: Coordinates | null;
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
};
