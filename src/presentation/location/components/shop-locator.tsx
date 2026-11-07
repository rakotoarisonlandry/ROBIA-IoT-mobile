import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GuideSpot } from '../../onboarding/guide-spot';
import { useShopLocator } from '../hooks/use-shop-locator';
import { distanceLabel } from '../models/route-labels';
import { LocationIcon } from './location-icon';
import NearbyMap from './nearby-map';
import { locatorStyles as s } from './shop-locator.styles';

type Props = { shops: { id: string; name: string; address: string }[]; onBook: (index: number) => void };
export default function ShopLocator({ shops, onBook }: Props) {
  const { status, location, message, canAskAgain, locate, area, setArea,
    selected, select, places, mapError, position, isLocating,
    isSearching, search, openSettings } = useShopLocator();
  const bookingIndex = selected ? shops.findIndex(shop => shop.id === selected.shopId) : -1;
  const locatedCount = places.filter(place => place.coordinates).length;
  return <View style={s.container}>
    <View style={s.heading}>
      <Text style={s.eyebrow}>VOTRE VISITE COMMENCE ICI</Text>
      <Text style={s.title}>Trouvez votre boutique Orange.</Text>
      <Text style={s.description}>Votre position et les adresses du catalogue Robia, directement dans l’application.</Text>
    </View>
    <GuideSpot name="shops-position" order={1} text="Affichez votre position sur la carte. Les boutiques dont la position est renseignée sont classées par distance à vol d’oiseau." style={s.locationCard}>
      <View style={s.locationIcon}><LocationIcon /></View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.cardTitle}>{position ? 'Vous êtes ici' : 'Où souhaitez-vous nous retrouver ?'}</Text>
        <Text style={s.small}>{position ? 'Position actualisée' + (position.accuracy != null ? ' · précision ± ' + Math.round(position.accuracy) + ' m' : '') : 'Affichez votre position ou consultez directement les adresses.'}</Text>
        {location && <Text style={s.caption}>Relevée à {new Date(location.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>}
      </View>
      <Pressable disabled={isLocating || isSearching} onPress={() => void locate()} style={[s.locateButton, isLocating && { opacity: .6 }]} accessibilityLabel="Actualiser ma position">
        {isLocating ? <ActivityIndicator size="small" color="#ff6600" /> : <LocationIcon size={17} />}
        <Text style={s.orangeText}>{isLocating ? 'Recherche…' : position ? 'Actualiser' : 'Me localiser'}</Text>
      </Pressable>
    </GuideSpot>
    {!!message && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{message}</Text>
      {status === 'denied' && !canAskAgain && (Platform.OS === 'web' ? <Text style={s.small}>Autorisez la localisation dans les paramètres du navigateur.</Text> : <Pressable onPress={openSettings}><Text style={s.orangeText}>Ouvrir les paramètres</Text></Pressable>)}
    </View>}
    <GuideSpot name="shops-search" order={2} text="Filtrez les adresses du catalogue Robia par nom ou quartier. Cette liste reste disponible sans carte et sans localisation." style={{ gap: 12 }}>
      <View style={s.searchRow}><TextInput style={s.input} value={area} onChangeText={setArea} maxLength={120} placeholder="Nom ou quartier, par ex. Analakely" placeholderTextColor="#888" accessibilityLabel="Filtrer les boutiques du catalogue" returnKeyType="search" onSubmitEditing={() => void search()} /></View>
      <Pressable disabled={isSearching} style={({ pressed }) => [s.primaryButton, (pressed || isSearching) && { opacity: .7 }]} onPress={() => void search()}>
        {isSearching ? <ActivityIndicator size="small" color="white" /> : <LocationIcon size={21} color="white" />}
        <Text style={s.primaryText}>{isSearching ? 'Recherche des boutiques…' : area.trim() ? 'Filtrer les boutiques' : 'Voir les boutiques du catalogue'}</Text>
      </Pressable>
    </GuideSpot>
    <GuideSpot name="shops-map" order={3} text="La carte affiche votre position et les repères renseignés dans Robia. Touchez une boutique de la liste pour consulter son adresse et réserver." style={x.mapSurface}>
      <NearbyMap position={position} places={places} selected={selected} onSelect={select} />
    </GuideSpot>
    {!!mapError && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{mapError}</Text><Pressable onPress={() => void search()}><Text style={s.orangeText}>Réessayer</Text></Pressable></View>}
    {selected && <View style={s.selectedCard}>
      <Text style={s.eyebrow}>VOTRE BOUTIQUE{selected.isDemo ? ' · DÉMONSTRATION' : ''}</Text>
      <Text style={s.cardTitle}>{selected.name}</Text>
      <Text style={s.small}>{selected.address}</Text>
      {selected.straightLineMeters != null && <Text style={s.orangeText}>{distanceLabel(selected.straightLineMeters)} à vol d’oiseau</Text>}
      {!selected.coordinates && <Text style={s.caption}>Position sur la carte non renseignée.</Text>}
      {bookingIndex >= 0 && <View style={s.actions}><Pressable style={s.bookingButton} onPress={() => onBook(bookingIndex)}><Text style={s.bookingText}>Réserver ici{selected.isDemo ? ' (démo)' : ''}</Text></Pressable></View>}
    </View>}
    <View style={s.demoHeading}>
      <Text style={s.sectionTitle}>{places.length} boutique{places.length > 1 ? 's' : ''} dans le catalogue</Text>
      <Text style={s.small}>{position && locatedCount ? 'Distances à vol d’oiseau ; les adresses sans coordonnées sont en fin de liste.' : 'Filtrez les adresses par nom ou quartier.'}</Text>
    </View>
    {!isSearching && !places.length && <View style={s.shopCard}><Text style={s.cardTitle}>Aucune boutique dans le catalogue pour cette recherche</Text><Text style={s.small}>Essayez un autre nom ou effacez le filtre.</Text></View>}
    <View style={s.shopList}>{places.map(place => <Pressable key={place.shopId} onPress={() => select(place)} accessibilityRole="button" accessibilityState={{ selected: selected?.shopId === place.shopId }} style={[s.shopCard, selected?.shopId === place.shopId && x.selected]}>
      <View style={s.shopTop}><View style={s.orangeLogo}><Text style={s.logoText}>orange</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={s.cardTitle}>{place.name}</Text><Text style={s.small}>{place.address}</Text></View>{place.straightLineMeters != null && <Text style={s.orangeText}>{distanceLabel(place.straightLineMeters)}</Text>}</View>
      <Text style={s.caption}>{place.isDemo ? 'Adresse de démonstration · ' : ''}{place.coordinates ? 'Touchez pour préparer votre visite.' : 'Position sur la carte non renseignée.'}</Text>
    </Pressable>)}</View>
    {!!places.length && <Text style={s.caption}>Adresses du catalogue Robia. {locatedCount} repère{locatedCount > 1 ? 's' : ''} disponible{locatedCount > 1 ? 's' : ''} sur la carte.</Text>}
  </View>;
}
const x = StyleSheet.create({
  mapSurface: { position: 'relative' },
  selected: { borderColor: '#ff6600', backgroundColor: '#fff8f2' },
});
