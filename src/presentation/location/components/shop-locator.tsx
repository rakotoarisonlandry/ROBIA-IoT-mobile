import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GuideSpot } from '../../onboarding/guide-spot';
import { useShopLocator } from '../hooks/use-shop-locator';
import { distanceLabel, durationLabel } from '../models/route-labels';
import { LocationIcon } from './location-icon';
import NearbyMap from './nearby-map';
import { locatorStyles as s } from './shop-locator.styles';

type Props = { shops: { name: string; address: string }[]; onBook: (index: number) => void };
export default function ShopLocator({ shops, onBook }: Props) {
  const { status, location, message, canAskAgain, locate, area, setArea, searchArea,
    mode, setMode, selected, select, places, route, mapError, position, isLocating,
    isSearching, isRouting, hasSearched, search, directions, clearRoute, openSettings } = useShopLocator();
  const [showInstructions, setShowInstructions] = useState(false);
  const normalized = (value: string) => value.toLocaleLowerCase('fr-FR').trim();
  const bookingIndex = selected ? shops.findIndex(shop => normalized(shop.name) === normalized(selected.name)) : -1;
  return <View style={s.container}>
    <View style={s.heading}>
      <Text style={s.eyebrow}>VOTRE VISITE COMMENCE ICI</Text>
      <Text style={s.title}>Trouvez votre boutique Orange.</Text>
      <Text style={s.description}>Votre position, les boutiques proches et votre itinéraire, directement dans Robia.</Text>
    </View>
    <GuideSpot name="shops-position" order={1} text="Utilisez votre position pour trouver les boutiques proches. Vous pouvez aussi rechercher une ville sans partager votre position." style={s.locationCard}>
      <View style={s.locationIcon}><LocationIcon /></View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.cardTitle}>{position ? 'Vous êtes ici' : 'Où souhaitez-vous nous retrouver ?'}</Text>
        <Text style={s.small}>{position ? `Position actualisée${position.accuracy != null ? ` · précision ± ${Math.round(position.accuracy)} m` : ''}` : 'Activez la localisation ou recherchez une ville.'}</Text>
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
    <GuideSpot name="shops-search" order={2} text="Saisissez une ville ou un quartier, puis lancez la recherche. Les résultats Google s’affichent sur la carte et dans la liste." style={{ gap: 12 }}>
      <View style={s.searchRow}><TextInput style={s.input} value={area} onChangeText={setArea} placeholder="Une ville ou un quartier, par ex. Analakely" accessibilityLabel="Ville ou quartier" returnKeyType="search" onSubmitEditing={() => void search()} /></View>
      <Pressable disabled={isSearching} style={({ pressed }) => [s.primaryButton, (pressed || isSearching) && { opacity: .7 }]} onPress={() => void search()}>
        {isSearching ? <ActivityIndicator size="small" color="white" /> : <LocationIcon size={21} color="white" />}
        <Text style={s.primaryText}>{isSearching ? 'Recherche des boutiques…' : area.trim() ? 'Chercher dans cette zone' : 'Boutiques autour de moi'}</Text>
      </Pressable>
    </GuideSpot>
    <GuideSpot name="shops-map" order={3} text="Touchez un repère ou une boutique dans la liste. Choisissez voiture ou marche puis « Afficher l’itinéraire » : le trajet reste dans l’application." style={x.mapSurface}>
      <NearbyMap position={position} places={places} selected={selected} onSelect={select} route={route} mode={mode} searchArea={searchArea} />
      {(isSearching || isRouting) && <View style={x.mapLoading} pointerEvents="none"><ActivityIndicator size="small" color="#ff6600" /><Text style={s.small}>{isRouting ? 'Calcul du trajet…' : 'Recherche en cours…'}</Text></View>}
    </GuideSpot>
    {!!mapError && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{mapError}</Text><Pressable onPress={() => { if (selected && position) directions(selected); else void search(); }}><Text style={s.orangeText}>Réessayer</Text></Pressable></View>}
    <View style={s.transport}>
      <Text style={s.cardTitle}>Votre mode de déplacement</Text>
      <View style={s.transportOptions}>{([{ value: 'driving', label: 'En voiture' }, { value: 'walking', label: 'À pied' }] as const).map(item => <Pressable key={item.value} onPress={() => setMode(item.value)} accessibilityRole="radio" accessibilityState={{ checked: mode === item.value }} style={[s.modeButton, mode === item.value && s.modeActive]}><Text style={[s.modeText, mode === item.value && { color: '#ff6600' }]}>{item.label}</Text></Pressable>)}</View>
    </View>
    {selected && <View style={s.selectedCard}>
      <Text style={s.eyebrow}>VOTRE BOUTIQUE</Text><Text style={s.cardTitle}>{selected.name}</Text>
      {!!selected.address && <Text style={s.small}>{selected.address}</Text>}
      <View style={s.actions}>
        <Pressable disabled={isRouting || isLocating} style={s.bookingButton} onPress={() => directions(selected)}><Text style={s.bookingText}>{isRouting ? 'Calcul du trajet…' : 'Afficher l’itinéraire'}</Text></Pressable>
        {bookingIndex >= 0 && <Pressable style={s.outlineButton} onPress={() => onBook(bookingIndex)}><Text style={s.orangeText}>Réserver ici (démo)</Text></Pressable>}
      </View>
      {!position && <Text style={s.small}>Votre position sera demandée pour calculer le point de départ.</Text>}
      {bookingIndex < 0 && <Text style={s.caption}>La réservation Robia n’est pas encore disponible pour cette boutique.</Text>}
    </View>}
    {route && <View style={x.routeCard}>
      <View style={x.row}><Text style={s.cardTitle}>Aperçu du trajet</Text><Pressable onPress={clearRoute} accessibilityLabel="Effacer l’itinéraire" style={x.clear}><Text style={s.orangeText}>Effacer</Text></Pressable></View>
      <View style={x.row}><Text style={x.duration}>{durationLabel(route.durationSeconds)}</Text><Text style={s.small}>{distanceLabel(route.distanceMeters)} · {mode === 'walking' ? 'À pied' : 'En voiture'}</Text></View>
      <Text style={s.caption}>Estimation Google · le trajet est affiché en orange sur la carte.</Text>
      {!!route.steps.length && <Pressable style={x.clear} onPress={() => setShowInstructions(value => !value)} accessibilityState={{ expanded: showInstructions }}><Text style={s.orangeText}>{showInstructions ? 'Masquer les indications' : 'Voir les indications du trajet'}</Text></Pressable>}
      {showInstructions && route.steps.map((step, index) => <View key={index} style={x.instruction}><Text style={x.instructionNumber}>{index + 1}</Text><View style={{ flex: 1 }}><Text style={x.instructionText}>{step.instruction}</Text><Text style={s.caption}>{distanceLabel(step.distanceMeters)}</Text></View></View>)}
      {route.warnings.map(warning => <Text key={warning} style={s.small}>{warning}</Text>)}
    </View>}
    <View style={s.demoHeading}><Text style={s.sectionTitle}>{hasSearched ? `${places.length} boutique${places.length > 1 ? 's' : ''} trouvée${places.length > 1 ? 's' : ''}` : 'Les boutiques autour de vous'}</Text><Text style={s.small}>{position ? 'Classées par distance à vol d’oiseau depuis votre position.' : 'Recherchez une ville ou utilisez votre position pour voir les boutiques.'}</Text></View>
    {hasSearched && !places.length && <View style={s.shopCard}><Text style={s.cardTitle}>Aucune boutique dans cette recherche</Text><Text style={s.small}>Essayez une ville voisine ou un autre quartier.</Text></View>}
    <View style={s.shopList}>{places.map(place => <Pressable key={place.placeId ?? place.name} onPress={() => select(place)} accessibilityRole="button" accessibilityState={{ selected: selected?.placeId === place.placeId }} style={[s.shopCard, selected?.placeId === place.placeId && x.selected]}>
      <View style={s.shopTop}><View style={s.orangeLogo}><Text style={s.logoText}>orange</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={s.cardTitle}>{place.name}</Text><Text style={s.small}>{place.address}</Text></View>{place.straightLineMeters != null && <Text style={s.orangeText}>{distanceLabel(place.straightLineMeters)}</Text>}</View>
      <Text style={s.caption}>Touchez pour préparer votre visite et afficher le trajet.</Text>
    </Pressable>)}</View>
    {hasSearched && <Text style={s.caption}>Informations de lieux fournies par Google Maps.</Text>}
  </View>;
}
const x = StyleSheet.create({
  mapSurface: { position: 'relative' },
  mapLoading: { position: 'absolute', top: 12, left: 12, backgroundColor: 'white', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeCard: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ffe0c7', borderRadius: 12, padding: 19, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 15, justifyContent: 'space-between' },
  duration: { fontSize: 27, fontWeight: '700', color: '#ff6600', letterSpacing: -.6 },
  clear: { minHeight: 44, justifyContent: 'center' },
  instruction: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 12 },
  instructionNumber: { color: '#ff6600', fontSize: 12, fontWeight: '700', paddingTop: 2 },
  instructionText: { fontSize: 12, lineHeight: 20, color: '#555' },
  selected: { borderColor: '#ff6600', backgroundColor: '#fff8f2' },
});
