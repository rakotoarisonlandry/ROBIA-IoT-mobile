import type { Coordinates, MapPlace, MapRoute, TravelMode } from "@/domain/location/entities";
export type NearbyMapProps = {
  position: Coordinates | null;
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
  places: MapPlace[];
  route: MapRoute | null;
  mode: TravelMode;
  searchArea: string;
};
