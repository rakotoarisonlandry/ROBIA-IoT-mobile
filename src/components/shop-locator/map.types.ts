import type { Coordinates, MapPlace } from "@/utils/google-maps";
export type NearbyMapProps = {
  position: Coordinates | null;
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
};
